import {
  CreateTextSharePayload,
  CreateShareResult,
  EXPIRATION_SECONDS,
  FREE_TIER_LIMITS,
  InitImageUploadPayload,
  InitImageUploadResult,
  FinalizeImageUploadResult,
  PlanType,
  ShareContentResponse,
  ShareMetadata,
} from '@blinkshare/shared';
import { Env } from '../types/env';
import { ShareRecord, ShareRepository, UploadSessionRecord } from '../repositories/shareRepository';
import {
  generateDeletionToken,
  generateSecureId,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from '../lib/crypto';
import { getCurrentTimestamp } from '../lib/clock';
import { ImageStorageService } from './imageStorageService';

export class ShareService {
  private repo: ShareRepository;
  private storage: ImageStorageService;

  constructor(private env: Env) {
    this.repo = new ShareRepository(env.DB);
    this.storage = new ImageStorageService(env);
  }

  async createTextShare(
    payload: CreateTextSharePayload,
    plan: PlanType,
    ownerId?: string
  ): Promise<CreateShareResult> {
    const maxTextBytes = parseInt(this.env.MAX_TEXT_BYTES || '', 10) || FREE_TIER_LIMITS.maxTextBytes;
    const textBytes = new TextEncoder().encode(payload.textContent).length;

    if (textBytes > maxTextBytes) {
      throw new Error(`Text content exceeds free tier limit of ${Math.round(maxTextBytes / 1024)} KB`);
    }

    // All features are 100% free for everyone!
    let passwordHash: string | null = null;
    if (payload.password) {
      passwordHash = await hashPassword(payload.password);
    }

    const burnAfterRead = Boolean(payload.burnAfterRead);
    const allowDownload = payload.allowDownload !== false;

    // Custom alias support (Free for all users)
    let id: string;
    if (payload.customAlias && payload.customAlias.trim() !== '') {
      const sanitizedAlias = payload.customAlias.trim();
      const existing = await this.repo.getShareById(sanitizedAlias);
      if (existing) {
        throw new Error('Custom alias is already in use');
      }
      id = sanitizedAlias;
    } else {
      id = generateSecureId(10);
    }

    const now = getCurrentTimestamp(this.env);
    const expiresAt = now + EXPIRATION_SECONDS; // Fixed strictly to 300 seconds (5 min)

    const rawDeletionToken = generateDeletionToken();
    const deletionTokenHash = await sha256Hex(rawDeletionToken);

    await this.repo.createShare({
      id,
      content_type: 'text',
      created_at: now,
      expires_at: expiresAt,
      title: payload.title || null,
      text_content: payload.textContent,
      text_format: payload.textFormat || 'plain_text',
      syntax_language: payload.syntaxLanguage || 'plaintext',
      original_filename: null,
      storage_key: null,
      r2_object_key: null,
      file_mime_type: null,
      file_size: textBytes,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead ? 1 : 0,
      owner_id: ownerId || null,
      deletion_token_hash: deletionTokenHash,
      allow_download: allowDownload ? 1 : 0,
    });

    const appUrl = (this.env.APP_URL || '').replace(/\/$/, '');
    const shareUrl = `${appUrl}/t/${id}`;

    return {
      id,
      shareUrl,
      deletionToken: rawDeletionToken,
      createdAt: now,
      expiresAt,
      contentType: 'text',
    };
  }

  async getShareContent(
    id: string,
    providedPassword?: string
  ): Promise<ShareContentResponse> {
    const share = await this.repo.getShareById(id);
    const now = getCurrentTimestamp(this.env);

    if (!share) {
      const err = new Error('Share not found');
      (err as any).status = 404;
      throw err;
    }

    // MANDATORY REQUIREMENT: If server timestamp >= expires_at, deny access immediately!
    if (now >= share.expires_at || share.is_deleted === 1) {
      // Lazy cleanup: purge immediately
      const storageKey = share.storage_key || share.r2_object_key;
      if (storageKey) {
        this.storage.deleteImage(storageKey).catch(() => {});
      }
      this.repo.purgeShare(id).catch(() => {});
      const err = new Error('This share has expired and is no longer accessible');
      (err as any).status = 410;
      throw err;
    }

    if (share.is_burned === 1) {
      const err = new Error('This share was burned after its first view');
      (err as any).status = 410;
      throw err;
    }

    const secondsRemaining = Math.max(0, share.expires_at - now);

    const metadata: ShareMetadata = {
      id: share.id,
      contentType: share.content_type,
      createdAt: share.created_at,
      expiresAt: share.expires_at,
      title: share.title,
      textFormat: share.text_format as any,
      syntaxLanguage: share.syntax_language as any,
      originalFilename: share.original_filename,
      fileMimeType: share.file_mime_type,
      fileSize: share.file_size,
      hasPassword: Boolean(share.password_hash),
      burnAfterRead: share.burn_after_read === 1,
      allowDownload: share.allow_download === 1,
      viewCount: share.view_count,
      isExpired: false,
      secondsRemaining,
    };

    // Password verification
    if (share.password_hash) {
      if (!providedPassword) {
        return {
          metadata,
          isPasswordRequired: true,
        };
      }

      const isValid = await verifyPassword(providedPassword, share.password_hash);
      if (!isValid) {
        const err = new Error('Invalid password');
        (err as any).status = 401;
        throw err;
      }
    }

    // Atomic burn after read
    if (share.burn_after_read === 1) {
      const burned = await this.repo.atomicBurnShare(id);
      if (!burned) {
        const err = new Error('This share was already burned by another viewer');
        (err as any).status = 410;
        throw err;
      }
    }

    // Increment view count
    await this.repo.incrementViewCount(id);

    return {
      metadata,
      textContent: share.text_content ?? undefined,
      isPasswordRequired: false,
      isBurned: share.burn_after_read === 1,
    };
  }

  // Image Upload Workflow via Cloudflare Workers KV
  async initImageUpload(
    payload: InitImageUploadPayload,
    plan: PlanType,
    ownerId?: string
  ): Promise<InitImageUploadResult> {
    if (!this.storage.isAvailable()) {
      const err = new Error(
        'Image storage (Cloudflare Workers KV) is currently unavailable. Text sharing remains operational.'
      );
      (err as any).status = 503;
      throw err;
    }

    const maxImageBytes = parseInt(this.env.MAX_IMAGE_BYTES || '', 10) || FREE_TIER_LIMITS.maxImageBytes;

    if (payload.fileSize > maxImageBytes) {
      throw new Error(`Image size exceeds free tier limit of ${Math.round(maxImageBytes / (1024 * 1024))} MB`);
    }

    let passwordHash: string | null = null;
    if (payload.password) {
      passwordHash = await hashPassword(payload.password);
    }

    const burnAfterRead = Boolean(payload.burnAfterRead);
    const allowDownload = payload.allowDownload !== false;

    if (payload.customAlias && payload.customAlias.trim() !== '') {
      const sanitizedAlias = payload.customAlias.trim();
      const existing = await this.repo.getShareById(sanitizedAlias);
      if (existing) {
        throw new Error('Custom alias is already in use');
      }
    }

    const uploadToken = generateSecureId(24);
    const storageKey = `img:${uploadToken}`;
    const now = getCurrentTimestamp(this.env);

    await this.repo.createUploadSession({
      token: uploadToken,
      filename: payload.filename,
      file_size: payload.fileSize,
      file_mime_type: payload.fileMimeType,
      storage_key: storageKey,
      r2_key: storageKey,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead ? 1 : 0,
      allow_download: allowDownload ? 1 : 0,
      custom_alias: payload.customAlias || null,
      owner_id: ownerId || null,
      created_at: now,
      expires_at: now + 600, // 10 minutes session timeout
      is_finalized: 0,
    });

    return {
      uploadToken,
      uploadUrl: `/api/uploads/${uploadToken}`,
      maxBytes: maxImageBytes,
      expiresInSeconds: 600,
    };
  }

  async storeUploadData(uploadToken: string, stream: ReadableStream, contentLength?: number): Promise<void> {
    const session = await this.repo.getUploadSession(uploadToken);
    const now = getCurrentTimestamp(this.env);

    if (!session || session.is_finalized === 1 || now >= session.expires_at) {
      const err = new Error('Upload session expired or invalid');
      (err as any).status = 400;
      throw err;
    }

    if (contentLength && contentLength > session.file_size * 1.05) {
      const err = new Error('Uploaded stream exceeds declared size');
      (err as any).status = 413;
      throw err;
    }

    const storageKey = session.storage_key || session.r2_key;
    if (!storageKey) {
      const err = new Error('Storage key missing from upload session');
      (err as any).status = 400;
      throw err;
    }
    // Write binary bytes directly into Workers KV
    await this.storage.uploadImage(storageKey, stream, session.file_mime_type, session.file_size);
  }

  async finalizeImageUpload(uploadToken: string): Promise<FinalizeImageUploadResult> {
    const session = await this.repo.getUploadSession(uploadToken);
    const now = getCurrentTimestamp(this.env);

    if (!session || session.is_finalized === 1 || now >= session.expires_at) {
      const err = new Error('Upload session invalid or expired');
      (err as any).status = 400;
      throw err;
    }

    const storageKey = session.storage_key || session.r2_key;
    if (!storageKey) {
      const err = new Error('Storage key missing from upload session');
      (err as any).status = 400;
      throw err;
    }

    // Verify object exists in KV
    const obj = await this.storage.getImage(storageKey);
    if (!obj) {
      const err = new Error('No uploaded image found in storage');
      (err as any).status = 400;
      throw err;
    }

    const shareId = session.custom_alias || generateSecureId(10);
    const expiresAt = now + EXPIRATION_SECONDS; // Fixed strictly to 300 seconds (5 min)
    const rawDeletionToken = generateDeletionToken();
    const deletionTokenHash = await sha256Hex(rawDeletionToken);

    await this.repo.createShare({
      id: shareId,
      content_type: 'image',
      created_at: now,
      expires_at: expiresAt,
      title: session.filename,
      text_content: null,
      text_format: null,
      syntax_language: null,
      original_filename: session.filename,
      storage_key: storageKey,
      r2_object_key: storageKey,
      file_mime_type: session.file_mime_type,
      file_size: session.file_size,
      password_hash: session.password_hash,
      burn_after_read: session.burn_after_read,
      owner_id: session.owner_id || null,
      deletion_token_hash: deletionTokenHash,
      allow_download: session.allow_download,
    });

    await this.repo.finalizeUploadSession(uploadToken);

    const appUrl = (this.env.APP_URL || '').replace(/\/$/, '');
    const shareUrl = `${appUrl}/i/${shareId}`;

    return {
      id: shareId,
      shareUrl,
      deletionToken: rawDeletionToken,
      createdAt: now,
      expiresAt,
      contentType: 'image',
      fileSize: session.file_size,
      fileMimeType: session.file_mime_type,
    };
  }

  async getImageStream(
    id: string,
    providedPassword?: string
  ): Promise<{
    stream: ReadableStream;
    contentType: string;
    filename: string;
    fileSize: number;
    allowDownload: boolean;
  }> {
    const share = await this.repo.getShareById(id);
    const now = getCurrentTimestamp(this.env);

    if (!share || share.content_type !== 'image') {
      const err = new Error('Image share not found');
      (err as any).status = 404;
      throw err;
    }

    const storageKey = share.storage_key || share.r2_object_key;

    // MANDATORY REQUIREMENT: Before returning, check D1.
    // If expired or deleted, reject access immediately and purge!
    if (now >= share.expires_at || share.is_deleted === 1) {
      if (storageKey) {
        this.storage.deleteImage(storageKey).catch(() => {});
      }
      this.repo.purgeShare(id).catch(() => {});
      const err = new Error('This share has expired and is no longer accessible');
      (err as any).status = 410;
      throw err;
    }

    if (share.is_burned === 1) {
      const err = new Error('This image was burned after its first view');
      (err as any).status = 410;
      throw err;
    }

    if (share.password_hash) {
      if (!providedPassword) {
        const err = new Error('Password required');
        (err as any).status = 401;
        throw err;
      }
      const isValid = await verifyPassword(providedPassword, share.password_hash);
      if (!isValid) {
        const err = new Error('Invalid password');
        (err as any).status = 401;
        throw err;
      }
    }

    if (!storageKey) {
      const err = new Error('Image data missing');
      (err as any).status = 404;
      throw err;
    }

    // Only retrieve content from KV after all D1 validity checks pass!
    const obj = await this.storage.getImage(storageKey);
    if (!obj) {
      const err = new Error('Image object not found in storage');
      (err as any).status = 404;
      throw err;
    }

    if (share.burn_after_read === 1) {
      const burned = await this.repo.atomicBurnShare(id);
      if (!burned) {
        const err = new Error('This image was already burned by another viewer');
        (err as any).status = 410;
        throw err;
      }
      // Delete from storage immediately upon successful burn view
      this.storage.deleteImage(storageKey).catch(() => {});
    }

    await this.repo.incrementViewCount(id);

    return {
      stream: obj.stream,
      contentType: share.file_mime_type || obj.contentType || 'image/jpeg',
      filename: share.original_filename || 'image.jpg',
      fileSize: share.file_size || obj.size || 0,
      allowDownload: share.allow_download === 1,
    };
  }

  async deleteShare(id: string, deletionToken?: string, ownerId?: string): Promise<void> {
    const share = await this.repo.getShareById(id);
    if (!share) {
      const err = new Error('Share not found');
      (err as any).status = 404;
      throw err;
    }

    let authorized = false;

    if (deletionToken && share.deletion_token_hash) {
      const tokenHash = await sha256Hex(deletionToken);
      if (tokenHash === share.deletion_token_hash) {
        authorized = true;
      }
    }

    if (!authorized && ownerId && share.owner_id === ownerId) {
      authorized = true;
    }

    if (!authorized) {
      const err = new Error('Unauthorized to delete this share');
      (err as any).status = 403;
      throw err;
    }

    const storageKey = share.storage_key || share.r2_object_key;
    // Delete KV object first
    if (storageKey) {
      try {
        await this.storage.deleteImage(storageKey);
      } catch (err: any) {
        // Enqueue retry
        await this.repo.enqueueRetry(
          generateSecureId(16),
          'kv_image',
          storageKey,
          err?.message || 'KV delete failure',
          getCurrentTimestamp(this.env)
        );
      }
    }

    // Then delete D1 record
    await this.repo.purgeShare(id);
  }

  async reportAbuse(shareId: string, reason: string, details?: string): Promise<void> {
    const share = await this.repo.getShareById(shareId);
    if (!share) {
      const err = new Error('Share not found');
      (err as any).status = 404;
      throw err;
    }
    const now = getCurrentTimestamp(this.env);
    await this.repo.createAbuseReport(
      generateSecureId(16),
      shareId,
      reason,
      details || null,
      now
    );
  }
}

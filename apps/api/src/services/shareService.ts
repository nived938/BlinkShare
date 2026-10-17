import {
  CreateTextSharePayload,
  CreateShareResult,
  EXPIRATION_SECONDS,
  InitImageUploadPayload,
  InitImageUploadResult,
  FinalizeImageUploadResult,
  PLANS,
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

export class ShareService {
  private repo: ShareRepository;

  constructor(private env: Env) {
    this.repo = new ShareRepository(env.DB);
  }

  async createTextShare(
    payload: CreateTextSharePayload,
    plan: PlanType,
    ownerId?: string
  ): Promise<CreateShareResult> {
    const limits = PLANS[plan];
    const textBytes = new TextEncoder().encode(payload.textContent).length;

    if (textBytes > limits.maxTextBytes) {
      throw new Error(`Text content exceeds plan limit of ${Math.round(limits.maxTextBytes / 1024)} KB`);
    }

    // Password protection check
    let passwordHash: string | null = null;
    if (payload.password) {
      if (!limits.passwordProtection) {
        throw new Error('Password protection requires a Plus or Pro plan');
      }
      passwordHash = await hashPassword(payload.password);
    }

    // Burn after read check
    let burnAfterRead = false;
    if (payload.burnAfterRead) {
      if (!limits.burnAfterFirstView) {
        throw new Error('Burn-after-first-view requires a Plus or Pro plan');
      }
      burnAfterRead = true;
    }

    // Download restriction check
    let allowDownload = true;
    if (payload.allowDownload === false) {
      if (!limits.downloadRestrictionOption) {
        throw new Error('Disabling download requires a Plus or Pro plan');
      }
      allowDownload = false;
    }

    // Custom alias check
    let id: string;
    if (payload.customAlias && payload.customAlias.trim() !== '') {
      if (!limits.customShareAlias) {
        throw new Error('Custom share aliases require a Plus or Pro plan');
      }
      const existing = await this.repo.getShareById(payload.customAlias.trim());
      if (existing) {
        throw new Error('Custom alias is already in use');
      }
      id = payload.customAlias.trim();
    } else {
      id = generateSecureId(10);
    }

    const now = getCurrentTimestamp(this.env);
    const expiresAt = now + EXPIRATION_SECONDS; // Fixed 300 seconds

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
      r2_object_key: null,
      file_mime_type: 'text/plain',
      file_size: textBytes,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead ? 1 : 0,
      owner_id: ownerId || null,
      deletion_token_hash: deletionTokenHash,
      allow_download: allowDownload ? 1 : 0,
    });

    const appUrl = (this.env.APP_URL || '').replace(/\/$/, '');
    const shareUrl = `${appUrl}/s/${id}`;

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

    // MANDATORY REQUIREMENT: If current server timestamp >= expires_at, deny access immediately
    if (now >= share.expires_at || share.is_deleted === 1) {
      // Lazy cleanup
      this.repo.purgeShare(id).catch(() => {});
      const err = new Error('This share has expired');
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

  // Image Upload Workflow
  async initImageUpload(
    payload: InitImageUploadPayload,
    plan: PlanType,
    ownerId?: string
  ): Promise<InitImageUploadResult> {
    const limits = PLANS[plan];

    if (payload.fileSize > limits.maxImageBytes) {
      throw new Error(`Image size exceeds plan limit of ${Math.round(limits.maxImageBytes / (1024 * 1024))} MB`);
    }

    let passwordHash: string | null = null;
    if (payload.password) {
      if (!limits.passwordProtection) {
        throw new Error('Password protection requires a Plus or Pro plan');
      }
      passwordHash = await hashPassword(payload.password);
    }

    let burnAfterRead = false;
    if (payload.burnAfterRead) {
      if (!limits.burnAfterFirstView) {
        throw new Error('Burn-after-first-view requires a Plus or Pro plan');
      }
      burnAfterRead = true;
    }

    let allowDownload = true;
    if (payload.allowDownload === false) {
      if (!limits.downloadRestrictionOption) {
        throw new Error('Disabling download requires a Plus or Pro plan');
      }
      allowDownload = false;
    }

    if (payload.customAlias && payload.customAlias.trim() !== '') {
      if (!limits.customShareAlias) {
        throw new Error('Custom share aliases require a Plus or Pro plan');
      }
      const existing = await this.repo.getShareById(payload.customAlias.trim());
      if (existing) {
        throw new Error('Custom alias is already in use');
      }
    }

    const uploadToken = generateSecureId(24);
    const r2Key = `uploads/${uploadToken}`;
    const now = getCurrentTimestamp(this.env);

    await this.repo.createUploadSession({
      token: uploadToken,
      filename: payload.filename,
      file_size: payload.fileSize,
      file_mime_type: payload.fileMimeType,
      r2_key: r2Key,
      password_hash: passwordHash,
      burn_after_read: burnAfterRead ? 1 : 0,
      allow_download: allowDownload ? 1 : 0,
      custom_alias: payload.customAlias || null,
      owner_id: ownerId || null,
      created_at: now,
      expires_at: now + 600, // 10 minutes to finish upload
      is_finalized: 0,
    });

    return {
      uploadToken,
      uploadUrl: `/api/uploads/${uploadToken}`,
      maxBytes: limits.maxImageBytes,
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

    // Write directly into private R2
    await this.env.IMAGES.put(session.r2_key, stream, {
      httpMetadata: {
        contentType: session.file_mime_type,
      },
    });
  }

  async finalizeImageUpload(uploadToken: string): Promise<FinalizeImageUploadResult> {
    const session = await this.repo.getUploadSession(uploadToken);
    const now = getCurrentTimestamp(this.env);

    if (!session || session.is_finalized === 1 || now >= session.expires_at) {
      const err = new Error('Upload session invalid or expired');
      (err as any).status = 400;
      throw err;
    }

    // Verify object exists in R2
    const obj = await this.env.IMAGES.head(session.r2_key);
    if (!obj) {
      const err = new Error('No uploaded file found in storage');
      (err as any).status = 400;
      throw err;
    }

    const shareId = session.custom_alias || generateSecureId(10);
    const finalR2Key = `images/${shareId}`;

    // Move or copy to permanent share key (or reuse upload key)
    // In Cloudflare R2, we can fetch and write to finalR2Key, or simply point r2_object_key to session.r2_key.
    // Pointing directly to session.r2_key avoids double-copy latency and R2 write costs!

    const expiresAt = now + EXPIRATION_SECONDS; // Fixed 300 seconds
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
      r2_object_key: session.r2_key,
      file_mime_type: session.file_mime_type,
      file_size: session.file_size,
      password_hash: session.password_hash,
      burn_after_read: session.burn_after_read,
      owner_id: session.owner_id,
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

    if (now >= share.expires_at || share.is_deleted === 1) {
      // Lazy cleanup
      if (share.r2_object_key) {
        this.env.IMAGES.delete(share.r2_object_key).catch(() => {});
      }
      this.repo.purgeShare(id).catch(() => {});
      const err = new Error('This share has expired');
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

    if (!share.r2_object_key) {
      const err = new Error('Image data missing');
      (err as any).status = 404;
      throw err;
    }

    const obj = await this.env.IMAGES.get(share.r2_object_key);
    if (!obj) {
      const err = new Error('Image object not found');
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
    }

    await this.repo.incrementViewCount(id);

    return {
      stream: obj.body,
      contentType: share.file_mime_type || 'application/octet-stream',
      filename: share.original_filename || 'image',
      fileSize: share.file_size || 0,
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
      const computedHash = await sha256Hex(deletionToken);
      if (computedHash === share.deletion_token_hash) {
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

    // Delete R2 object if image
    if (share.r2_object_key) {
      try {
        await this.env.IMAGES.delete(share.r2_object_key);
      } catch (err: any) {
        // Enqueue retry
        await this.repo.enqueueRetry(
          generateSecureId(16),
          'r2_image',
          share.r2_object_key,
          err?.message || 'R2 delete failure',
          getCurrentTimestamp(this.env)
        );
      }
    }

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

import { Env } from '../types/env';
import { ShareRepository } from '../repositories/shareRepository';
import { getCurrentTimestamp } from '../lib/clock';
import { generateSecureId } from '../lib/crypto';
import { ImageStorageService } from './imageStorageService';

export interface CleanupResult {
  expiredSharesProcessed: number;
  kvImagesDeleted: number;
  r2ImagesDeleted?: number; // alias
  d1SharesPurged: number;
  uploadSessionsCleaned: number;
  retriesAttempted: number;
  retriesSuccessful: number;
}

export class CleanupService {
  private repo: ShareRepository;
  private storage: ImageStorageService;

  constructor(private env: Env) {
    this.repo = new ShareRepository(env.DB);
    this.storage = new ImageStorageService(env);
  }

  /**
   * Run scheduled cleanup triggered by Cloudflare Cron every minute.
   * Processes in bounded batches and handles retries to stay well within Free tier limits.
   */
  async runScheduledCleanup(batchSize = 50): Promise<CleanupResult> {
    const now = getCurrentTimestamp(this.env);
    const result: CleanupResult = {
      expiredSharesProcessed: 0,
      kvImagesDeleted: 0,
      r2ImagesDeleted: 0,
      d1SharesPurged: 0,
      uploadSessionsCleaned: 0,
      retriesAttempted: 0,
      retriesSuccessful: 0,
    };

    // 1. Process expired shares in bounded batch
    const expiredShares = await this.repo.findExpiredShares(now, batchSize);
    result.expiredSharesProcessed = expiredShares.length;

    for (const share of expiredShares) {
      const storageKey = share.storage_key || share.r2_object_key;

      // If it's an image, delete binary object from Workers KV first
      if (storageKey) {
        try {
          await this.storage.deleteImage(storageKey);
          result.kvImagesDeleted++;
          result.r2ImagesDeleted!++;
        } catch (err: any) {
          // If KV deletion fails, enqueue retry and DO NOT purge D1 row yet!
          // D1 row preserves the storage_key so it can be retried on next pass.
          await this.repo.enqueueRetry(
            generateSecureId(16),
            'kv_image',
            storageKey,
            err?.message || 'KV delete error',
            now
          );
          continue; // skip purging D1 record until KV delete succeeds
        }
      }

      // Once storage is cleared (or for text), purge D1 record
      try {
        await this.repo.purgeShare(share.id);
        result.d1SharesPurged++;
      } catch (err: any) {
        await this.repo.enqueueRetry(
          generateSecureId(16),
          'd1_share',
          share.id,
          err?.message || 'D1 purge error',
          now
        );
      }
    }

    // 2. Process expired or abandoned upload sessions
    const expiredSessions = await this.repo.findExpiredUploadSessions(now, batchSize);
    for (const session of expiredSessions) {
      const storageKey = session.storage_key || session.r2_key;
      if (session.is_finalized === 0 && storageKey) {
        // Abandoned upload: delete incomplete object from KV
        try {
          await this.storage.deleteImage(storageKey);
        } catch {}
      }
      await this.repo.deleteUploadSession(session.token);
      result.uploadSessionsCleaned++;
    }

    // 3. Process retries from queue (bounded to 20 per minute to respect Free limits)
    const retries = await this.repo.getCleanupRetries(20);
    result.retriesAttempted = retries.length;

    for (const retry of retries) {
      try {
        if (retry.resource_type === 'kv_image' || retry.resource_type === 'r2_image') {
          await this.storage.deleteImage(retry.resource_identifier);
        } else if (retry.resource_type === 'd1_share') {
          await this.repo.purgeShare(retry.resource_identifier);
        }
        await this.repo.deleteCleanupRetry(retry.id);
        result.retriesSuccessful++;
      } catch (retryErr: any) {
        await this.repo.incrementCleanupRetry(
          retry.id,
          now,
          retryErr?.message || 'Retry failed'
        );
      }
    }

    // 4. Cleanup old rate limit counters (older than 2 days)
    const rateLimitCutoff = now - 172800;
    try {
      await this.repo.cleanupRateLimits(rateLimitCutoff);
    } catch {}

    return result;
  }
}

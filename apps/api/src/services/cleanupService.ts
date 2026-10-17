import { Env } from '../types/env';
import { ShareRepository } from '../repositories/shareRepository';
import { getCurrentTimestamp } from '../lib/clock';
import { generateSecureId } from '../lib/crypto';

export interface CleanupResult {
  expiredSharesProcessed: number;
  r2ImagesDeleted: number;
  d1SharesPurged: number;
  uploadSessionsCleaned: number;
  retriesAttempted: number;
  retriesSuccessful: number;
}

export class CleanupService {
  private repo: ShareRepository;

  constructor(private env: Env) {
    this.repo = new ShareRepository(env.DB);
  }

  /**
   * Run scheduled cleanup triggered by Cloudflare Cron every minute.
   * Processes in bounded batches and handles retries.
   */
  async runScheduledCleanup(batchSize = 50): Promise<CleanupResult> {
    const now = getCurrentTimestamp(this.env);
    const result: CleanupResult = {
      expiredSharesProcessed: 0,
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
      // If it's an image, delete from R2 first
      if (share.r2_object_key) {
        try {
          await this.env.IMAGES.delete(share.r2_object_key);
          result.r2ImagesDeleted++;
        } catch (err: any) {
          // If R2 deletion fails, enqueue retry and DO NOT purge D1 row yet!
          await this.repo.enqueueRetry(
            generateSecureId(16),
            'r2_image',
            share.r2_object_key,
            err?.message || 'R2 delete error',
            now
          );
          continue; // skip purging D1 record until R2 delete succeeds
        }
      }

      // Once R2 is cleared (or for text), purge D1 record
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

    // 2. Process expired or finalized upload sessions
    const expiredSessions = await this.repo.findExpiredUploadSessions(now, batchSize);
    for (const session of expiredSessions) {
      if (session.is_finalized === 0 && session.r2_key) {
        // Abandoned upload: delete incomplete object from R2
        try {
          await this.env.IMAGES.delete(session.r2_key);
        } catch {}
      }
      await this.repo.deleteUploadSession(session.token);
      result.uploadSessionsCleaned++;
    }

    // 3. Process retries from queue
    const retries = await this.repo.getCleanupRetries(20);
    result.retriesAttempted = retries.length;

    for (const retry of retries) {
      try {
        if (retry.resource_type === 'r2_image') {
          await this.env.IMAGES.delete(retry.resource_identifier);
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

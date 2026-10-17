import { describe, it, expect, beforeEach } from 'vitest';
import { MockD1Database } from './mockD1';
import { MockR2Bucket } from './mockR2';
import { ShareService } from '../src/services/shareService';
import { CleanupService } from '../src/services/cleanupService';
import { Env } from '../src/types/env';

describe('Five-Minute Expiration & Cleanup System', () => {
  let db: MockD1Database;
  let r2: MockR2Bucket;
  let env: Env;

  beforeEach(() => {
    db = new MockD1Database();
    r2 = new MockR2Bucket();
    env = {
      DB: db as unknown as D1Database,
      IMAGES: r2 as unknown as R2Bucket,
      APP_URL: 'http://localhost:5173',
      TEST_CLOCK_OFFSET: '0',
    };
  });

  it('content is accessible before 300 seconds and strictly inaccessible at or after 300 seconds', async () => {
    const shareService = new ShareService(env);
    const created = await shareService.createTextShare(
      { textContent: 'Secret 5-minute note' },
      'free'
    );

    expect(created.expiresAt - created.createdAt).toBe(300);

    // At t = 0s, content is accessible
    const contentInitial = await shareService.getShareContent(created.id);
    expect(contentInitial.textContent).toBe('Secret 5-minute note');
    expect(contentInitial.metadata.secondsRemaining).toBe(300);

    // Fast-forward time to t = 299s (before expiration boundary)
    env.TEST_CLOCK_OFFSET = '299';
    const contentJustBefore = await shareService.getShareContent(created.id);
    expect(contentJustBefore.textContent).toBe('Secret 5-minute note');
    expect(contentJustBefore.metadata.secondsRemaining).toBe(1);

    // Fast-forward time to t = 300s (EXACT expiration boundary)
    env.TEST_CLOCK_OFFSET = '300';
    await expect(shareService.getShareContent(created.id)).rejects.toThrow();

    // Fast-forward time to t = 301s (after boundary)
    env.TEST_CLOCK_OFFSET = '301';
    await expect(shareService.getShareContent(created.id)).rejects.toThrow();
  });

  it('scheduled cleanup physically deletes expired text from D1', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    const share = await shareService.createTextShare({ textContent: 'Text to be purged' }, 'free');

    // Fast-forward past 300s
    env.TEST_CLOCK_OFFSET = '305';

    // Run scheduled cleanup
    const result = await cleanupService.runScheduledCleanup();
    expect(result.expiredSharesProcessed).toBe(1);
    expect(result.d1SharesPurged).toBe(1);

    // Verify share is completely gone from D1
    const checkDb = await db.prepare('SELECT * FROM shares WHERE id = ?').bind(share.id).first();
    expect(checkDb).toBeNull();
  });

  it('scheduled cleanup physically deletes images from R2 and share records from D1', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    // Initialize image upload
    const init = await shareService.initImageUpload(
      { filename: 'photo.png', fileSize: 1024, fileMimeType: 'image/png' },
      'free'
    );

    // Store binary in R2
    const fakeData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    await r2.put(`uploads/${init.uploadToken}`, fakeData, {
      httpMetadata: { contentType: 'image/png' },
    });

    // Finalize image share
    const finalized = await shareService.finalizeImageUpload(init.uploadToken);
    expect(finalized.expiresAt - finalized.createdAt).toBe(300);

    // Verify image exists in R2
    const objBefore = await r2.get(`uploads/${init.uploadToken}`);
    expect(objBefore).not.toBeNull();

    // Fast forward past expiration
    env.TEST_CLOCK_OFFSET = '305';

    // Run scheduled cleanup
    const result = await cleanupService.runScheduledCleanup();
    expect(result.r2ImagesDeleted).toBe(1);
    expect(result.d1SharesPurged).toBe(1);

    // Verify R2 object was deleted
    const objAfter = await r2.get(`uploads/${init.uploadToken}`);
    expect(objAfter).toBeNull();

    // Verify D1 record was purged
    const d1Record = await db.prepare('SELECT * FROM shares WHERE id = ?').bind(finalized.id).first();
    expect(d1Record).toBeNull();
  });

  it('cleanup retries failed R2 deletions and preserves D1 reference until R2 succeeds', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    const init = await shareService.initImageUpload(
      { filename: 'retry-test.jpg', fileSize: 500, fileMimeType: 'image/jpeg' },
      'free'
    );
    await r2.put(`uploads/${init.uploadToken}`, new Uint8Array([255, 216, 255]), {
      httpMetadata: { contentType: 'image/jpeg' },
    });
    const finalized = await shareService.finalizeImageUpload(init.uploadToken);

    // Simulate R2 outage
    r2.shouldFailDelete = true;
    env.TEST_CLOCK_OFFSET = '310';

    // First cleanup run: R2 fails, should enqueue retry and NOT purge D1 record
    await cleanupService.runScheduledCleanup();
    const d1RecordPreserved = await db.prepare('SELECT * FROM shares WHERE id = ?').bind(finalized.id).first();
    expect(d1RecordPreserved).not.toBeNull();

    // Verify retry was enqueued
    const retries = await db.prepare('SELECT * FROM cleanup_retries').all();
    expect(retries.results?.length).toBe(1);

    // R2 recovery
    r2.shouldFailDelete = false;

    // Second cleanup run: retry succeeds
    const retryResult = await cleanupService.runScheduledCleanup();
    expect(retryResult.retriesSuccessful).toBe(1);

    // Verify R2 object is now gone
    const obj = await r2.get(`uploads/${init.uploadToken}`);
    expect(obj).toBeNull();
  });

  it('cleanup is idempotent and handles multiple runs without errors', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    await shareService.createTextShare({ textContent: 'Idempotency test' }, 'free');
    env.TEST_CLOCK_OFFSET = '350';

    const run1 = await cleanupService.runScheduledCleanup();
    expect(run1.d1SharesPurged).toBe(1);

    // Second run has nothing left to delete
    const run2 = await cleanupService.runScheduledCleanup();
    expect(run2.expiredSharesProcessed).toBe(0);
    expect(run2.d1SharesPurged).toBe(0);
  });
});

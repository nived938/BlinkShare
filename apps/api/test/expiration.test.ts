import { describe, it, expect, beforeEach } from 'vitest';
import { MockD1Database } from './mockD1';
import { MockKVNamespace } from './mockKV';
import { ShareService } from '../src/services/shareService';
import { CleanupService } from '../src/services/cleanupService';
import { Env } from '../src/types/env';

describe('Five-Minute Expiration & Cleanup System (Cloudflare D1 + Workers KV Free)', () => {
  let db: MockD1Database;
  let kv: MockKVNamespace;
  let env: Env;

  beforeEach(() => {
    db = new MockD1Database();
    kv = new MockKVNamespace();
    env = {
      DB: db as unknown as D1Database,
      IMAGE_STORE: kv as unknown as KVNamespace,
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

  it('scheduled cleanup physically deletes images from KV and share records from D1', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    // Initialize image upload
    const init = await shareService.initImageUpload(
      { filename: 'photo.png', fileSize: 1024, fileMimeType: 'image/png' },
      'free'
    );

    // Store binary in Workers KV
    const fakeData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    await kv.put(`img:${init.uploadToken}`, fakeData, {
      metadata: { contentType: 'image/png' },
    });

    // Finalize image share
    const finalized = await shareService.finalizeImageUpload(init.uploadToken);
    expect(finalized.expiresAt - finalized.createdAt).toBe(300);

    // Verify image exists in KV
    const objBefore = await kv.get(`img:${init.uploadToken}`);
    expect(objBefore).not.toBeNull();

    // Fast forward past expiration
    env.TEST_CLOCK_OFFSET = '305';

    // Run scheduled cleanup
    const result = await cleanupService.runScheduledCleanup();
    expect(result.kvImagesDeleted).toBe(1);
    expect(result.d1SharesPurged).toBe(1);

    // Verify KV object was deleted
    const objAfter = await kv.get(`img:${init.uploadToken}`);
    expect(objAfter).toBeNull();

    // Verify D1 record was purged
    const d1Record = await db.prepare('SELECT * FROM shares WHERE id = ?').bind(finalized.id).first();
    expect(d1Record).toBeNull();
  });

  it('cleanup retries failed KV deletions and preserves D1 reference until KV succeeds', async () => {
    const shareService = new ShareService(env);
    const cleanupService = new CleanupService(env);

    const init = await shareService.initImageUpload(
      { filename: 'retry-test.jpg', fileSize: 500, fileMimeType: 'image/jpeg' },
      'free'
    );
    await kv.put(`img:${init.uploadToken}`, new Uint8Array([255, 216, 255]), {
      metadata: { contentType: 'image/jpeg' },
    });
    const finalized = await shareService.finalizeImageUpload(init.uploadToken);

    // Simulate KV failure
    kv.shouldFailDelete = true;
    env.TEST_CLOCK_OFFSET = '310';

    // First cleanup run: KV fails, should enqueue retry and NOT purge D1 record
    await cleanupService.runScheduledCleanup();
    const d1RecordPreserved = await db.prepare('SELECT * FROM shares WHERE id = ?').bind(finalized.id).first();
    expect(d1RecordPreserved).not.toBeNull();

    // Verify retry was enqueued
    const retries = await db.prepare('SELECT * FROM cleanup_retries').all();
    expect(retries.results?.length).toBe(1);

    // KV recovery
    kv.shouldFailDelete = false;

    // Second cleanup run: retry succeeds
    const retryResult = await cleanupService.runScheduledCleanup();
    expect(retryResult.retriesSuccessful).toBe(1);

    // Verify KV object is now gone
    const obj = await kv.get(`img:${init.uploadToken}`);
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

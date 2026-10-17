import { describe, it, expect, beforeEach } from 'vitest';
import { MockD1Database } from './mockD1';
import { MockKVNamespace } from './mockKV';
import { ShareService } from '../src/services/shareService';
import { RateLimitService } from '../src/services/rateLimitService';
import { Env } from '../src/types/env';
import { detectSensitiveContent } from '@blinkshare/shared';

describe('Security, Quotas & Access Controls (100% Free Plan)', () => {
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
      RATE_LIMIT_SECRET: 'test-secret-salt-32chars!!',
    };
  });

  it('enforces free-tier text size limits (100 KB) and rejects oversized content', async () => {
    const shareService = new ShareService(env);

    // Free plan max: 100 KB
    const validText = 'A'.repeat(50 * 1024); // 50 KB
    const validShare = await shareService.createTextShare({ textContent: validText }, 'free');
    expect(validShare.id).toBeDefined();

    const oversizedFreeText = 'A'.repeat(105 * 1024); // 105 KB
    await expect(
      shareService.createTextShare({ textContent: oversizedFreeText }, 'free')
    ).rejects.toThrow('Text content exceeds free tier limit of 100 KB');
  });

  it('unlocked password protection is available for all users at zero cost', async () => {
    const shareService = new ShareService(env);

    // Any free user can set password
    const freeShare = await shareService.createTextShare(
      { textContent: 'Secret content', password: 'secure-password' },
      'free'
    );

    // Initial retrieve without password shows password is required
    const initialView = await shareService.getShareContent(freeShare.id);
    expect(initialView.isPasswordRequired).toBe(true);
    expect(initialView.textContent).toBeUndefined();

    // Retrieve with wrong password throws 401
    await expect(
      shareService.getShareContent(freeShare.id, 'wrong-pass')
    ).rejects.toThrow('Invalid password');

    // Retrieve with correct password unlocks content
    const unlocked = await shareService.getShareContent(freeShare.id, 'secure-password');
    expect(unlocked.textContent).toBe('Secret content');
    expect(unlocked.isPasswordRequired).toBe(false);
  });

  it('guarantees atomic burn-after-first-view for all users at zero cost', async () => {
    const shareService = new ShareService(env);

    const share = await shareService.createTextShare(
      { textContent: 'Self-destructing token', burnAfterRead: true },
      'free'
    );

    // First reveal succeeds
    const firstReveal = await shareService.getShareContent(share.id);
    expect(firstReveal.textContent).toBe('Self-destructing token');

    // Second reveal immediately fails as burned
    await expect(shareService.getShareContent(share.id)).rejects.toThrow();
  });

  it('allows creator deletion via secret deletion token and blocks unauthorized deletion', async () => {
    const shareService = new ShareService(env);

    const share = await shareService.createTextShare({ textContent: 'Hello world' }, 'free');

    // Wrong token
    await expect(
      shareService.deleteShare(share.id, 'wrong-token')
    ).rejects.toThrow('Unauthorized to delete this share');

    // Correct anonymous token
    await shareService.deleteShare(share.id, share.deletionToken);

    // Share is now deleted
    await expect(shareService.getShareContent(share.id)).rejects.toThrow('Share not found');
  });

  it('enforces daily share rate limits using keyed IP hashes (10/day anonymous)', async () => {
    const rateLimit = new RateLimitService(env);
    const ip = '198.51.100.45';

    // Free plan allows 10 shares per day
    for (let i = 1; i <= 10; i++) {
      const check = await rateLimit.checkShareCreationLimit(ip, 'free');
      expect(check.allowed).toBe(true);
    }

    // 11th attempt is blocked
    const blocked = await rateLimit.checkShareCreationLimit(ip, 'free');
    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toContain('Daily share limit reached');
  });

  it('detects sensitive credentials in text without leaking data', () => {
    const r1 = detectSensitiveContent('Normal everyday message with no keys.');
    expect(r1.hasSensitiveContent).toBe(false);

    const r2 = detectSensitiveContent('Here is AWS key: AKIAIOSFODNN7EXAMPLE and sk-live_12345678901234567890123456');
    expect(r2.hasSensitiveContent).toBe(true);
    expect(r2.matches).toContain('AWS Access Key');
  });
});

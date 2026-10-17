import { PLANS, PlanType, FREE_TIER_LIMITS } from '@blinkshare/shared';
import { Env } from '../types/env';
import { ShareRepository } from '../repositories/shareRepository';
import { getCurrentTimestamp } from '../lib/clock';
import { hashIp } from '../lib/crypto';

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds?: number;
  message?: string;
}

export class RateLimitService {
  private repo: ShareRepository;

  constructor(private env: Env) {
    this.repo = new ShareRepository(env.DB);
  }

  async checkShareCreationLimit(
    clientIp: string,
    plan: PlanType,
    ownerId?: string,
    isImage = false
  ): Promise<RateLimitCheckResult> {
    const now = getCurrentTimestamp(this.env);
    const secret = this.env.RATE_LIMIT_SECRET || 'blinkshare-secret-salt';
    const ipHash = await hashIp(clientIp, secret);
    const keyHash = ownerId ? `user:${ownerId}` : `ip:${ipHash}`;

    // 1. Minute rate limit (Anti-abuse: max 20 requests per minute)
    const minuteStart = Math.floor(now / 60) * 60;
    const minuteCount = await this.repo.incrementRateLimit(keyHash, 'minute', minuteStart);
    if (minuteCount > FREE_TIER_LIMITS.rateLimitPerMinute) {
      return {
        allowed: false,
        limit: FREE_TIER_LIMITS.rateLimitPerMinute,
        remaining: 0,
        retryAfterSeconds: 60 - (now - minuteStart),
        message: 'Too many share creation requests. Please wait a few moments before trying again.',
      };
    }

    // 2. Platform-wide free-tier guard (prevent exceeding Cloudflare KV 1,000 writes/day free limit)
    if (isImage) {
      const dayStart = Math.floor(now / 86400) * 86400;
      const globalKvWrites = await this.repo.incrementRateLimit('global:kv_writes', 'day', dayStart);
      if (globalKvWrites > FREE_TIER_LIMITS.maxDailyKvWrites) {
        return {
          allowed: false,
          limit: FREE_TIER_LIMITS.maxDailyKvWrites,
          remaining: 0,
          retryAfterSeconds: 3600,
          message: 'BlinkShare Free Tier capacity reached for today. To keep the service 100% free with zero billing, new image uploads will resume tomorrow. Text sharing remains operational.',
        };
      }

      // Check active storage size (prevent exceeding 500 MB safe threshold)
      const storageMetrics = await this.repo.getActiveStorageMetrics(now);
      if (storageMetrics.activeBytes > FREE_TIER_LIMITS.maxActiveStoredBytes) {
        return {
          allowed: false,
          limit: 0,
          remaining: 0,
          retryAfterSeconds: 300,
          message: 'Platform active storage threshold reached. Please wait up to 5 minutes for active shares to expire.',
        };
      }
    }

    // 3. User daily plan quota limit
    const planLimits = PLANS[plan] || PLANS.free;
    const dayStart = Math.floor(now / 86400) * 86400;
    const dailyCount = await this.repo.incrementRateLimit(keyHash, 'day', dayStart);

    if (dailyCount > planLimits.maxSharesPerDay) {
      const secondsUntilMidnight = 86400 - (now - dayStart);
      return {
        allowed: false,
        limit: planLimits.maxSharesPerDay,
        remaining: 0,
        retryAfterSeconds: secondsUntilMidnight,
        message: `Daily share limit reached (${planLimits.maxSharesPerDay} shares/day). Create a free account for higher quota or try again tomorrow at midnight UTC.`,
      };
    }

    return {
      allowed: true,
      limit: planLimits.maxSharesPerDay,
      remaining: Math.max(0, planLimits.maxSharesPerDay - dailyCount),
    };
  }

  async getDailyUsage(
    clientIp: string,
    plan: PlanType,
    ownerId?: string
  ): Promise<{ count: number; limit: number; remaining: number }> {
    const now = getCurrentTimestamp(this.env);
    const secret = this.env.RATE_LIMIT_SECRET || 'blinkshare-secret-salt';
    const ipHash = await hashIp(clientIp, secret);
    const keyHash = ownerId ? `user:${ownerId}` : `ip:${ipHash}`;
    const dayStart = Math.floor(now / 86400) * 86400;

    const count = await this.repo.getDailyShareCount(keyHash, dayStart);
    const limit = (PLANS[plan] || PLANS.free).maxSharesPerDay;
    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
    };
  }
}

import { PLANS, PlanType } from '@blinkshare/shared';
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
    ownerId?: string
  ): Promise<RateLimitCheckResult> {
    const now = getCurrentTimestamp(this.env);
    const secret = this.env.RATE_LIMIT_SECRET || 'blinkshare-secret-salt';
    const ipHash = await hashIp(clientIp, secret);
    const keyHash = ownerId ? `user:${ownerId}` : `ip:${ipHash}`;

    // 1. Minute rate limit (Anti-spam / brute force: max 20 creations per minute)
    const minuteStart = Math.floor(now / 60) * 60;
    const minuteCount = await this.repo.incrementRateLimit(keyHash, 'minute', minuteStart);
    if (minuteCount > 20) {
      return {
        allowed: false,
        limit: 20,
        remaining: 0,
        retryAfterSeconds: 60 - (now - minuteStart),
        message: 'Too many share creation requests. Please wait a moment before trying again.',
      };
    }

    // 2. Daily plan quota limit
    const planLimits = PLANS[plan];
    const dayStart = Math.floor(now / 86400) * 86400;
    const dailyCount = await this.repo.incrementRateLimit(keyHash, 'day', dayStart);

    if (dailyCount > planLimits.maxSharesPerDay) {
      const secondsUntilMidnight = 86400 - (now - dayStart);
      return {
        allowed: false,
        limit: planLimits.maxSharesPerDay,
        remaining: 0,
        retryAfterSeconds: secondsUntilMidnight,
        message: `Daily share limit reached (${planLimits.maxSharesPerDay} shares/day on ${planLimits.name} plan). Quota resets at midnight UTC.`,
      };
    }

    return {
      allowed: true,
      limit: planLimits.maxSharesPerDay,
      remaining: Math.max(0, planLimits.maxSharesPerDay - dailyCount),
    };
  }

  async getDailyUsage(clientIp: string, plan: PlanType, ownerId?: string): Promise<{ count: number; limit: number; remaining: number }> {
    const now = getCurrentTimestamp(this.env);
    const secret = this.env.RATE_LIMIT_SECRET || 'blinkshare-secret-salt';
    const ipHash = await hashIp(clientIp, secret);
    const keyHash = ownerId ? `user:${ownerId}` : `ip:${ipHash}`;
    const dayStart = Math.floor(now / 86400) * 86400;

    const count = await this.repo.getDailyShareCount(keyHash, dayStart);
    const limit = PLANS[plan].maxSharesPerDay;
    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
    };
  }
}

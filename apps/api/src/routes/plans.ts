import { Hono } from 'hono';
import { PLANS } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { RateLimitService } from '../services/rateLimitService';

export const plansRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/plans - Get all plan limits and features
plansRouter.get('/plans', (c) => {
  return c.json({
    plans: PLANS,
    fixedLifetimeSeconds: 300,
  });
});

// GET /api/usage - Get current usage and daily quota
plansRouter.get('/usage', async (c) => {
  const auth = c.get('auth');
  const clientIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    '127.0.0.1';

  const rateLimitService = new RateLimitService(c.env);
  const usage = await rateLimitService.getDailyUsage(clientIp, auth.plan, auth.userId);

  return c.json({
    plan: auth.plan,
    sharesCreatedToday: usage.count,
    dailyQuotaLimit: usage.limit,
    dailyQuotaRemaining: usage.remaining,
  });
});

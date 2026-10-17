import { Context, Next } from 'hono';
import { PlanType } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { AuthService } from '../services/authService';
import { hashIp } from '../lib/crypto';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: AppVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  let plan: PlanType = 'free';
  let userId: string | undefined;
  let userEmail: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const authService = new AuthService(c.env);
      const session = await authService.verifySessionToken(token);
      if (session) {
        userId = session.userId;
        userEmail = session.email;
        plan = session.plan;
      }
    }
  }

  // Derive client IP safely without logging raw IP
  const clientIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const secret = c.env.RATE_LIMIT_SECRET || 'blinkshare-secret-salt';
  const clientIpHash = await hashIp(clientIp, secret);

  c.set('auth', {
    userId,
    userEmail,
    plan,
  });
  c.set('clientIpHash', clientIpHash);

  await next();
}

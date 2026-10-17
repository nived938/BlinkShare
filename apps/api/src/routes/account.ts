import { Hono } from 'hono';
import { registerSchema, loginSchema, UserShareItem } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { AuthService } from '../services/authService';
import { ShareRepository, ShareRecord } from '../repositories/shareRepository';
import { ShareService } from '../services/shareService';
import { getCurrentTimestamp } from '../lib/clock';

export const accountRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// POST /api/account/register - Register new optional account
accountRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const parseResult = registerSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      },
      400
    );
  }

  const authService = new AuthService(c.env);
  try {
    const result = await authService.register(parseResult.data.email, parseResult.data.password);
    return c.json(result, 201);
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Registration failed' }, status);
  }
});

// POST /api/account/login - Login
accountRouter.post('/login', async (c) => {
  const body = await c.req.json();
  const parseResult = loginSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      },
      400
    );
  }

  const authService = new AuthService(c.env);
  try {
    const result = await authService.login(parseResult.data.email, parseResult.data.password);
    return c.json(result, 200);
  } catch (err: any) {
    const status = err.status || 401;
    return c.json({ error: err.message || 'Login failed' }, status);
  }
});

// GET /api/account/profile - Get profile
accountRouter.get('/profile', async (c) => {
  const auth = c.get('auth');
  if (!auth.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const authService = new AuthService(c.env);
  const profile = await authService.getProfile(auth.userId);
  if (!profile) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(profile);
});

// GET /api/account/shares - List user active shares
accountRouter.get('/shares', async (c) => {
  const auth = c.get('auth');
  if (!auth.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const repo = new ShareRepository(c.env.DB);
  const now = getCurrentTimestamp(c.env);
  const records = await repo.getUserActiveShares(auth.userId, now);

  const shares: UserShareItem[] = records.map((record: ShareRecord) => {
    const secondsRemaining = Math.max(0, record.expires_at - now);
    return {
      id: record.id,
      contentType: record.content_type,
      title: record.title,
      originalFilename: record.original_filename,
      createdAt: record.created_at,
      expiresAt: record.expires_at,
      secondsRemaining,
      isExpired: secondsRemaining <= 0,
      viewCount: record.view_count,
      burnAfterRead: record.burn_after_read === 1,
    };
  });

  return c.json({ shares });
});

// DELETE /api/account/shares/:id - Delete user share
accountRouter.delete('/shares/:id', async (c) => {
  const auth = c.get('auth');
  if (!auth.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const shareService = new ShareService(c.env);
  try {
    await shareService.deleteShare(id, undefined, auth.userId);
    return c.json({ success: true, message: 'Share deleted' });
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to delete share' }, status);
  }
});

import { Hono } from 'hono';
import { initImageUploadSchema } from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { ShareService } from '../services/shareService';
import { RateLimitService } from '../services/rateLimitService';

export const uploadsRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// POST /api/uploads/init - Initialize image upload
uploadsRouter.post('/init', async (c) => {
  const body = await c.req.json();
  const parseResult = initImageUploadSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      },
      400
    );
  }

  const auth = c.get('auth');
  const rateLimitService = new RateLimitService(c.env);
  const clientIp =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    '127.0.0.1';

  const rateLimit = await rateLimitService.checkShareCreationLimit(clientIp, auth.plan, auth.userId, true);
  if (!rateLimit.allowed) {
    return c.json(
      {
        error: rateLimit.message || 'Rate limit exceeded',
        retryAfter: rateLimit.retryAfterSeconds,
      },
      429
    );
  }

  const shareService = new ShareService(c.env);
  try {
    const result = await shareService.initImageUpload(
      parseResult.data,
      auth.plan,
      auth.userId
    );
    return c.json(result, 201);
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to initialize upload' }, status);
  }
});

// PUT /api/uploads/:token - Upload image binary stream directly to R2
uploadsRouter.put('/:token', async (c) => {
  const token = c.req.param('token');
  const bodyStream = c.req.raw.body;

  if (!bodyStream) {
    return c.json({ error: 'Request body stream missing' }, 400);
  }

  const contentLengthHeader = c.req.header('content-length');
  const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;

  const shareService = new ShareService(c.env);
  try {
    await shareService.storeUploadData(token, bodyStream, contentLength);
    return c.json({ success: true });
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Upload failed' }, status);
  }
});

// POST /api/uploads/:token/finalize - Finalize upload and create public 5-minute share
uploadsRouter.post('/:token/finalize', async (c) => {
  const token = c.req.param('token');
  const shareService = new ShareService(c.env);

  try {
    const result = await shareService.finalizeImageUpload(token);
    return c.json(result, 201);
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to finalize upload' }, status);
  }
});

import { Hono } from 'hono';
import {
  createTextShareSchema,
  reportAbuseSchema,
  unlockShareSchema,
} from '@blinkshare/shared';
import { Env, AppVariables } from '../types/env';
import { ShareService } from '../services/shareService';
import { RateLimitService } from '../services/rateLimitService';
import { getCurrentTimestamp } from '../lib/clock';

export const sharesRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// POST /api/shares/text - Create text share
sharesRouter.post('/text', async (c) => {
  const body = await c.req.json();
  const parseResult = createTextShareSchema.safeParse(body);
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

  // Check rate limits & daily quotas
  const rateLimit = await rateLimitService.checkShareCreationLimit(clientIp, auth.plan, auth.userId);
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
    const result = await shareService.createTextShare(
      parseResult.data,
      auth.plan,
      auth.userId
    );
    return c.json(result, 201);
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to create share' }, status);
  }
});

// GET /api/shares/:id - Get share metadata
sharesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const shareService = new ShareService(c.env);

  try {
    const shareContent = await shareService.getShareContent(id);
    return c.json({
      metadata: shareContent.metadata,
      isPasswordRequired: shareContent.isPasswordRequired,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return c.json({ error: err.message || 'Share unavailable' }, status);
  }
});

// GET /api/shares/:id/content - Retrieve text share content
sharesRouter.get('/:id/content', async (c) => {
  const id = c.req.param('id');
  const password = c.req.query('password');
  const shareService = new ShareService(c.env);

  try {
    const shareContent = await shareService.getShareContent(id, password);
    if (shareContent.isPasswordRequired) {
      return c.json(
        {
          error: 'Password required',
          isPasswordRequired: true,
          metadata: shareContent.metadata,
        },
        401
      );
    }
    return c.json(shareContent);
  } catch (err: any) {
    const status = err.status || 500;
    return c.json({ error: err.message || 'Share unavailable' }, status);
  }
});

// POST /api/shares/:id/unlock - Unlock password-protected text share
sharesRouter.post('/:id/unlock', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parseResult = unlockShareSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ error: 'Password is required' }, 400);
  }

  const shareService = new ShareService(c.env);
  try {
    const shareContent = await shareService.getShareContent(id, parseResult.data.password);
    return c.json(shareContent);
  } catch (err: any) {
    const status = err.status || 401;
    return c.json({ error: err.message || 'Failed to unlock share' }, status);
  }
});

// GET /api/shares/:id/image - Stream image content
sharesRouter.get('/:id/image', async (c) => {
  const id = c.req.param('id');
  const password = c.req.query('password');
  const download = c.req.query('download') === 'true';

  const shareService = new ShareService(c.env);
  try {
    const imageInfo = await shareService.getImageStream(id, password);

    if (download && !imageInfo.allowDownload) {
      return c.json({ error: 'Download has been restricted by the creator' }, 403);
    }

    const disposition = download ? 'attachment' : 'inline';
    const filename = encodeURIComponent(imageInfo.filename);

    return new Response(imageInfo.stream, {
      status: 200,
      headers: {
        'Content-Type': imageInfo.contentType,
        'Content-Length': String(imageInfo.fileSize),
        'Content-Disposition': `${disposition}; filename*=UTF-8''${filename}`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return c.json({ error: err.message || 'Image unavailable' }, status);
  }
});

// DELETE /api/shares/:id - Delete share by deletion token or owner
sharesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  let deletionToken = c.req.query('deletionToken') || c.req.header('x-deletion-token');

  if (!deletionToken && c.req.header('content-type')?.includes('application/json')) {
    try {
      const body = await c.req.json();
      deletionToken = body.deletionToken;
    } catch {}
  }

  const auth = c.get('auth');
  const shareService = new ShareService(c.env);

  try {
    await shareService.deleteShare(id, deletionToken, auth.userId);
    return c.json({ success: true, message: 'Share deleted successfully' });
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to delete share' }, status);
  }
});

// POST /api/shares/:id/report - Report abuse
sharesRouter.post('/:id/report', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parseResult = reportAbuseSchema.safeParse({ ...body, shareId: id });
  if (!parseResult.success) {
    return c.json(
      {
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      },
      400
    );
  }

  const shareService = new ShareService(c.env);
  try {
    await shareService.reportAbuse(
      id,
      parseResult.data.reason,
      parseResult.data.details
    );
    return c.json({ success: true, message: 'Abuse report received. Thank you.' });
  } catch (err: any) {
    const status = err.status || 400;
    return c.json({ error: err.message || 'Failed to submit report' }, status);
  }
});

// GET /api/shares/:id/status - Quick check for expiration
sharesRouter.get('/:id/status', async (c) => {
  const id = c.req.param('id');
  const shareService = new ShareService(c.env);

  try {
    const result = await shareService.getShareContent(id);
    const now = getCurrentTimestamp(c.env);
    const remaining = Math.max(0, result.metadata.expiresAt - now);
    return c.json({
      id,
      isExpired: remaining <= 0,
      secondsRemaining: remaining,
      expiresAt: result.metadata.expiresAt,
    });
  } catch (err: any) {
    return c.json({ id, isExpired: true, secondsRemaining: 0 }, 410);
  }
});

import { Hono } from 'hono';
import { Env, AppVariables } from '../types/env';
import { getCurrentTimestamp } from '../lib/clock';

export const healthRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/health
healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: getCurrentTimestamp(c.env),
    service: 'BlinkShare API',
    version: '1.0.0',
    edge: true,
  });
});

// GET /api/health/database
healthRouter.get('/database', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as alive').first();
    return c.json({
      status: 'ok',
      database: 'Cloudflare D1',
      connected: result?.alive === 1,
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        database: 'Cloudflare D1',
        connected: false,
        error: err.message,
      },
      503
    );
  }
});

// GET /api/health/storage
healthRouter.get('/storage', async (c) => {
  try {
    // Attempt benign storage list or check
    const list = await c.env.IMAGES.list({ limit: 1 });
    return c.json({
      status: 'ok',
      storage: 'Cloudflare R2',
      connected: Array.isArray(list.objects),
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        storage: 'Cloudflare R2',
        connected: false,
        error: err.message,
      },
      503
    );
  }
});

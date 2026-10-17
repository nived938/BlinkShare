import { Hono } from 'hono';
import { Env, AppVariables } from '../types/env';
import { getCurrentTimestamp } from '../lib/clock';
import { ImageStorageService } from '../services/imageStorageService';

export const healthRouter = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// GET /api/health
healthRouter.get('/', (c) => {
  const storage = new ImageStorageService(c.env);
  return c.json({
    status: 'ok',
    timestamp: getCurrentTimestamp(c.env),
    service: 'BlinkShare API',
    version: '1.0.0',
    edge: true,
    imageStorageMode: storage.getMode(),
    imageStorageAvailable: storage.isAvailable(),
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
  const storage = new ImageStorageService(c.env);
  const mode = storage.getMode();
  const available = storage.isAvailable();

  if (!available) {
    return c.json({
      status: 'disabled',
      mode,
      available: false,
      message: 'Cloudflare R2 is not configured. Text sharing is active. For local testing, use Wrangler local R2 simulation.',
    });
  }

  return c.json({
    status: 'ok',
    mode,
    available: true,
    storage: mode === 'r2' ? 'Cloudflare R2 (Production)' : 'Cloudflare R2 (Local Simulation)',
  });
});

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
    tier: '100% Free Plan (Zero Billing)',
    version: '2.0.0',
    edge: true,
    imageStorageAvailable: storage.isAvailable(),
  });
});

// GET /api/health/database
healthRouter.get('/database', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as alive').first();
    return c.json({
      status: 'ok',
      database: 'Cloudflare D1 (Free Tier)',
      connected: result?.alive === 1,
    });
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        database: 'Cloudflare D1 (Free Tier)',
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
  const available = storage.isAvailable();

  return c.json({
    status: available ? 'ok' : 'disabled',
    storageMode: 'kv',
    storageAvailable: available,
    storage: 'Cloudflare Workers KV (Free Tier - 0 Billing Required)',
    message: available
      ? 'Cloudflare Workers KV storage active (100% Free Tier).'
      : 'Cloudflare Workers KV binding is not configured.',
  });
});

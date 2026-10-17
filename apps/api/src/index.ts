import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, AppVariables } from './types/env';
import { securityHeadersMiddleware } from './middleware/securityHeaders';
import { authMiddleware } from './middleware/auth';
import { sharesRouter } from './routes/shares';
import { uploadsRouter } from './routes/uploads';
import { plansRouter } from './routes/plans';
import { accountRouter } from './routes/account';
import { billingRouter } from './routes/billing';
import { healthRouter } from './routes/health';
import { CleanupService } from './services/cleanupService';
import { ShareRepository } from './repositories/shareRepository';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Automatic schema bootstrap middleware (ensures tables exist without manual commands)
app.use('*', async (c, next) => {
  if (c.env?.DB) {
    const repo = new ShareRepository(c.env.DB);
    await repo.ensureSchema();
  }
  await next();
});

// CORS middleware
app.use('*', async (c, next) => {
  const corsHandler = cors({
    origin: (origin) => {
      // Allow local development and configured app URL
      if (!origin) return '*';
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
      }
      if (c.env.APP_URL && origin.startsWith(c.env.APP_URL.replace(/\/$/, ''))) {
        return origin;
      }
      return origin; // or '*' for public API share links
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Deletion-Token'],
    exposeHeaders: ['Content-Disposition', 'Content-Length', 'Cache-Control', 'CDN-Cache-Control'],
    maxAge: 86400,
  });
  return corsHandler(c, next);
});

// Security headers
app.use('*', securityHeadersMiddleware);

// Auth & IP hash context
app.use('/api/*', authMiddleware);

// Mount routers
app.route('/api/shares', sharesRouter);
app.route('/api/uploads', uploadsRouter);
app.route('/api', plansRouter);
app.route('/api/account', accountRouter);
app.route('/api/billing', billingRouter);
app.route('/api/health', healthRouter);

// Fallback 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('[API Error]', err.name, err.message);
  const status = (err as any).status || 500;
  return c.json(
    {
      error: status === 500 ? 'Internal server error' : err.message,
    },
    status
  );
});

export default {
  fetch: app.fetch,
  // Cloudflare Cron Trigger scheduled cleanup task
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cleanup = new CleanupService(env);
    ctx.waitUntil(cleanup.runScheduledCleanup());
  },
};

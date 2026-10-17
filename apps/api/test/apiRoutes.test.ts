import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { MockD1Database } from './mockD1';
import { MockKVNamespace } from './mockKV';
import { Env, AppVariables } from '../src/types/env';
import { sharesRouter } from '../src/routes/shares';
import { uploadsRouter } from '../src/routes/uploads';
import { plansRouter } from '../src/routes/plans';
import { healthRouter } from '../src/routes/health';
import { authMiddleware } from '../src/middleware/auth';
import { securityHeadersMiddleware } from '../src/middleware/securityHeaders';

describe('Hono API End-to-End Routes (Cloudflare Workers KV + D1 Free)', () => {
  let db: MockD1Database;
  let kv: MockKVNamespace;
  let env: Env;
  let app: Hono<{ Bindings: Env; Variables: AppVariables }>;

  beforeEach(() => {
    db = new MockD1Database();
    kv = new MockKVNamespace();
    env = {
      DB: db as unknown as D1Database,
      IMAGE_STORE: kv as unknown as KVNamespace,
      APP_URL: 'http://localhost:5173',
      RATE_LIMIT_SECRET: 'test-rate-limit-secret-32chars!!',
      SESSION_SECRET: 'test-session-secret-32chars!!',
    };

    app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
    app.use('*', securityHeadersMiddleware);
    app.use('/api/*', authMiddleware);
    app.route('/api/shares', sharesRouter);
    app.route('/api/uploads', uploadsRouter);
    app.route('/api', plansRouter);
    app.route('/api/health', healthRouter);
  });

  it('GET /api/health returns 200 and ok status', async () => {
    const res = await app.request('/api/health', {}, env);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.service).toBe('BlinkShare API');
  });

  it('POST /api/shares/text creates share with 300s expiry and deletion token', async () => {
    const res = await app.request(
      '/api/shares/text',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'API Test Note',
          textContent: 'Hello from automated Hono test',
          textFormat: 'markdown',
        }),
      },
      env
    );

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.id).toBeDefined();
    expect(body.deletionToken).toBeDefined();
    expect(body.expiresAt - body.createdAt).toBe(300);
    expect(body.shareUrl).toContain(body.id);

    // Retrieve metadata
    const metaRes = await app.request(`/api/shares/${body.id}`, {}, env);
    expect(metaRes.status).toBe(200);
    const metaBody = await metaRes.json() as any;
    expect(metaBody.metadata.title).toBe('API Test Note');
    expect(metaBody.metadata.textFormat).toBe('markdown');

    // Retrieve content
    const contentRes = await app.request(`/api/shares/${body.id}/content`, {}, env);
    expect(contentRes.status).toBe(200);
    expect(contentRes.headers.get('cache-control')).toContain('no-store');
    const contentBody = await contentRes.json() as any;
    expect(contentBody.textContent).toBe('Hello from automated Hono test');

    // Delete share with secret token
    const delRes = await app.request(
      `/api/shares/${body.id}`,
      {
        method: 'DELETE',
        headers: { 'X-Deletion-Token': body.deletionToken },
      },
      env
    );
    expect(delRes.status).toBe(200);

    // After deletion, access is 404
    const checkAfter = await app.request(`/api/shares/${body.id}`, {}, env);
    expect(checkAfter.status).toBe(404);
  });

  it('Image upload flow: init -> upload binary -> finalize -> stream image from Workers KV', async () => {
    // 1. Init upload
    const initRes = await app.request(
      '/api/uploads/init',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'diagram.png',
          fileSize: 4,
          fileMimeType: 'image/png',
        }),
      },
      env
    );

    expect(initRes.status).toBe(201);
    const initData = await initRes.json() as any;
    expect(initData.uploadToken).toBeDefined();

    // 2. Upload binary stream
    const fakeImageBytes = new Uint8Array([137, 80, 78, 71]);
    const uploadRes = await app.request(
      `/api/uploads/${initData.uploadToken}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': '4',
        },
        body: fakeImageBytes,
      },
      env
    );
    expect(uploadRes.status).toBe(200);

    // 3. Finalize
    const finalizeRes = await app.request(
      `/api/uploads/${initData.uploadToken}/finalize`,
      { method: 'POST' },
      env
    );
    expect(finalizeRes.status).toBe(201);
    const finalizeData = await finalizeRes.json() as any;
    expect(finalizeData.contentType).toBe('image');
    expect(finalizeData.expiresAt - finalizeData.createdAt).toBe(300);

    // 4. Stream image
    const streamRes = await app.request(`/api/shares/${finalizeData.id}/image`, {}, env);
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get('content-type')).toBe('image/png');
    expect(streamRes.headers.get('cache-control')).toContain('no-store');
    expect(streamRes.headers.get('cdn-cache-control')).toBe('no-store');
  });

  it('BlinkShare route test 48291: creates share, verifies /t/:id URL, retrieves content, handles 404 and 410', async () => {
    // 1. Create share with distinctive text
    const distinctiveText = 'BlinkShare route test 48291';
    const res = await app.request(
      '/api/shares/text',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Route Verification Share',
          textContent: distinctiveText,
          textFormat: 'plain_text',
        }),
      },
      env
    );

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.id).toBeDefined();
    // 2. Share URL must be /t/:id
    expect(body.shareUrl).toBe(`http://localhost:5173/t/${body.id}`);

    // 3. Retrieve through /content API
    const contentRes = await app.request(`/api/shares/${body.id}/content`, {}, env);
    expect(contentRes.status).toBe(200);
    const contentData = await contentRes.json() as any;
    expect(contentData.textContent).toBe(distinctiveText);
    expect(contentData.metadata.title).toBe('Route Verification Share');
    expect(contentData.metadata.textFormat).toBe('plain_text');

    // 4. Nonexistent share ID returns 404
    const nonExistentRes = await app.request('/api/shares/nonexistent-id-99999/content', {}, env);
    expect(nonExistentRes.status).toBe(404);
    const nonExistentData = await nonExistentRes.json() as any;
    expect(nonExistentData.error).toBe('Share not found');

    // 5. Expired share returns 410 and does NOT expose text content
    env.TEST_CLOCK_OFFSET = '301';
    const expiredRes = await app.request(`/api/shares/${body.id}/content`, {}, env);
    expect(expiredRes.status).toBe(410);
    const expiredData = await expiredRes.json() as any;
    expect(expiredData.error).toContain('expired');
    expect(expiredData.textContent).toBeUndefined();
  });
});

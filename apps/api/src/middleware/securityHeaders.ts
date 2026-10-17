import { Context, Next } from 'hono';

export async function securityHeadersMiddleware(c: Context, next: Next) {
  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // If this is a share viewing or content route, enforce STRICT non-cache headers
  const path = c.req.path;
  if (
    path.startsWith('/api/shares') ||
    path.startsWith('/api/uploads') ||
    path.includes('/content') ||
    path.includes('/image')
  ) {
    c.header('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    c.header('CDN-Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
  }
}

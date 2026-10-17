import { describe, it, expect } from 'vitest';
import { matchRoutes } from 'react-router-dom';

describe('React Router configuration for BlinkShare', () => {
  // Routes equivalent to App.tsx
  const routes = [
    { path: '/', id: 'home' },
    { path: '/t/:shareId', id: 'text-viewer' },
    { path: '/t', id: 'text-viewer-missing-id' },
    { path: '/s/:shareId', id: 'legacy-text-viewer' },
    { path: '/s', id: 'legacy-text-viewer-missing-id' },
    { path: '/i/:shareId', id: 'image-viewer' },
    { path: '/i', id: 'image-viewer-missing-id' },
    { path: '/pricing', id: 'pricing' },
    { path: '/features', id: 'features' },
    { path: '/how-it-works', id: 'how-it-works' },
    { path: '/privacy', id: 'privacy' },
    { path: '/terms', id: 'terms' },
    { path: '/report-abuse', id: 'report-abuse' },
    { path: '/login', id: 'login' },
    { path: '/signup', id: 'signup' },
    { path: '/dashboard', id: 'dashboard' },
    { path: '/dashboard/billing', id: 'dashboard-billing' },
    { path: '*', id: 'not-found' },
  ];

  it('matches /t/fARUqM219J to text-viewer with shareId param without redirecting', () => {
    const matches = matchRoutes(routes, '/t/fARUqM219J');
    expect(matches).not.toBeNull();
    expect(matches![0].route.id).toBe('text-viewer');
    expect(matches![0].params.shareId).toBe('fARUqM219J');
  });

  it('matches /t/my-custom-notes to text-viewer with custom alias param', () => {
    const matches = matchRoutes(routes, '/t/my-custom-notes');
    expect(matches).not.toBeNull();
    expect(matches![0].route.id).toBe('text-viewer');
    expect(matches![0].params.shareId).toBe('my-custom-notes');
  });

  it('matches /t without id to text-viewer-missing-id without redirecting to /', () => {
    const matches = matchRoutes(routes, '/t');
    expect(matches).not.toBeNull();
    expect(matches![0].route.id).toBe('text-viewer-missing-id');
  });

  it('matches legacy /s/fARUqM219J for backwards compatibility', () => {
    const matches = matchRoutes(routes, '/s/fARUqM219J');
    expect(matches).not.toBeNull();
    expect(matches![0].route.id).toBe('legacy-text-viewer');
    expect(matches![0].params.shareId).toBe('fARUqM219J');
  });

  it('matches unknown paths to not-found page instead of redirecting', () => {
    const matches = matchRoutes(routes, '/some/random/missing/url');
    expect(matches).not.toBeNull();
    expect(matches![0].route.id).toBe('not-found');
  });
});

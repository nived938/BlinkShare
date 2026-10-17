# AGENTS.md — Agent Operations & Architecture Manual

This document provides definitive instructions, constraints, and operational guidelines for AI agents working on the **BlinkShare** codebase.

---

## 1. Project Philosophy & Core Invariants

BlinkShare is a fast, edge-native text, code snippet, and image sharing platform where **every share expires after exactly 300 seconds (5 minutes)**.

### Non-Negotiable Invariants:
1. **The 300-Second Hard Expiry**:
   - Every share expires in exactly 300 seconds (`now + 300`).
   - No paid plan, parameter, header, or override may increase this duration.
   - If `now >= expires_at`, the server MUST reject content retrieval with `410 Gone`. Content must never be returned even if physical cleanup has not run yet.
2. **Physical Deletion**:
   - Upon expiration or manual deletion, text rows in D1 and image binary objects in R2 are physically deleted, not soft-deleted.
3. **No R2 Billing Prerequisite**:
   - The application supports `IMAGE_STORAGE_MODE=local` (Wrangler/Miniflare simulated R2 storage) so local development and testing never require active Cloudflare billing or credit cards.
   - When R2 is unconfigured or disabled, text sharing via D1 remains 100% operational. Never store image binary bytes in D1 as a workaround.
4. **Edge Security & Cache Invalidation**:
   - All shares and image streams MUST emit `Cache-Control: private, no-store, no-cache, must-revalidate`.
   - Image buckets in R2 must remain strictly private. Never expose public R2 URLs that bypass expiration checks.

---

## 2. Monorepo Architecture

```text
blinkshare/
├── apps/
│   ├── web/                    # React 18, Vite, Tailwind CSS, Lucide React
│   │   ├── src/
│   │   │   ├── api/            # API client wrapper
│   │   │   ├── components/     # UI components (ShareTextTab, ShareImageTab, Modals)
│   │   │   ├── hooks/          # React hooks (useAuth)
│   │   │   ├── pages/          # Router pages (Home, Viewers, Pricing, Dashboard)
│   │   │   └── styles/         # Global styles
│   └── api/                    # Cloudflare Worker, Hono.js
│       ├── src/
│       │   ├── lib/            # WebCrypto helpers, clock utilities
│       │   ├── middleware/     # Auth, Rate limiting, Security headers
│       │   ├── repositories/   # D1 database prepared statement queries
│       │   ├── routes/         # Hono routes (shares, uploads, plans, account, billing)
│       │   ├── services/       # ShareService, ImageStorageService, CleanupService
│       │   └── types/          # Worker environment bindings
│       ├── migrations/         # D1 SQL migration scripts
│       └── test/               # Vitest automated test suite
├── packages/
│   └── shared/                 # Shared TypeScript contracts, Zod schemas, plan configs
├── docs/                       # Architectural & operational documentation
├── wrangler.toml               # Root Cloudflare Wrangler configuration
└── AGENTS.md                   # Agent operations manual (this file)
```

---

## 3. Essential Commands

### Installation & Builds
```bash
# Install dependencies across all monorepo workspaces
pnpm install

# Build shared package (MANDATORY before building web or api)
pnpm --filter @blinkshare/shared build

# Build frontend for production
pnpm --filter @blinkshare/web build

# Run test suite
pnpm test
```

### Local Development
```bash
# Execute local D1 SQLite migrations
pnpm --filter @blinkshare/api wrangler d1 execute blinkshare-db --local --file=./migrations/0001_initial_schema.sql

# Start Backend Worker API (port 8787)
pnpm dev:api

# Start Frontend Vite Dev Server (port 5173)
pnpm dev:web
```

> **Note for Windows Environments**: When executing chained shell commands, use `;` instead of `&&` in PowerShell.

---

## 4. Storage Architecture (`ImageStorageService`)

All image operations MUST route through `apps/api/src/services/imageStorageService.ts`:
- `uploadImage(key, data, mimeType)`
- `getImage(key)`
- `deleteImage(key)`
- `isAvailable()`
- `getMode()`

### Supported Storage Modes (`IMAGE_STORAGE_MODE`):
- `local`: Miniflare local simulated R2 storage (`.wrangler/state/v3/r2`).
- `r2`: Remote Cloudflare R2 bucket (`IMAGES` binding).
- `disabled`: Gracefully returns 503 for image uploads while allowing full D1 text sharing.

---

## 5. Coding Standards & Guidelines

1. **Edge Runtime Compatibility**:
   - Use standard Web APIs (`Request`, `Response`, `fetch`, `Headers`, `ReadableStream`, `crypto.subtle`).
   - Do NOT import Node-native modules (`node:crypto`, `node:fs`, `node:net`) that break inside Cloudflare Workers isolates.
2. **Database Queries**:
   - Always use prepared statements (`this.db.prepare('...').bind(...)`). Never concatenate raw SQL strings.
3. **Secret Generation**:
   - Use cryptographically secure random values via WebCrypto (`generateSecureId(32)`).
4. **Time Standards**:
   - Always calculate timestamps in seconds using `getCurrentTimestamp(env)`. This enables synthetic time mocking during tests.

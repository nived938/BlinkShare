# AGENTS.md — Agent Operations & Architecture Manual

This document provides definitive instructions, constraints, and operational guidelines for AI agents working on the **BlinkShare** codebase.

---

## 1. Project Philosophy & Core Invariants

BlinkShare is a fast, edge-native text, code snippet, and image sharing platform where **every share expires after exactly 300 seconds (5 minutes)**.

### Non-Negotiable Invariants:
1. **100% Free, Zero Billing Dependency**:
   - The entire website operates within Cloudflare's **Free Tier** (Workers Free, D1 Free, Workers KV Free, Pages Free).
   - Never introduce paid services, subscriptions, credit cards, or billing requirements.
   - Do not use Cloudflare R2; image storage is powered by **Cloudflare Workers KV** (`IMAGE_STORE`).
   - Commercial billing (Stripe, Razorpay, paid subscriptions) is completely removed. Every feature is 100% free for all users.
2. **The 300-Second Hard Expiry**:
   - Every share expires in exactly 300 seconds (`now + 300`).
   - If `now >= expires_at`, the server MUST reject content retrieval with `410 Gone`. Content must never be returned even if physical cleanup has not run yet.
3. **Physical Deletion**:
   - Upon expiration or manual deletion, text rows in D1 and image binary objects in Workers KV are physically deleted, not soft-deleted.
   - KV binary objects must be deleted before or concurrently with D1 row removal.
4. **Binary KV Storage (No Base64 Inflation)**:
   - Images are stored as raw binary in Workers KV up to 5 MB per upload.
   - Never encode binary images to base64, preserving storage efficiency.
5. **Edge Security & Cache Invalidation**:
   - All shares and image streams MUST emit `Cache-Control: private, no-store, no-cache, must-revalidate`.

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
│   │   │   ├── pages/          # Router pages (Home, Viewers, Pricing/Limits, Dashboard)
│   │   │   └── styles/         # Global styles
│   └── api/                    # Cloudflare Worker, Hono.js
│       ├── src/
│       │   ├── lib/            # WebCrypto helpers, clock utilities
│       │   ├── middleware/     # Auth, Rate limiting, Security headers
│       │   ├── repositories/   # D1 database prepared statements + auto ensureSchema()
│       │   ├── routes/         # Hono routes (shares, uploads, plans, account, billing, health)
│       │   ├── services/       # ShareService, ImageStorageService (KV), CleanupService
│       │   └── types/          # Worker environment bindings (DB, IMAGE_STORE)
│       ├── migrations/         # D1 SQL migration scripts (0001_initial_schema.sql)
│       └── test/               # Vitest automated test suite (mockD1, mockKV)
├── packages/
│   └── shared/                 # Shared TypeScript contracts, Zod schemas, free quota constants
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
# Start Backend Worker API (port 8787)
pnpm dev:api

# Start Frontend Vite Dev Server (port 5173)
pnpm dev:web
```

> **Zero Configuration First Boot**:
> The database tables auto-initialize on the first incoming request via `ShareRepository.ensureSchema()`. Running manual `wrangler d1 execute` migrations is optional in local development.

---

## 4. Free Tier Quotas & Limits

- **Maximum Image Size**: Strict 5 MB (Cloudflare KV Free limit is 25 MB/key).
- **Maximum Text Size**: Strict 100 KB (D1 SQLite Free).
- **Anonymous Daily Quota**: 10 shares / day per visitor (hashed IP).
- **Registered Free Account Quota**: 100 shares / day.
- **Per-minute Rate Limit**: 20 requests / minute.
- **Global Storage Guard**: Pauses new image uploads if active stored bytes reach 500 MB (safe buffer under 1 GB KV free tier).

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

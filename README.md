# BlinkShare ⚡

> "Share it now. Gone in five."

BlinkShare is a fast, secure, edge-native five-minute text, code snippet, and image sharing platform built on Cloudflare Workers, Cloudflare D1, and Cloudflare R2.

---

## Key Features

- **Hard 300-Second Expiry**: Every share is hard-limited to 5 minutes (300 seconds). Content is completely inaccessible at the boundary, guaranteed on the server.
- **Dual Sharing Experience**:
  - **Share Text & Code**: Markdown support, Prism syntax highlighting for 12+ languages, live byte counters, and sensitive credential detection.
  - **Share Image & Screenshot**: Drag & drop, direct clipboard paste (`Ctrl+V`), local preview, zoom & fullscreen viewer, and secure chunk streaming.
- **Private Edge Storage**:
  - Ephemeral text & metadata in Cloudflare D1.
  - Raw images streamed from private Cloudflare R2 buckets with `Cache-Control: private, no-store`.
- **Automated Physical Cleanup**:
  - Dual-layer: Lazy cleanup on access + Cloudflare Cron Trigger (`* * * * *`) every minute with retry queue.
- **Privacy First**: Zero IP logging, client-side local QR code generation, secret anonymous deletion tokens.
- **Pricing & Quota Engine**: Free, Plus (₹99/mo), and Pro (₹249/mo) plans with strictly enforced server quotas.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6, Prism.js, marked, DOMPurify, QRCode.
- **Backend**: Cloudflare Workers, Hono.js, TypeScript.
- **Database**: Cloudflare D1 (Prepared SQLite).
- **Storage**: Cloudflare R2 (Private image bucket).
- **Scheduled Tasks**: Cloudflare Cron Triggers.
- **Monorepo**: pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`).

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm --filter @blinkshare/shared build

# 3. Initialize local D1 database
pnpm --filter @blinkshare/api wrangler d1 execute blinkshare-db --local --file=./migrations/0001_initial_schema.sql

# 4. Start API (Worker)
pnpm dev:api

# 5. In another terminal, start Web (Vite)
pnpm dev:web
```

Open `http://localhost:5173` to start sharing.

---

## Running Tests

```bash
pnpm test
```

Runs comprehensive Vitest automated tests covering exact 300-second expiration, R2/D1 cleanup, retry queues, rate limiting, and password protection.

---

## Documentation

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Local Development Guide](docs/LOCAL-DEVELOPMENT.md)
- [Cloudflare Setup](docs/CLOUDFLARE-SETUP.md)
- [Expiration & Physical Cleanup](docs/EXPIRATION-AND-CLEANUP.md)
- [Security & Anti-Abuse](docs/SECURITY.md)
- [Pricing & Quota Configuration](docs/PRICING-AND-LIMITS.md)
- [Deployment Runbook](docs/DEPLOYMENT.md)

---

## License

MIT

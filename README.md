# BlinkShare ⚡

> "Share it now. Gone in five."

BlinkShare is a fast, secure, edge-native five-minute text, code snippet, and image sharing platform built on Cloudflare Workers, Cloudflare D1, and Cloudflare R2.

---

## Key Features

- **Hard 300-Second Expiry**: Every share is hard-limited to exactly 5 minutes (300 seconds). Content is completely inaccessible at the boundary, guaranteed on the server.
- **Dual Sharing Experience**:
  - **Share Text & Code**: Markdown support, Prism syntax highlighting for 12+ languages, live byte counters, and sensitive credential detection.
  - **Share Image & Screenshot**: Drag & drop, direct clipboard paste (`Ctrl+V`), local preview, zoom & fullscreen viewer, and secure chunk streaming.
- **Flexible Image Storage Modes**:
  - **Local Development**: Built-in Wrangler R2 simulation (`IMAGE_STORAGE_MODE=local`). **No Cloudflare R2 billing required to run and test.**
  - **Production Edge**: Private Cloudflare R2 bucket (`IMAGE_STORAGE_MODE=r2`) streamed with `Cache-Control: private, no-store`.
  - **Graceful Zero-R2 Fallback**: If deployed without R2 billing (`IMAGE_STORAGE_MODE=disabled`), image sharing gracefully disables while text sharing, accounts, and pricing remain 100% operational.
- **Automated Physical Cleanup**:
  - Dual-layer: Lazy cleanup on access + Cloudflare Cron Trigger (`* * * * *`) every minute with retry queue.
- **Privacy First**: Zero IP logging (keyed salted hash for rate limiting only), client-side local QR code generation, secret anonymous deletion tokens.
- **Pricing & Quota Engine**: Free, Plus (₹99/mo), and Pro (₹249/mo) plans with strictly enforced server quotas. (Duration is permanently fixed at 5 minutes across all plans).

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6, Prism.js, marked, DOMPurify, QRCode.
- **Backend**: Cloudflare Workers, Hono.js, TypeScript.
- **Database**: Cloudflare D1 (Prepared SQLite).
- **Storage**: Cloudflare R2 (Simulated locally via Miniflare; private bucket in production).
- **Scheduled Tasks**: Cloudflare Cron Triggers.
- **Monorepo**: pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`).

---

## Quick Start (No Cloudflare Billing Needed!)

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm --filter @blinkshare/shared build

# 3. Initialize local D1 database
pnpm --filter @blinkshare/api wrangler d1 execute blinkshare-db --local --file=./migrations/0001_initial_schema.sql

# 4. Start API Worker (with simulated local R2 storage)
pnpm dev:api

# 5. In another terminal, start Web (Vite)
pnpm dev:web
```

Open `http://localhost:5173` to start sharing text and images!

---

## Cloudflare R2: Activating Later When Ready

You can develop, test, and even deploy text-sharing before enabling R2 billing. When you are ready to enable Cloudflare R2:

1. **Activate R2 in Cloudflare Dashboard**:
   - Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **R2 Object Storage**.
   - Enable R2 billing (includes a generous free tier of 10 GB/month).
2. **Create the Private Bucket**:
   ```bash
   wrangler r2 bucket create blinkshare-images
   ```
3. **Configure Environment in `apps/api/wrangler.toml`**:
   ```toml
   [vars]
   IMAGE_STORAGE_MODE = "r2"

   [[r2_buckets]]
   binding = "IMAGES"
   bucket_name = "blinkshare-images"
   ```
4. **Deploy the Worker**:
   ```bash
   pnpm --filter @blinkshare/api deploy
   ```
5. **Verify**:
   - Visit `/api/health/storage` — it returns `{"status":"ok","storageMode":"r2","storageAvailable":true}`.

---

## Running Automated Tests

```bash
pnpm test
```

Runs comprehensive Vitest automated tests covering exact 300-second expiration, R2/D1 cleanup, retry queues, rate limiting, and password protection.

---

## Documentation

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Local Development Guide](docs/LOCAL-DEVELOPMENT.md)
- [Cloudflare Setup & Resource Provisioning](docs/CLOUDFLARE-SETUP.md)
- [Expiration & Physical Cleanup](docs/EXPIRATION-AND-CLEANUP.md)
- [Security & Anti-Abuse](docs/SECURITY.md)
- [Pricing & Quota Configuration](docs/PRICING-AND-LIMITS.md)
- [Deployment Runbook](docs/DEPLOYMENT.md)

---

## License

MIT

# BlinkShare ⚡

> "Share it now. Gone in five."

BlinkShare is a fast, secure, edge-native five-minute text, code snippet, and image sharing platform built on **Cloudflare's 100% Free Tier** using Cloudflare Workers, Cloudflare D1 (SQLite), and Cloudflare Workers KV.

**Zero Billing • Zero Credit Cards • 100% Free Forever**

---

## Key Features

- **Hard 300-Second Expiry**: Every share is hard-limited to exactly 5 minutes (300 seconds). Content is completely inaccessible at the boundary, guaranteed on the server.
- **Dual Sharing Experience**:
  - **Share Text & Code**: Markdown support, Prism syntax highlighting for 12+ languages, live byte counters, and sensitive credential detection.
  - **Share Image & Screenshot**: Drag & drop, direct clipboard paste (`Ctrl+V`), local preview, zoom & fullscreen viewer, and secure chunk streaming.
- **100% Free Edge Infrastructure (No R2, No Billing)**:
  - **Text & Metadata**: Stored in Cloudflare D1 SQLite.
  - **Image Storage**: Raw binary stored directly in Cloudflare Workers KV (`IMAGE_STORE`) up to 5 MB per upload.
  - **Auto-Schema Bootstrap**: Database tables automatically initialize on first launch—no manual migration commands required.
- **All Security Features Included For Free**:
  - End-to-end password locks with PBKDF2 hashing.
  - Burn-after-first-view self-destruction.
  - Custom share aliases (e.g. `/t/my-notes`).
  - Recipient download toggle.
  - Secret creator deletion token (`HMAC-SHA256`).
- **Automated Physical Cleanup**:
  - Dual-layer: Lazy cleanup on expired access + Cloudflare Cron Trigger (`* * * * *`) every minute with retry queue.
  - Deletes KV binary objects before removing D1 records.
- **Privacy First**: Zero IP logging (keyed salted hash for rate limiting only), client-side local QR code generation.

---

## Free Tier Limits

| Resource | Free Tier Limit | Backing Service |
| :--- | :--- | :--- |
| **Share Lifetime** | Strictly 300 seconds (5 min) | Server clock enforced |
| **Max Image Size** | 5 MB per upload | Cloudflare Workers KV Free |
| **Max Text Size** | 100 KB per share | Cloudflare D1 Free |
| **Anonymous Daily Quota** | 10 shares / day | Keyed salted IP hash |
| **Registered Account Quota** | 100 shares / day | Free User Account |
| **Rate Limit** | 20 requests / minute | Sliding window in D1 |
| **Monthly Cost** | **₹0 / $0 Forever** | Cloudflare Free Plan |

---

## Quick Start (Zero Setup Needed)

```bash
# 1. Install dependencies
pnpm install

# 2. Build the shared contracts
pnpm --filter @blinkshare/shared build

# 3. Start API Worker (port 8787)
pnpm dev:api

# 4. In a second terminal, start React Web (port 5173)
pnpm dev:web
```

Open `http://localhost:5173` to start sharing text and images!

> The local D1 database and Workers KV automatically initialize on the first request.

---

## Free Production Deployment Guide (No Payment Method Needed)

### 1. Cloudflare Login
```bash
wrangler login
```

### 2. Create Free D1 Database
```bash
wrangler d1 create blinkshare-db
```
Copy the generated `database_id` into `wrangler.toml` and `apps/api/wrangler.toml`.

### 3. Create Free Workers KV Namespace
```bash
wrangler kv namespace create IMAGE_STORE
```
Copy the generated `id` into `wrangler.toml` and `apps/api/wrangler.toml`.

### 4. Deploy the Worker API
```bash
pnpm --filter @blinkshare/api deploy
```

### 5. Deploy the Web Frontend to Cloudflare Pages
```bash
pnpm --filter @blinkshare/shared build
pnpm --filter @blinkshare/web build
wrangler pages deploy apps/web/dist --project-name=blinkshare-web
```

---

## Running Automated Tests

```bash
pnpm test
```

Runs comprehensive Vitest automated tests covering exact 300-second expiration, Workers KV binary object deletion, D1 physical purge, retry queue resilience, rate limiting, and password protection.

---

## License

MIT

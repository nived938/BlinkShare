# Cloudflare Free Production Deployment Guide

Deploy BlinkShare completely on Cloudflare's **100% Free Plan** with **Zero Billing, Zero Payment Methods, and Zero Credit Cards**.

---

## Free Architecture Overview

| Component | Cloudflare Service | Free Tier Allocation |
| :--- | :--- | :--- |
| **API Worker** | Cloudflare Workers Free | 100,000 requests / day |
| **Database** | Cloudflare D1 (SQLite) | 5M read rows/day, 100K write rows/day |
| **Image Storage** | Cloudflare Workers KV | 100,000 read ops/day, 1,000 write ops/day, 1 GB storage |
| **Frontend** | Cloudflare Pages Free | Unlimited requests, 500 builds/month |
| **Cleanup** | Cron Triggers Free | 1 cron schedule included |

---

## Step-by-Step Deployment

### 1. Cloudflare Login
```bash
wrangler login
```

### 2. Create Free Cloudflare D1 Database
```bash
wrangler d1 create blinkshare-db
```

Output:
```toml
[[d1_databases]]
binding = "DB"
database_name = "blinkshare-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Paste the `database_id` into `wrangler.toml` and `apps/api/wrangler.toml`.

Apply initial schema:
```bash
wrangler d1 execute blinkshare-db --remote --file=apps/api/migrations/0001_initial_schema.sql
```

### 3. Create Free Cloudflare Workers KV Namespace
```bash
wrangler kv namespace create IMAGE_STORE
```

Output:
```toml
[[kv_namespaces]]
binding = "IMAGE_STORE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Paste the `id` into `wrangler.toml` and `apps/api/wrangler.toml`.

### 4. Set Worker Secrets
```bash
wrangler secret put RATE_LIMIT_SECRET
wrangler secret put SESSION_SECRET
```

### 5. Deploy Cloudflare Worker API
```bash
pnpm --filter @blinkshare/api deploy
```

### 6. Deploy Cloudflare Pages Frontend
```bash
pnpm --filter @blinkshare/shared build
pnpm --filter @blinkshare/web build
wrangler pages deploy apps/web/dist --project-name=blinkshare-web
```

---

## Production Smoke Test

1. Visit your Cloudflare Pages URL.
2. Share a text snippet: verify 5-minute countdown and copy link.
3. Open in another browser: verify content renders and auto-expires.
4. Upload an image (under 5 MB): verify thumbnail, full image view, and deletion after 5 minutes.
5. Check `/api/health`: confirms `imageStorageAvailable: true` and `tier: "100% Free Plan (Zero Billing)"`.

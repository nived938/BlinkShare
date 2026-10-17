# Deployment & Production Runbook

This runbook guides production deployment on Cloudflare Pages and Cloudflare Workers.

---

## 1. Cloudflare Workers API Deployment

### Step A: Verify wrangler.toml
Ensure `wrangler.toml` has your real D1 `database_id` and R2 bucket binding:

```toml
name = "blinkshare-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
APP_NAME = "BlinkShare"
APP_URL = "https://blinkshare.pages.dev"
BILLING_PROVIDER = "none"

[[d1_databases]]
binding = "DB"
database_name = "blinkshare-db"
database_id = "your-d1-database-uuid"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "blinkshare-images"

[triggers]
crons = ["* * * * *"]
```

### Step B: Apply D1 Migrations to Production
```bash
wrangler d1 execute blinkshare-db --remote --file=apps/api/migrations/0001_initial_schema.sql
```

### Step C: Deploy Worker
```bash
pnpm --filter @blinkshare/api deploy
```

---

## 2. Cloudflare Pages Frontend Deployment

### Step A: Build Static Assets
```bash
pnpm --filter @blinkshare/shared build
pnpm --filter @blinkshare/web build
```
This produces optimized production assets in `apps/web/dist`.

### Step B: Deploy to Pages
```bash
wrangler pages deploy apps/web/dist --project-name=blinkshare-web
```

### Step C: Configure Custom Domain (Optional)
In Cloudflare Dashboard:
1. Navigate to **Workers & Pages** -> **blinkshare-web** -> **Custom domains**.
2. Add your domain (e.g. `blinkshare.io`).
3. Under Worker Routes, route `blinkshare.io/api/*` to `blinkshare-api`.

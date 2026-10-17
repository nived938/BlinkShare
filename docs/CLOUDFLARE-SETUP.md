# Cloudflare Setup & Resource Provisioning

Follow these steps to deploy BlinkShare to production on your Cloudflare account.

> **Note on Cloudflare R2 Billing**: You do NOT need active Cloudflare R2 billing to develop or test BlinkShare locally. Local development uses Wrangler's built-in Miniflare R2 simulation (`IMAGE_STORAGE_MODE=local`). If deploying to Cloudflare before activating R2 billing, set `IMAGE_STORAGE_MODE=disabled` or omit R2 bucket bindings; text sharing, user accounts, and pricing remain 100% operational.

---

## 1. Cloudflare Login

Log in to your Cloudflare account via Wrangler:

```bash
wrangler login
```

---

## 2. Create Cloudflare D1 Database

Run:

```bash
wrangler d1 create blinkshare-db
```

Output will display your database binding configuration:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blinkshare-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Paste this `database_id` into `wrangler.toml` and `apps/api/wrangler.toml`.

Apply migrations to remote production D1:

```bash
wrangler d1 execute blinkshare-db --remote --file=apps/api/migrations/0001_initial_schema.sql
```

---

## 3. Cloudflare R2 Setup (When Billing Is Activated)

### Pre-billing State:
If Cloudflare R2 billing is not enabled yet:
- In production, set `IMAGE_STORAGE_MODE = "disabled"` in your worker configuration.
- Text sharing via D1 works completely without R2.
- Any image upload requests gracefully return HTTP 503 explaining that storage is being configured, without breaking the site.

### Activating Real R2 Storage:
Once you enable R2 billing in the Cloudflare Dashboard:

1. **Enable R2 in Dashboard**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **R2 Object Storage**.
   - If prompted, activate R2 billing (Cloudflare provides a generous free tier of 10 GB/month storage and millions of operations).

2. **Create the Private Bucket**:
   - In Dashboard or CLI:
   ```bash
   wrangler r2 bucket create blinkshare-images
   ```
   - **Crucial**: Keep the bucket strictly private. Do NOT enable public bucket access. All image bytes must be accessed exclusively through the 5-minute authenticated Worker API.

3. **Update Production Configuration**:
   - In `apps/api/wrangler.toml`:
   ```toml
   [vars]
   IMAGE_STORAGE_MODE = "r2"

   [[r2_buckets]]
   binding = "IMAGES"
   bucket_name = "blinkshare-images"
   ```

4. **Redeploy the API Worker**:
   ```bash
   pnpm --filter @blinkshare/api deploy
   ```

5. **Verify Setup**:
   - Check `https://<your-worker-domain>/api/health/storage` — it will return:
     `{ "status": "ok", "storageMode": "r2", "storageAvailable": true }`.
   - Test image upload, preview, and verify automatic 5-minute cleanup.

---

## 4. Set Production Secrets

Set the cryptographic secrets on the Worker:

```bash
wrangler secret put RATE_LIMIT_SECRET
wrangler secret put SESSION_SECRET
```

Optional payment provider secrets:
```bash
# If using Stripe:
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# If using Razorpay:
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

---

## 5. Deploy Cloudflare Worker API

Deploy the API Worker:

```bash
pnpm --filter @blinkshare/api deploy
```

---

## 6. Deploy Cloudflare Pages Frontend

Build the web application:

```bash
pnpm --filter @blinkshare/shared build
pnpm --filter @blinkshare/web build
```

Deploy the `apps/web/dist` directory to Cloudflare Pages:

```bash
wrangler pages deploy apps/web/dist --project-name=blinkshare-web
```

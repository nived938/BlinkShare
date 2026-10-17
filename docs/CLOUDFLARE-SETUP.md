# Cloudflare Setup & Resource Provisioning

Follow these steps to deploy BlinkShare to production on your Cloudflare account.

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

## 3. Create Cloudflare R2 Bucket

Create the private image bucket:

```bash
wrangler r2 bucket create blinkshare-images
```

Verify that the bucket is private (public URL access disabled). All image bytes must only be accessed through the Worker API.

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

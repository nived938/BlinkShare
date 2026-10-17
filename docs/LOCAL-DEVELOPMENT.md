# Local Development Guide (100% Free Plan)

This guide walks you through running BlinkShare locally using Cloudflare's official development tools (`wrangler`).

> **Zero Cloudflare Billing Required**:
> BlinkShare runs entirely on Cloudflare Free Tier services (Workers Free, D1 Free, Workers KV Free).
> No credit card, payment method, or paid subscription is required at any time.

---

## Prerequisites

- Node.js 18+ (tested on Node.js 24)
- pnpm 9+ or 10+ (recommended)
- Git

---

## 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/nived938/BlinkShare.git
cd BlinkShare
pnpm install
```

Build the shared contract types:

```bash
pnpm --filter @blinkshare/shared build
```

---

## 2. Environment Configuration

Copy the example development files:

```bash
# On Linux/macOS
cp .env.example .env
cp .dev.vars.example .dev.vars
cp .dev.vars.example apps/api/.dev.vars

# On Windows PowerShell
Copy-Item .env.example .env
Copy-Item .dev.vars.example .dev.vars
Copy-Item .dev.vars.example apps/api/.dev.vars
```

---

## 3. Running Development Servers

### Terminal 1: Start Backend Worker API (port 8787)
```bash
pnpm dev:api
```

The Worker API runs on `http://localhost:8787` with local Miniflare simulations for both Cloudflare D1 SQLite and Workers KV.

> **Auto-Schema Bootstrap**:
> Database tables auto-initialize on the first incoming request via `ShareRepository.ensureSchema()`. You will never see `no such table: rate_limit_counters` or missing table errors.

### Terminal 2: Start React Frontend (port 5173)
```bash
pnpm dev:web
```

The frontend will open at `http://localhost:5173`. Vite proxies `/api` calls directly to `http://localhost:8787`.

---

## 4. Testing 5-Minute Expiration Locally

1. Open `http://localhost:5173`.
2. Share a text snippet or upload an image (via file picker or screenshot `Ctrl+V`).
3. Note the generated 5-minute countdown timer.
4. Open the link in an incognito window to view it.
5. Once 300 seconds elapse:
   - Accessing the link immediately returns a 410 Gone / "This share has expired and is no longer accessible" message.
   - The server purges the content and marks it expired.
   - The scheduled cleanup routine purges any expired local KV objects and D1 rows.

---

## 5. Running Automated Tests

Run the full automated test suite:

```bash
pnpm test
```

This verifies:
- Strict 300-second expiration enforcement at the boundary
- D1 SQLite and Workers KV physical deletions
- Retry queue resilience with exponential backoff
- Free-tier quotas (5 MB images, 100 KB text, 10 shares/day anonymous)
- Unlocked password protection and atomic burn-after-first-view

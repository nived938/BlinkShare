# Local Development Guide

This guide walks you through running BlinkShare locally using Cloudflare's official development tools (`wrangler`).

> **Zero Cloudflare Billing Required for Development**:
> You do **not** need a Cloudflare account with R2 billing to run and test BlinkShare locally.
> BlinkShare uses Wrangler's built-in Miniflare local R2 simulation (`IMAGE_STORAGE_MODE=local`).
> Images are uploaded, stored, previewed, downloaded, and physically deleted after 5 minutes entirely on your local machine under `.wrangler/state/v3/r2`.

---

## Prerequisites

- Node.js 18+ (tested with Node.js 24)
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

Ensure `IMAGE_STORAGE_MODE=local` is set in `.dev.vars` (this is the default).

### Available Storage Modes:
- `IMAGE_STORAGE_MODE=local`: Miniflare local R2 simulation (No Cloudflare billing required).
- `IMAGE_STORAGE_MODE=r2`: Production Cloudflare R2 binding (When R2 billing is activated in Cloudflare).
- `IMAGE_STORAGE_MODE=disabled`: Disables image sharing gracefully; text sharing, user accounts, and billing remain 100% operational.

---

## 3. Database Migration (Local D1 SQLite)

Initialize the local D1 SQLite database:

```bash
pnpm --filter @blinkshare/api wrangler d1 execute blinkshare-db --local --file=./migrations/0001_initial_schema.sql
```

This creates tables for `shares`, `upload_sessions`, `cleanup_retries`, `rate_limits`, `abuse_reports`, `users`, and `billing_customers`.

---

## 4. Running the Development Servers

In terminal 1, start the Cloudflare Worker API:

```bash
pnpm dev:api
```
The Worker API will start on `http://localhost:8787`. You can test the storage status endpoint:
```bash
curl http://localhost:8787/api/health/storage
# Returns: {"status":"ok","storageMode":"local","storageAvailable":true,"message":"Local R2 simulation active..."}
```

In terminal 2, start the Vite frontend:

```bash
pnpm dev:web
```
The web app opens at `http://localhost:5173`. Vite automatically proxies `/api` calls directly to `http://localhost:8787`.

---

## 5. Testing the 5-Minute Expiration Locally

1. Open `http://localhost:5173`.
2. Share a text snippet or upload an image (via file picker or screenshot `Ctrl+V`).
3. Note the generated 5-minute countdown timer.
4. Open the link in a private/incognito window to view it.
5. Once 300 seconds elapse:
   - Accessing the link immediately returns a 410 Gone / "This share has expired and is no longer accessible" message.
   - The server purges the content and marks it expired.
   - The scheduled cleanup routine purges any abandoned or expired local R2 objects and D1 rows.

---

## 6. Running Automated Tests

Run the full automated test suite:

```bash
pnpm test
```

This verifies:
- Strict 300-second expiration enforcement at the boundary
- D1 and R2 physical deletions
- Retry queue resilience with exponential backoff
- Plan limits, rate limiting, and password protection

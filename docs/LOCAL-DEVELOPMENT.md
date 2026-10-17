# Local Development Guide

This guide walks you through running BlinkShare locally using Cloudflare's official development tools (`wrangler`).

## Prerequisites

- Node.js 18+ (tested with Node.js 24)
- pnpm (recommended) or npm
- Wrangler CLI (`pnpm add -g wrangler` or via project devDependencies)

---

## 1. Installation

Clone or open the repository:

```bash
cd BlinkShare
pnpm install
```

Build the shared package first:

```bash
pnpm --filter @blinkshare/shared build
```

---

## 2. Environment Configuration

Copy example files:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
cp .dev.vars.example apps/api/.dev.vars
```

The default `.dev.vars` contains local development secrets suitable for development.

---

## 3. Database Migration (Local D1)

Initialize the local D1 SQLite database:

```bash
pnpm --filter @blinkshare/api wrangler d1 execute blinkshare-db --local --file=./migrations/0001_initial_schema.sql
```

---

## 4. Running the Development Servers

In terminal 1, start the Cloudflare Worker API:

```bash
pnpm --filter @blinkshare/api dev
```
The API server will listen on `http://localhost:8787`.

In terminal 2, start the Vite frontend:

```bash
pnpm --filter @blinkshare/web dev
```
The frontend will open at `http://localhost:5173`. Vite proxies `/api` calls directly to `http://localhost:8787`.

---

## 5. Running Automated Tests

Run the full automated test suite:

```bash
pnpm test
```

This verifies:
- Exact 300-second expiration enforcement
- D1 and R2 physical deletions
- Retry queue resilience
- Plan limits, rate limiting, and password locking

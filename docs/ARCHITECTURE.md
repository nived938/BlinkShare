# BlinkShare Architecture

BlinkShare is a high-performance, cost-efficient ephemeral sharing application designed specifically for Cloudflare's edge network.

## Core Philosophy

1. **Hard 300-Second Invariant**: Every piece of content expires 300 seconds (5 minutes) after creation. This duration is strictly non-negotiable and cannot be extended by paid plans.
2. **Zero Residual Storage**: Expired content cannot be read or retrieved, even if scheduled physical cleanup has not completed.
3. **Private-by-Design Edge Storage**: Images are stored in private Cloudflare R2 buckets and streamed through Worker API endpoints with strict non-caching headers (`Cache-Control: private, no-store, max-age=0`).
4. **Privacy-Preserving Anti-Abuse**: Network identifiers are passed through a keyed cryptographic one-way hash (`HMAC-SHA256`) before rate limit counters are evaluated. Raw IP addresses are never persisted in logs or database tables.

---

## Monorepo Structure

```text
blinkshare/
├── apps/
│   ├── web/                     # React 18, TypeScript, Vite, Tailwind CSS (Cloudflare Pages)
│   │   ├── src/
│   │   │   ├── components/      # UI components (Header, Footer, Tabs, Timers, Modals)
│   │   │   ├── pages/           # Route views (Home, TextViewer, ImageViewer, Pricing, Dashboard)
│   │   │   ├── hooks/           # useAuth, context providers
│   │   │   ├── api/             # Client API wrapper
│   │   │   └── styles/          # Tailwind and Prism syntax styling
│   │   └── public/
│   └── api/                     # Cloudflare Worker API (Hono.js)
│       ├── src/
│       │   ├── routes/          # /api/shares, /api/uploads, /api/plans, /api/account, /api/billing
│       │   ├── middleware/      # securityHeaders, auth, rateLimit
│       │   ├── services/        # ShareService, CleanupService, RateLimitService, BillingService
│       │   ├── repositories/    # D1 prepared SQL repositories
│       │   └── index.ts         # Worker entry point and cron trigger scheduled handler
│       ├── migrations/          # D1 versioned SQL schema
│       └── test/                # Automated Vitest test suite with in-memory D1 and R2 mocks
├── packages/
│   └── shared/                  # Common TypeScript types, plan limits, Zod schemas, sensitive detection
├── docs/                        # Architecture, deployment, setup guides
├── wrangler.toml                # Cloudflare Worker, D1, R2, and Cron configuration
└── package.json                 # Monorepo root scripts
```

---

## Data Flow Diagram

```mermaid
flowchart TD
    User([User / Browser]) -->|1. Submit Text or Image| CFWorker[Cloudflare Worker / Hono API]
    CFWorker -->|2. Check IP hash rate limits & quotas| D1[(Cloudflare D1)]
    CFWorker -->|3a. Write Text Content| D1
    CFWorker -->|3b. Stream Binary Image| R2[(Cloudflare R2 Bucket)]
    CFWorker -->|4. Return 5-min link & Secret Deletion Token| User

    Recipient([Recipient]) -->|5. Open /s/:id or /i/:id| CFWorker
    CFWorker -->|6. Check current_time >= expires_at| D1
    CFWorker -->|7a. If expired: deny access 410| Recipient
    CFWorker -->|7b. If valid: stream with Cache-Control: no-store| Recipient

    CronTrigger[Cloudflare Cron Trigger * * * * *] -->|8. Run every 60s| CleanupService
    CleanupService -->|9. Delete R2 objects first| R2
    CleanupService -->|10. Purge D1 records| D1
```

---

## Storage Breakdown

- **Cloudflare D1**: Stores ephemeral text content, share metadata, rate limit counters, user account records, and cleanup retry queues.
- **Cloudflare R2**: Stores private raw image binaries (JPEG, PNG, WebP, GIF, AVIF). Direct public bucket access is disabled.

# AGY.md — Google Antigravity Agent Configuration & Project Guidelines

This file configures **Google Antigravity (AGY)** and provides high-priority operational rules and context for AGY pairing sessions on BlinkShare.

---

## 1. Project Identity

- **Name**: BlinkShare
- **Tagline**: "Share it now. Gone in five."
- **Stack**: Cloudflare Workers (Free), Hono.js, D1 SQLite (Free), Workers KV (Free), React 18, Vite, Tailwind CSS, Lucide React, pnpm workspaces.
- **Cost**: 100% Free Forever (₹0 / $0). Zero billing or credit card required.
- **Repository**: `https://github.com/nived938/BlinkShare.git`

---

## 2. Hard Constraints for AGY

1. **Strict 5-Minute Invariant**:
   - The lifetime of every shared item (text, code, image) is strictly **300 seconds** (`EXPIRATION_SECONDS = 300`).
   - AGY agents must NEVER generate code, UI options, or plan tiers that claim or allow extending this expiration duration beyond 5 minutes.
2. **100% Free Tier Services Only (No R2, No Billing)**:
   - Cloudflare R2 and commercial billing (Stripe, Razorpay) are completely forbidden.
   - Image storage uses **Cloudflare Workers KV** (`IMAGE_STORE`).
   - Maximum image size is 5 MB, maximum text size is 100 KB.
   - All features (passwords, burn-after-read, custom alias, download restrictions) are 100% free for everyone.
3. **Physical Cleanup Guarantee**:
   - Expired items must be purged: D1 rows deleted, KV binary objects deleted.
   - Any access attempt past `now >= expires_at` must immediately return HTTP 410 Gone with content stripped.
4. **Auto-Schema Bootstrap**:
   - D1 tables auto-initialize via `ShareRepository.ensureSchema()` to prevent `SQLITE_ERROR: no such table: rate_limit_counters` or missing table errors.
5. **Shell Execution**:
   - Host platform is **Windows (PowerShell)**.
   - Do NOT chain commands with `&&` in PowerShell; use `;` or execute commands sequentially.

---

## 3. Standard Verification Commands

AGY should run these commands after making changes:

```powershell
# 1. Typecheck & build shared package
pnpm --filter @blinkshare/shared build

# 2. Run backend automated tests (15 tests verifying boundary expiration & KV cleanup)
pnpm test

# 3. Build web frontend
pnpm --filter @blinkshare/web build
```

---

## 4. Key Code Locations

- **KV Storage Service**: `apps/api/src/services/imageStorageService.ts`
- **Share Core Logic & Expiry**: `apps/api/src/services/shareService.ts`
- **Cron Physical Purge**: `apps/api/src/services/cleanupService.ts`
- **Frontend Dual-Tab Card**: `apps/web/src/components/ShareTextTab.tsx` & `ShareImageTab.tsx`
- **Free Limits & Quotas**: `packages/shared/src/plans.ts` & `apps/web/src/pages/PricingPage.tsx`
- **Database Schema**: `apps/api/migrations/0001_initial_schema.sql`

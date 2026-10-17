# AGY.md — Google Antigravity Agent Configuration & Project Guidelines

This file configures **Google Antigravity (AGY)** and provides high-priority operational rules and context for AGY pairing sessions on BlinkShare.

---

## 1. Project Identity

- **Name**: BlinkShare
- **Tagline**: "Share it now. Gone in five."
- **Stack**: Cloudflare Workers, Hono.js, D1 (SQLite), R2 (Object Storage), React 18, Vite, Tailwind CSS, Lucide React, pnpm workspaces.
- **Repository**: `https://github.com/nived938/BlinkShare.git`

---

## 2. Hard Constraints for AGY

1. **Strict 5-Minute Invariant**:
   - The lifetime of every shared item (text, code, image) is strictly **300 seconds** (`EXPIRATION_SECONDS = 300`).
   - AGY agents must NEVER generate code, UI options, or plan tiers that claim or allow extending this expiration duration beyond 5 minutes.
2. **Local Simulation First (Zero R2 Billing Barrier)**:
   - Always prioritize `IMAGE_STORAGE_MODE=local` so the developer can run and test everything on localhost without needing a credit card or Cloudflare R2 subscription.
   - Never suggest using permanent browser storage or storing raw image binary blobs in D1 as a workaround.
3. **Physical Cleanup Guarantee**:
   - Expired items must be purged: D1 rows deleted, R2 binary objects deleted.
   - Any access attempt past `now >= expires_at` must immediately return HTTP 410 Gone with content stripped.
4. **Shell Execution**:
   - Host platform is **Windows (PowerShell)**.
   - Do NOT chain commands with `&&` in PowerShell; use `;` or execute commands sequentially.
   - Never use interactive prompts or interactive CLI commands that hang background tasks.

---

## 3. Standard Verification Commands

AGY should run these commands after making changes:

```powershell
# 1. Typecheck & build shared package
pnpm --filter @blinkshare/shared build

# 2. Run backend automated tests (15+ tests verifying boundary expiration & cleanup)
pnpm test

# 3. Build web frontend
pnpm --filter @blinkshare/web build
```

---

## 4. Key Code Locations

- **Storage Abstraction**: `apps/api/src/services/imageStorageService.ts`
- **Share Core Logic & Expiry**: `apps/api/src/services/shareService.ts`
- **Background Physical Purge**: `apps/api/src/services/cleanupService.ts`
- **Frontend Dual-Tab Card**: `apps/web/src/components/ShareTextTab.tsx` & `ShareImageTab.tsx`
- **Shared Validation & Plans**: `packages/shared/src/plans.ts` & `validation.ts`
- **Database Schema**: `apps/api/migrations/0001_initial_schema.sql`

---

## 5. Deployment & R2 Activation Checklist

When transitioning from local simulation to production:
1. Enable R2 billing in the Cloudflare Dashboard.
2. Create bucket: `wrangler r2 bucket create blinkshare-images`.
3. In `apps/api/wrangler.toml`, set `IMAGE_STORAGE_MODE = "r2"`.
4. Deploy API Worker: `pnpm --filter @blinkshare/api deploy`.
5. Deploy Pages Frontend: `pnpm --filter @blinkshare/web build; wrangler pages deploy apps/web/dist --project-name=blinkshare-web`.

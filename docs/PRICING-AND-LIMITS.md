# Pricing, Quotas & Plans

All limits and plan configurations are maintained centrally in `packages/shared/src/plans.ts` and enforced strictly on the server.

---

## Plan Comparison

| Feature | Free | Plus | Pro |
|---|---:|---:|---:|
| Monthly Price (INR) | ₹0 | ₹99 | ₹249 |
| Monthly Price (USD) | $0 | $1.49 | $3.49 |
| Text share size | 100 KB | 500 KB | 1 MB |
| Maximum image size | 5 MB | 25 MB | 50 MB |
| Shares created per day | 10 | 100 | 500 |
| **Expiration Duration** | **5 minutes** | **5 minutes** | **5 minutes** |
| Local QR code generation | Yes | Yes | Yes |
| Syntax highlighting & Markdown | Yes | Yes | Yes |
| Password protection | No | Yes | Yes |
| Burn after first view | No | Yes | Yes |
| Restrict download button | No | Yes | Yes |
| Custom share alias | No | Optional | Yes |
| Detailed share analytics | No | Basic | Advanced |

---

## Quota Enforcement Details

1. **Client-side vs Server-side**:
   - The React UI displays remaining characters, bytes, and daily quotas for convenience.
   - The Cloudflare Worker API always recalculates byte sizes (`new TextEncoder().encode(text).length`) and checks D1 rate-limit counters before saving.
2. **Quota Resets**:
   - Daily quotas reset automatically at midnight UTC (`Math.floor(now / 86400) * 86400`).
   - Per-minute anti-spam limits reset every 60 seconds (`Math.floor(now / 60) * 60`).
3. **Billing Integration**:
   - Configurable via `BILLING_PROVIDER=none|stripe|razorpay`.
   - Webhook signatures are verified server-side.
   - If billing is not configured, the pricing page remains fully functional and explicitly indicates that live checkouts are disabled.

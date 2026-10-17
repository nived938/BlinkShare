# Expiration & Cleanup System

The core guarantee of BlinkShare is that once a share reaches its five-minute expiration timestamp, **nobody must be able to retrieve its content**, even if the physical cleanup task has not yet run.

---

## 1. Access Enforcement (Immediate Boundary)

- **Authority**: The server-side Unix timestamp (`getCurrentTimestamp()`), never the client browser's clock.
- **Rule**:
  ```text
  created_at = current server timestamp (in seconds)
  expires_at = created_at + 300 seconds (strictly 5 minutes)
  ```
- **Check on Every Request**:
  Before returning text content, preview metadata, or streaming an image:
  ```ts
  if (currentServerTime >= share.expires_at || share.is_deleted === 1) {
    // Immediately trigger lazy cleanup asynchronously
    purgeShareAsync(share.id);
    return HTTP 410 Gone ("This share has expired");
  }
  ```
- **CDN and Browser Non-Caching**:
  Every response containing private share content or image bytes is served with:
  ```http
  Cache-Control: private, no-store, max-age=0, must-revalidate
  CDN-Cache-Control: no-store
  Pragma: no-cache
  Expires: 0
  ```
  This prevents Cloudflare's edge cache or intermediate proxies from caching expired data.

---

## 2. Physical Deletion (Dual-Layer Cleanup)

Because Cloudflare's scheduled Cron Trigger runs asynchronously once every minute (`* * * * *`), physical removal operates on two complementary layers:

### Layer A: Lazy Cleanup on Access
Whenever an expired share is requested by any visitor, the Worker immediately triggers lazy background cleanup to purge the D1 text row or delete the R2 object without waiting for the next cron cycle.

### Layer B: Scheduled Cron Worker (Every 60 Seconds)
Configured in `wrangler.toml`:
```toml
[triggers]
crons = ["* * * * *"]
```
The scheduled handler:
1. Queries D1 for expired shares in bounded batches (50 records per run) to prevent Worker timeout:
   ```sql
   SELECT * FROM shares WHERE expires_at <= ? OR is_burned = 1 OR is_deleted = 1 LIMIT 50;
   ```
2. **Order of operations for images**: The Worker deletes the R2 object *before* deleting the database record:
   ```ts
   await env.IMAGES.delete(share.r2_object_key);
   await repo.purgeShare(share.id);
   ```
   If R2 deletion fails (e.g. temporary storage glitch), the share is enqueued in `cleanup_retries` with exponential backoff and the database record is **retained** until R2 succeeds, preventing orphaned storage objects.
3. For text, deletes the D1 row.
4. Cleans up abandoned or expired upload sessions and temporary R2 chunks.
5. Retries queued failures up to 5 attempts.
6. Cleans up old rate limit counters older than 48 hours.

---

## 3. Burn After First View

When enabled on supported plans:
- State transitions are executed atomically using prepared SQL:
  ```sql
  UPDATE shares 
  SET is_burned = 1, is_deleted = 1
  WHERE id = ? AND is_burned = 0 AND is_deleted = 0;
  ```
- If two requests hit the endpoint simultaneously, only the single request that updates 1 row is served. All other requests receive `HTTP 410 ("This share was already burned by another viewer")`.

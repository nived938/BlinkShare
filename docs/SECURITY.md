# Security Architecture & Protections

BlinkShare is engineered from the ground up with defensive security best practices across edge infrastructure, data storage, and client code.

---

## 1. Network & IP Privacy

- **No Raw IP Storage**: We never log raw visitor IP addresses in application logs or databases.
- **Keyed Hash Rate Limiting**: Client IPs are hashed using HMAC-SHA256 with a server secret salt:
  ```ts
  const ipHash = sha256Hex(`${secret}:${ip}`);
  ```
  This permits DDoS and spam prevention without tracking user locations or identities.

---

## 2. Password Protection

- Uses **PBKDF2** (Password-Based Key Derivation Function 2) with:
  - 16-byte cryptographically secure random salt (`crypto.getRandomValues`).
  - 50,000 iterations.
  - SHA-256 hash function.
  - Constant-time verification loop preventing timing attacks.

---

## 3. Cryptographically Unguessable Identifiers

- Share IDs are generated using `crypto.getRandomValues` from a 62-character alphanumeric keyspace (e.g. `7kF9x0Lm`), providing entropy that prevents enumeration or sequential URL scanning attacks.
- Anonymous creators receive a separate 48-hex-character secret **Deletion Token**. The server stores only the SHA-256 hash of this token.

---

## 4. XSS & Code Execution Prevention

- **Safe Markdown Rendering**: Rendered using `marked` and sanitized with `DOMPurify` before insertion into the DOM.
- **No Script Execution**: Code snippets (JavaScript, Python, Bash, etc.) are treated strictly as plain text or syntax-highlighted tokens. No runtime execution occurs on client or server.
- **Safe Image Delivery**: Images are strictly validated against safe raster MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`). Active SVGs are rejected to avoid embedded script execution.

---

## 5. Private Cloudflare R2 Storage

- R2 bucket public access is disabled.
- Images are retrieved and streamed exclusively through authenticated Worker endpoints after expiration checks.
- Temporary upload sessions expire within 10 minutes and are swept by the cleanup cron.

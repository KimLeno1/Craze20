# ☁️ Cloudflare CDN & Caching Configuration Guide for Closet Kraze (`closetkraze.top`)

This guide provides step-by-step instructions for configuring Cloudflare Free Tier to eliminate server timeouts and optimize performance for Closet Kraze.

---

## 1. Domain Registration & Proxying
1. Log into your Cloudflare Account and click **Add a Site**.
2. Enter `closetkraze.top` and select the **Free** plan.
3. Update your domain registrar's Name Servers (e.g. Namecheap, GoDaddy) to the assigned Cloudflare Name Servers (e.g. `dash.cloudflare.com`).
4. In **DNS Settings**, ensure your root (`@`) and `www` A/CNAME records have the **Orange Cloud (Proxied)** toggle enabled.

---

## 2. Cache Rules (Rules > Cache Rules)

Create the following rules in order of priority:

### Rule 1: Static Immutable Build Assets (`/assets/*`)
- **Expression**: `(http.request.uri.path starts_with "/assets/")`
- **Cache status**: Eligible for cache
- **Edge Cache TTL**: Override origin -> `1 year`
- **Browser Cache TTL**: Override origin -> `1 year`

### Rule 2: Uploaded Media & Product Images (`/uploads/*`)
- **Expression**: `(http.request.uri.path starts_with "/uploads/")`
- **Cache status**: Eligible for cache
- **Edge Cache TTL**: Override origin -> `1 day`
- **Browser Cache TTL**: Override origin -> `1 day`

### Rule 3: Brand Icons & Manifest
- **Expression**: `(http.request.uri.path in {"/logo.svg" "/manifest.json" "/favicon.ico"})`
- **Cache status**: Eligible for cache
- **Edge Cache TTL**: Override origin -> `7 days`
- **Browser Cache TTL**: Override origin -> `7 days`

### Rule 4: Dynamic API Bypass (`/api/*`)
- **Expression**: `(http.request.uri.path starts_with "/api/")`
- **Cache status**: Bypass cache

### Rule 5: SPA HTML Shell (`/`)
- **Expression**: `(http.request.uri.path eq "/") or (not http.request.uri.path contains ".")`
- **Cache status**: Bypass cache (ensures instant updates when app releases deploy)

---

## 3. Speed & Optimization Settings

Navigate to **Speed > Optimization**:

1. **Brotli Compression**: `Enabled`
2. **HTTP/3 (with QUIC)**: `Enabled` (under Network)
3. **Auto Minify**:
   - [x] JavaScript
   - [x] CSS
   - [x] HTML
4. **Early Hints**: `Enabled`
5. **TLS Mode**: `Full` (or `Flexible` if SSL is handled by passenger/nginx)

---

## 4. Verification

Run the following command to test edge caching headers:

```bash
# Check product image cache header
curl -I https://closetkraze.top/uploads/products/sample.webp
# Should return: cf-cache-status: HIT or MISS (HIT on 2nd request)

# Check API endpoint responsiveness
curl -I https://closetkraze.top/api/products?limit=24
# Should return: X-Cache: HIT (on 2nd request), content-encoding: br / gzip
```

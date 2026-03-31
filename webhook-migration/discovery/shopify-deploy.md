# Shopify Theme Deploy & Origins

**Date:** 2026-03-30

## Deploy Method: Git

Theme repo: `github.com/panrix/icorrect-shopify-theme.git`
Local path: `/home/ricky/builds/icorrect-shopify-theme/`
User confirmed: deploys via git.

## Storefront Origins

| Domain | Response | CORS needed |
|--------|----------|-------------|
| `https://icorrect.co.uk` | Serves Shopify storefront directly (Cloudflare → Shopify) | Yes |
| `https://www.icorrect.co.uk` | 301 redirect → `https://icorrect.co.uk` | Yes (browser may send from www before redirect) |

**Primary origin:** `https://icorrect.co.uk`
**Redirect origin:** `https://www.icorrect.co.uk` → 301 to apex

**CORS whitelist:** Both `https://icorrect.co.uk` and `https://www.icorrect.co.uk` must be allowed. The redirect happens at Shopify/Cloudflare level, but browser preflight may fire from www before the redirect completes.

**Shopify preview domains** (e.g. `*.myshopify.com`) are NOT needed for production CORS but may be needed for theme editor testing.

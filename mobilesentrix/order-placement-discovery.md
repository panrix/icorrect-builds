# Mobilesentrix UK API Discovery

**Date:** 2026-04-28
**Scope:** Read-only discovery for order automation. No cart mutation, no checkout, no payment.
**Note:** The signed-in cart already contained 2 items; nothing was modified.

---

## 1. Verdict

- **Tech stack:** Magento 1.x heavily customised by Mobilesentrix. Confirmed by Prototype.js v1.7, `Mage.Cookies`, FORM_KEY/ENCRYPT_FORM_KEY pattern, Magento URL routing, and the HttpOnly `frontend` session cookie. Cloudflare WAF in front; payment is Braintree (Gene_Braintree module) + PayPal. Stock Magento REST (`/rest/V1/...`) is **disabled** (404 on every variant).
- **Can we automate ordering?** **Yes — Partial.** All required endpoints exist and are reachable from a signed-in session with the right CSRF tokens. No public REST surface; we will be calling private internal AJAX endpoints. Auth is session-cookie + dynamic per-endpoint CSRF tokens scraped from page HTML — workable but rebuilds force re-scrape.

---

## 2. End-to-end order placement flow

All requests need `Cookie: frontend=...`, the CSRF triple (see Auth), and `X-Requested-With: XMLHttpRequest`. Bodies are `application/x-www-form-urlencoded`.

| # | Step | URL | Body essentials |
|---|------|-----|-----------------|
| 1 | Resolve product → id/qty | `GET /<category>/...` then parse `<input id="productmaxqty_<id>">` | (none, HTML scrape) |
| 2 | Add to cart | `GET /quickorder/index/add/uenc/<base64-current-url>/product/<id>/form_key/<KEY>/?isAjax=1&qty=<n>&productid=<id>&recall=false&lockship=false&productnotification=false&flagpreorder=false` | (in URL) |
| 3 | (Optional) PO ref | `POST /checkout/cart/savereferencenumber/` | `form_key&reference_number` |
| 4 | Open checkout (renders quoteId + encrpty tokens) | `GET /checkout/onepage/` | (HTML scrape) |
| 5 | Set ship/bill address | `POST /placeorder/address/setaddress/` | `form_key&shipping_id&billing_id&same_as` |
| 6 | Validate shipping | `POST /placeorder/shipping/validateshippingmethod/` | `form_key&shipping_method&parentOrder` |
| 7 | Save shipping | `POST /placeorder/shipping/setshippingmethod/` | serialized `#shipping-method-form` + `holdlocation&defaultlocation&reserveorders&dsd_cost` |
| 8 | Load payment options | `POST /placeorder/expresscheckout/loadpayment/` | `form_key=...` |
| 9 | **Place order** | `POST /placeorder/payment/savePayment/` | `form_key&is_express=0&count=0&payment[method]=<code>&payment[<field>]=<value>...` |

Step 9 returns `{page_reload: bool, error: string, redirect: <url>}`. Success → redirect to `/checkout/onepage/success/`.

---

## 3. Auth pattern

- **`frontend` cookie** (HttpOnly, Secure, 26 bytes) — Magento PHPSESSID. Obtain once via interactive login (out of scope), refresh when expired. Likely ~24h.
- **FORM_KEY + ENCRYPT_FORM_KEY**: rendered on every page as `var FORM_KEY = '<16-char>'; var ENCRYPT_FORM_KEY = '<base64>=='`. Scrape at session start.
- **`anti-csrf-token` header** = `<ENCRYPT_FORM_KEY>@<encrptyEndpointKey>`. Each endpoint has its own `encrpty<URLname>` token (e.g. `encrptysavePayment`). At least 23 are inline on `/checkout/onepage/`. Re-scrape that page whenever you need them.
- No bearer/OAuth/API key.

For a Python script: `requests.Session()` with the cookie, scrape `/checkout/onepage/` once for FORM_KEY + all encrpty tokens, build the `anti-csrf-token` header per call.

---

## 4. Stock + product lookup

No JSON product API. Scrape HTML:
- Stock: `<input id="productmaxqty_<id>" value="<n>"/>`
- Pre-order: button has class `btn-preorder` (stock=0 but buyable)
- SKU/price: rendered in template — parse per category page
- Search: `GET /catalogsearch/result/?q=<term>` (HTML)

Maintain a SKU → productId map (built once by scraping the categories iCorrect uses).

---

## 5. Order history / status

- `GET /sales/order/history/` → full HTML (~2.4 MB) with `<a href="/sales/order/view/order_id/<id>/">` per row.
- Same URL with `X-Requested-With: XMLHttpRequest` → `{status, outputHtml, headCSS, headJs}` JSON (~125 KB, still HTML inside).
- `GET /sales/order/view/order_id/<id>/` for detail.
- `POST /placeorder/shipping/trackOrder/` with `orderid&form_key` for tracking JSON.
- `GET /sales/order/reserveorders/` for B2B reserve-order list.

Order numbers look like `100000XXXX`; `order_id` in URLs is sequential numeric.

---

## 6. Risks / unknowns (flag for Ricky)

1. **Payment method codes not enumerated** — need a real read-only `loadpayment/` trigger from a non-empty quote. Likely codes: `braintree`, `paypal_express`, `banktransfer`, possibly an on-account/credit option. **Confirm with Ricky how iCorrect pays MS.**
2. **Exact `payment[...]` body shape per method.** Card payments need a Braintree client token + `tokenizeCard` call (3 extra hops); on-account/bank-transfer is just `payment[method]=xxx&form_key=...`.
3. **Cloudflare on raw Python.** Untested whether bare `requests` POSTs pass CF without browser fingerprint. May need `cloudscraper` or a headless-Chrome driver.
4. **`encrpty<X>` token derivation not reversed.** Tokens are AES-encrypted FORM_KEY + endpoint salt. **Don't try to reverse — just re-scrape `/checkout/onepage/`.**
5. **Cart already has live items** in the discovery session. Real automation must start with `POST /checkout/cart/deleteCartAllQtyAjax/` + `form_key`, or track its own item IDs.

---

## 7. Skill recommendation — `domain-skills/mobilesentrix/order-placement.md`

Document: Magento 1.x stack ID; how to obtain/refresh `frontend` cookie (one-off Playwright login); the `(FORM_KEY, ENCRYPT_FORM_KEY, encrpty\*-map)` scrape from `/checkout/onepage/` (with regex snippet); the 9-step order flow above with curl equivalents; cart/address/shipping endpoint inventory; Cloudflare considerations + the recommended `requests.Session` + Chrome-cookie pattern; hard rules ("never call savePayment/ without explicit Monday-card-sourced approval; always log response.redirect and store order number to Supabase before exit"); and the two unknowns to confirm on first live run (payment method codes + exact payment[*] body).

Raw endpoint inventory: `/tmp/mobilesentrix-api-inventory.json` (also `/Users/icorrect/Desktop/mobilesentrix-api-inventory.json`).

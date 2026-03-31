# Shopify Form Payload Schemas

**Date:** 2026-03-30
**Endpoint:** All 4 sources POST to `https://icorrect.app.n8n.cloud/webhook/shopify-contact-form`

---

## Source 1: Consumer Contact Form

**Files:** `contact-form.liquid`, `contact-with-map.liquid` (identical payloads)
**Form ID:** `#ContactForm`
**Interceptor:** `contact-form-interceptor.js` wraps in `{contact: {...}}`

```json
{
  "contact": {
    "name": "string (required, min 1 char)",
    "email": "string (required, validated email)",
    "phone": "string (required, min 8 digits)",
    "device_type": "string (required) — 'macbook' | 'iphone' | 'ipad' | 'watch'",
    "device_model": "string (required) — dynamic dropdown per device_type",
    "fault_area": "string (required) — 'Screen / Display' | 'Power / Battery / Charging' | 'Audio / Mic / Speaker' | 'Connectivity' | 'Water Damage' | 'Data Recovery' | 'Other'",
    "body": "string (required) — customer message"
  },
  "timestamp": "string (ISO 8601)",
  "source": "'shopify-website' (hardcoded by interceptor)",
  "page_url": "string (window.location.href)",
  "referrer": "string | null (document.referrer)"
}
```

**n8n routing:** `isQuoteEmail = false`, `isCorporate = false` → consumer path

---

## Source 2: Corporate Lead Form

**File:** `icorrect-landing.liquid` (lines 475-583)
**Form ID:** `#corporate-lead-form`
**Interceptor:** Same `contact-form-interceptor.js`

```json
{
  "contact": {
    "tags": "'corporate-lead' (hidden field, hardcoded)",
    "interested_devices": "string (comma-separated, JS-filled hidden input) | ''",
    "name": "string (required)",
    "email": "string (required)",
    "phone": "string (required)",
    "job_title": "string (required)",
    "company": "string (required)",
    "fleet_size": "string (required) — '1-10' | '11-50' | '51-100' | '100+'",
    "sla": "string (required) — '24h' | '48h' | '72h' | 'Standard'",
    "body": "string (optional) — notes/requirements"
  },
  "timestamp": "string (ISO 8601)",
  "source": "'shopify-website'",
  "page_url": "string",
  "referrer": "string | null"
}
```

**n8n routing:** `company` field present → corporate path. `tags = 'corporate-lead'` used for Intercom tagging.

---

## Source 3: Quote Wizard — Inline Contact Form

**File:** `quote-wizard.liquid` (lines 2047-2083)
**Form ID:** Dynamic (`qwCFA*` prefix)
**Sends via:** `postQuoteWizardWebhook()` at line 1981

```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, validated)",
  "phone": "string (required, min 8 digits)",
  "body": "string (optional) — constructed as 'Fault: {fault}\nIssue: {issue}\n\nMessage:\n{msg}'",
  "device_type": "string — 'MacBook' | 'iPhone' | 'iPad' | 'Apple Watch' (display names)",
  "device_model": "string | ''",
  "fault_area": "string | ''"
}
```

**Note:** Flat payload, NO `contact` wrapper. NO `timestamp`, `source`, `page_url`, or `referrer` fields.

**n8n routing:** No `source` field, no `company` → consumer path (same as Source 1 but flat).

---

## Source 4: Quote Wizard — Email Quote

**File:** `quote-wizard.liquid` (lines 2232-2256)
**Sends via:** `postQuoteWizardWebhook()` at line 2266

```json
{
  "source": "'quote-wizard-email-quote' (hardcoded)",
  "name": "string (required)",
  "email": "string (required)",
  "deviceType": "string — 'MacBook' | 'iPhone' | 'iPad' | 'Apple Watch'",
  "deviceModel": "string | ''",
  "faultArea": "string | ''",
  "issue": "string | ''",
  "repairTitle": "string — product title",
  "route": "string — 'repair' or custom",
  "basePrice": "number (float, GBP)",
  "expressName": "string | null",
  "expressMeta": "string | null",
  "expressPrice": "number (float, 0 if not selected)",
  "serviceName": "string — e.g. 'Walk-in' or 'Courier'",
  "servicePrice": "number (float)",
  "totalPrice": "string — formatted GBP (e.g. '£450.00')",
  "estimates": "string (JSON.stringify'd [{label, value}]) | null",
  "warranty": "string — default '2-year warranty'",
  "parts": "'Genuine Apple parts' (hardcoded)",
  "productUrl": "string | null — full Shopify URL",
  "deviceColor": "string | null — from color grid",
  "url": "string (window.location.href)",
  "timestamp": "string (ISO 8601)"
}
```

**Note:** Flat payload. Uses camelCase (`deviceType`) not snake_case (`device_type`). Contains pricing data not present in other sources.

**n8n routing:** `source === 'quote-wizard-email-quote'` → isQuoteEmail path → sends email to customer + notification to Intercom.

---

## Response Contract (Per Client)

| Source | Handler | Success | Error |
|--------|---------|---------|-------|
| Consumer form (interceptor) | Checks `response.ok`, then JSON `success:true` if JSON, else any 2xx = success | JSON `{error: "message"}` shown to user. Fallback to email link. |
| Corporate form (interceptor) | Same as consumer | Same as consumer |
| Quote wizard inline form | Any 2xx = success. JSON `success===false` = error | `error.message` shown in phone error field |
| Quote wizard email quote | Any 2xx = success. JSON `success===false` = error | Generic "Something went wrong" (line 2271), NOT server error text |

**Critical differences:**
- Interceptor (Sources 1, 2): expects JSON content-type for `success:true` check; non-JSON 2xx also accepted
- Quote wizard (Sources 3, 4): does NOT check `success:true`, only checks `success !== false`
- Quote wizard email quote: collapses server error text to generic message

---

## Field Name Collisions

| Field | Source 1/2 | Source 3 | Source 4 |
|-------|-----------|----------|----------|
| device_type | `contact.device_type` | `device_type` (flat) | `deviceType` (camelCase!) |
| device_model | `contact.device_model` | `device_model` (flat) | `deviceModel` (camelCase!) |
| fault_area | `contact.fault_area` | `fault_area` (flat) | `faultArea` (camelCase!) |

The VPS service must handle all three naming conventions.

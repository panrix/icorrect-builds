# Plan: Monday Webhook Migration + Shopify Contact Form Fix

**Date:** 2026-03-30
**Author:** Claude Code (with QA review by Codex)
**Status:** Historical combined draft. Do not execute from this file.

## Split Status (as of 2026-03-31)

- **Monday status-notification track:** use `plan-status-notifications.md`. Shadow service is implemented and running; live Intercom sending is still gated.
- **Shopify / Intercom attribution track:** use `plan-shopify-contact-form.md` plus `execution-checklist-shopify-contact-form.md`. This track is still gated and not implemented.
- This combined plan remains useful as discovery history only. The two tracks should now be treated as separate projects.

## Context

Two Monday.com automations (537444955 and 530471762) fire on **every column change**, burning ~4,000+ automation actions/day. Both are active with unknown destinations (Monday API does not expose webhook URLs). The automation audit says 537444955 should be parts-only and 530471762 should be status-only for Intercom notifications.

The notification system works via: Monday API webhooks → Cloudflare Worker → n8n Cloud → Intercom. This works but routes through 3 external services when the VPS already hosts 6 similar webhook services.

The Shopify Contact Form + Quote Wizard → Intercom flow is broken: sends SMTP emails FROM `michael.f@icorrect.co.uk`, making Intercom attribute conversations to michael.f instead of the customer.

**Outcome:** Migrate notification system to VPS, fix contact form/quote wizard sender problem, kill token-burning automations.

---

## Phase 0 — Discovery (COMPLETED 2026-03-30)

All discovery artefacts saved to `builds/webhook-migration/discovery/`.

### 0a. Monday webhooks ✅
Full webhook map in `discovery/monday-webhooks.md`. 31 webhooks on board 349212843.
- **537444955** and **530471762**: ACTIVE, `change_column_value` with empty config `{}`. Fire on every column change. Destinations unknown (Monday API does not expose webhook URLs). **Must check Monday UI before disabling.**
- Status notifications use properly-filtered webhooks (264095774, 337386341) that target `status4` specifically. Disabling the catch-all webhooks will NOT break notifications.

### 0b. Intercom write endpoints ✅
All 5 write endpoints proven live. Transcripts in `discovery/intercom-api-proof.md`.
- `POST /contacts/search` — works
- `POST /conversations` with `from: {type: "user", id: contactId}` — **WORKS.** Customer is the author. This is the michael.f fix.
- `POST /companies` — works
- `POST /contacts/{id}/companies` — works
- `POST /tickets` with `ticket_type_id: 2985889` — works

**Decision:** Consumer + quote paths use **conversations** (customer-initiated). Corporate path uses **tickets** (structured, tracked). Contact role: `"user"` (matches n8n).

### 0c. n8n workflow exports ✅
3 workflows exported to `discovery/n8n-exports/`:
- `status-notifications.json` (56KB) — workflow `TDBSUDxpcW8e56y4`
- `shopify-contact-form.json` (78KB) — workflow `tNQphRiUo0L8SdBn`
- `consumer-contact-swap.json` (15KB) — workflow `e1puojhc35tFJML5` (VERIFIED REAL — not a guessed ID)

### 0d. Shopify deploy ✅
Deploys via **git** — repo at `github.com/panrix/icorrect-shopify-theme.git`. Details in `discovery/shopify-deploy.md`.

### 0e. Storefront origins ✅
- Primary: `https://icorrect.co.uk` (serves Shopify via Cloudflare)
- `https://www.icorrect.co.uk` → 301 redirect to apex
- CORS must whitelist both origins

### 0f. Shopify payload schemas ✅
4 source schemas documented in `discovery/shopify-payload-schemas.md`:
1. Consumer form (`#ContactForm`) — 7 fields in `{contact: {...}}` wrapper
2. Corporate lead (`#corporate-lead-form`) — 10 fields in `{contact: {...}}` wrapper, includes `tags`, `fleet_size`, `sla`
3. Quote wizard inline form — 7 fields FLAT (no wrapper), snake_case
4. Quote wizard email quote — 21 fields FLAT, camelCase, includes pricing data

---

## Conventions

**Env source:** `/home/ricky/config/.env` via systemd `EnvironmentFile=`
**Intercom token:** `process.env.INTERCOM_API_TOKEN` only (`INTERCOM_ACCESS_TOKEN` is not set — no fallback needed, proven in Phase 0b)
**Express routes:** Mount on **full external path** (e.g., `app.post("/webhook/monday/status-notification", ...)` — matches bm-shipping pattern)
**Nginx:** Every webhook location must include `auth_basic off;` (server block has global basic auth)
**CORS:** Handled in Express only (not nginx) — single layer, no duplication. Whitelist both `https://icorrect.co.uk` and `https://www.icorrect.co.uk`.
**Failure alerting:** Every async handler sends Slack/Telegram alert on Intercom API failure (not just silent logging).

---

## Phase 1 — Status Notification Service (port 8014) — SHADOW MODE

**Replaces:** Cloudflare Worker `icorrect-status-router` + n8n workflow `TDBSUDxpcW8e56y4`

### Build

**Directory:** `/home/ricky/builds/monday/services/status-notifications/`

**Files:**
| File | Purpose | ~Lines |
|------|---------|--------|
| `index.js` | Express server: webhook handler, Monday fetch, routing, Intercom calls | ~320 |
| `templates.js` | 14 email template functions | ~180 |
| `package.json` | Express dependency | — |
| `reference/n8n-status-notifications.json` | Exported n8n workflow (ground truth) | — |

**`index.js` route: `POST /webhook/monday/status-notification`**

1. Monday challenge: if `body.challenge`, return it immediately
2. Respond 200 immediately, then process async (matching bm-shipping pattern)
3. Filter: only process `event.columnId === "status4"` — log + skip others
4. Fetch full item from Monday GraphQL API (port `fetchItemData()` from worker code)
5. Extract: service (`service`), client type (`status`), passcode (`text8`)
6. `determineWebhookType()` — 14-scenario switch (port from worker lines 295-336)
7. If no webhook type → log, stop
8. **Intercom ID gate:** If `text_mm087h9p` is empty → log warning, stop
9. `GET /conversations/{intercomId}` → extract `contacts.contacts[0].id`
10. `GET /contacts/{contactId}` → extract first name (`name.split(' ')[0]`), fallback to Monday item name
11. Select + interpolate template from `templates.js`
12. **SHADOW_MODE:** If env `SHADOW_MODE=true` → log rendered template + all context, do NOT send reply. If false → `POST /conversations/{intercomId}/reply`:
    ```json
    {"message_type": "comment", "type": "admin", "admin_id": "9702337", "body": "<html>"}
    ```
13. **On Intercom failure:** Log error + send Slack alert to `#bm-trade-in-checks` (or ops channel)
14. `GET /health` — health check

**Gophr Time Window:** Keep in templates, use real column ID `text_mm084vbh` (Gophr automations being built this week).

**Date formatting:** Port the exact JS from n8n Extract Data node (UTC → Europe/London conversion, ordinal suffixes). Code is in the exported workflow JSON.

**Contact name merge:** Port from n8n Merge Contact Name node: `contact.name.split(' ')[0]` with fallback to `contact.first_name`, then `itemName`.

**Source of truth for porting:**

| Component | Primary source | Backup |
|-----------|---------------|--------|
| 14-scenario routing | Worker code (notification-docs:295-336) | n8n Switch node (verified match) |
| Email templates | notification-docs:579-780 | n8n template nodes |
| Date formatting | n8n Extract Data node JS (exported JSON) | — |
| Contact name merge | n8n Merge Contact Name node JS (exported JSON) | — |
| Intercom reply payload | n8n Send Intercom Reply node (exported JSON) | — |
| Column IDs | notification-docs:122-136 + `text_mm084vbh` for Gophr Time Window | — |

### Deploy

1. `npm install`
2. systemd: `~/.config/systemd/user/status-notifications.service` (copy bm-shipping.service)
3. `systemctl --user enable --now status-notifications`
4. Nginx in `/etc/nginx/sites-enabled/mission-control`:
   ```nginx
   location /webhook/monday/status-notification {
       auth_basic off;
       proxy_pass http://127.0.0.1:8014;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
5. `sudo nginx -t && sudo systemctl reload nginx`

### Verify (Shadow Mode)

- [ ] Health check: `curl http://127.0.0.1:8014/health` → 200
- [ ] Challenge: POST `{"challenge":"test"}` → `{"challenge":"test"}`
- [ ] Non-status4 events logged and skipped (no Intercom call)
- [ ] Register Monday API webhook (free) pointing to VPS
- [ ] Change status4 on test item → service logs rendered template WITHOUT sending
- [ ] Compare shadow output against n8n execution log for same event
- [ ] Test all 14 scenarios + missing-intercomId case + booking-date formatting
- [ ] Failure alerting: simulate Intercom 500 → Slack alert fires

---

## Phase 2 — Cutover Status Notifications

**No parallel live sending.** Old path disabled before new path goes live.

### Step 1: Verify parity
Shadow mode output matches n8n output for all 14 scenarios tested in Phase 1.

### Step 2: Disable old sender
Deactivate n8n workflow `TDBSUDxpcW8e56y4` (Status Notifications → Intercom Email).
**Rollback:** Re-enable the n8n workflow. Takes 30 seconds in n8n UI.

### Step 3: Enable live sending
Set `SHADOW_MODE=false`, restart service.

### Step 4: Verify live
- [ ] Status4 change on real item → Intercom reply appears
- [ ] No duplicate emails
- [ ] Monitor 48 hours

### Step 5: Disable broken automations (only after destination proof from Phase 0a)
- If 537444955 confirmed dead → disable
- If 530471762 confirmed dead → disable
- If either points to a live service → investigate further, do NOT disable
- [ ] Automation token usage drops

---

## Phase 3 — Shopify Contact Form + Quote Wizard Handler (port 8015)

**Replaces:** n8n workflows `tNQphRiUo0L8SdBn` (Shopify Contact Form) + `e1puojhc35tFJML5` (Consumer Contact Swap)

### Build

**Directory:** `/home/ricky/builds/shopify/services/contact-form/`

**Files:**
| File | Purpose | ~Lines |
|------|---------|--------|
| `index.js` | Express server: receive forms, create Intercom contacts + conversations | ~300 |
| `package.json` | Express dependency | — |
| `reference/n8n-shopify-contact-form.json` | Exported n8n workflow (ground truth) | — |

**Route: `POST /webhook/shopify/contact-form`**

This single endpoint receives traffic from 3 sources:
1. `#ContactForm` (consumer contact form via interceptor)
2. `#corporate-lead-form` (corporate form via interceptor)
3. Quote wizard (direct fetch from `quote-wizard.liquid:1981`)

**CORS (Express-only, not nginx):**
```js
const ALLOWED_ORIGINS = ['https://icorrect.co.uk', 'https://www.icorrect.co.uk'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
```

**Request parsing (port from n8n Parse Form Data node):**
- Accept `body.contact.fieldname`, `body.fieldname`, and `body["contact[fieldname]"]` formats
- Phone normalization: `0xxx` → `+44xxx` (port exact regex from n8n node)
- Determine path: `body.source === "quote-wizard-email-quote"` → quote path, `body.company` or `body.contact.company` → corporate path, else → consumer path

**Three paths:**

**Path A: Consumer enquiry**
1. Search Intercom contact by email: `POST /contacts/search`
2. Create if not found: `POST /contacts` with `role: "user"` — handle duplicate via error regex `id=([a-f0-9]+)` (matches n8n Extract Consumer Contact ID node)
3. Create conversation: `POST /conversations` with `from: {type: "user", id: contactId}` (PROVEN in Phase 0b — customer is the author)
4. Return `{success: true}`

**Path B: Corporate enquiry**
1. Search/create contact (same as Path A)
2. Create/update Intercom company: `POST /companies`
3. Attach to contact: `POST /contacts/{id}/companies`
4. Create Intercom ticket: `POST /tickets` with `ticket_type_id: 2985889`, contact linked, HTML description
5. Slack notification
6. Return `{success: true}`

**Path C: Quote email** (source: `quote-wizard-email-quote`)
1. Search/create contact (same as Path A)
2. Create conversation/ticket with formatted quote details (device, repair, pricing breakdown)
3. Return `{success: true}`

**Quote wizard payload shape** (different from contact form):
```json
{
  "source": "quote-wizard-email-quote",
  "name": "...", "email": "...",
  "deviceType": "MacBook", "deviceModel": "MacBook Pro 14\"",
  "faultArea": "Screen", "issue": "Cracked display",
  "repairTitle": "MacBook Pro Screen Replacement",
  "route": "repair",
  "basePrice": 299, "expressPrice": 49, "servicePrice": 0,
  "totalPrice": "£348.00",
  "productUrl": "https://www.icorrect.co.uk/products/...",
  "deviceColor": "Space Grey"
}
```

**Quote wizard inline form payload** (contact enquiry from wizard):
```json
{
  "name": "...", "email": "...", "phone": "...",
  "body": "Fault: Screen\nIssue: Cracked\n\nMessage: ...",
  "device_type": "MacBook", "device_model": "MacBook Pro 14\"",
  "fault_area": "Screen"
}
```

**On failure:** Slack alert + log. Return `{success: false, error: "message"}` so interceptor/wizard shows user-facing error.

**Browser contract:**
- Respond within 30 seconds (interceptor + wizard both have 30s timeout)
- 2xx = success for both interceptor and wizard
- JSON `{error: "message"}` on 4xx/5xx shown to user
- CORS headers on every response (OPTIONS and POST)

### Deploy

1. systemd: `~/.config/systemd/user/shopify-contact-form.service`
2. Nginx:
   ```nginx
   location /webhook/shopify/contact-form {
       auth_basic off;
       proxy_pass http://127.0.0.1:8015;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
3. `sudo nginx -t && sudo systemctl reload nginx`

### Verify

- [ ] Health: `curl http://127.0.0.1:8015/health` → 200
- [ ] OPTIONS returns CORS headers for both origins
- [ ] Consumer POST → contact found/created, conversation created, customer is author (NOT michael.f)
- [ ] Corporate POST → ticket created, company attached
- [ ] Quote email POST → conversation/ticket with pricing details
- [ ] Quote wizard inline form POST → conversation with device context
- [ ] Existing customer → found, not duplicated
- [ ] New customer → created, attributed correctly
- [ ] Responds within 30 seconds
- [ ] Error body on validation failure

---

## Phase 4 — Update Shopify Theme + Cutover

**Prerequisite:** Shopify deploy method confirmed in Phase 0d.

### Files to modify

| File | Change |
|------|--------|
| `builds/icorrect-shopify-theme/assets/contact-form-interceptor.js` line 23 | `webhookUrl` → `https://mc.icorrect.co.uk/webhook/shopify/contact-form` |
| `builds/icorrect-shopify-theme/sections/quote-wizard.liquid` line 1981 | fetch URL → `https://mc.icorrect.co.uk/webhook/shopify/contact-form` |

Deploy both changes to Shopify in a single theme push.

### Verify

- [ ] Submit test contact form on icorrect.co.uk → conversation shows customer (not michael.f)
- [ ] Submit test corporate form → ticket created with company
- [ ] Use quote wizard "Email me a quote" → conversation/ticket with quote details
- [ ] Use quote wizard inline contact form → conversation with device context
- [ ] Success messages displayed correctly
- [ ] n8n workflows `tNQphRiUo0L8SdBn` and `e1puojhc35tFJML5` show no new executions

---

## Phase 5 — Cleanup (after 1 week stable)

1. **Disable** n8n Cloud workflows (do NOT delete):
   - `TDBSUDxpcW8e56y4` (already disabled in Phase 2)
   - `tNQphRiUo0L8SdBn` (Shopify Contact Form)
   - `e1puojhc35tFJML5` (Consumer Contact Swap)
2. **Cloudflare Worker:** Its `create_item` handler forwards to n8n workflow `qFL8bw5M3dO7dudw` which is **already inactive**. No regression from deactivating. Deactivate when convenient.
3. **Stop** local Docker n8n (204MB RAM, zero active workflows): `docker stop n8n`
4. **Evaluate** remaining n8n Cloud workflows for future migration

---

## Files Modified/Created

| Action | File |
|--------|------|
| CREATE | `/home/ricky/builds/monday/services/status-notifications/index.js` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/templates.js` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/package.json` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/reference/n8n-status-notifications.json` |
| CREATE | `/home/ricky/builds/shopify/services/contact-form/index.js` |
| CREATE | `/home/ricky/builds/shopify/services/contact-form/package.json` |
| CREATE | `/home/ricky/builds/shopify/services/contact-form/reference/n8n-shopify-contact-form.json` |
| CREATE | `~/.config/systemd/user/status-notifications.service` |
| CREATE | `~/.config/systemd/user/shopify-contact-form.service` |
| EDIT | `/etc/nginx/sites-enabled/mission-control` (add 2 location blocks with `auth_basic off;`) |
| EDIT | `builds/icorrect-shopify-theme/assets/contact-form-interceptor.js` (line 23) |
| EDIT | `builds/icorrect-shopify-theme/sections/quote-wizard.liquid` (line 1981) |

## Existing Code to Reuse

| What | Source | Status |
|------|--------|--------|
| 14-scenario routing switch | Worker code (notification-docs:295-336) | Verified against n8n |
| 14 email templates | notification-docs:579-780 | Verified against n8n |
| Date formatting (UTC→London) | n8n Extract Data node (`discovery/n8n-exports/status-notifications.json`) | Exported |
| Contact name merge + fallback | n8n Merge Contact Name node (`discovery/n8n-exports/status-notifications.json`) | Exported |
| Intercom reply payload | n8n Send Intercom Reply node: `{message_type, type, admin_id, body}` | Verified from JSON |
| Column IDs | notification-docs:122-136, Gophr TW: `text_mm084vbh` | Verified |
| Express + systemd pattern | `bm-shipping/index.js` + `bm-shipping.service` | Proven |
| Intercom contact search/create | `telephone-inbound/server.py:460-528` | Proven |
| Phone normalization | n8n Parse Form Data node (`discovery/n8n-exports/shopify-contact-form.json`) | Exported |
| Contact duplicate handling | n8n Extract Consumer Contact ID: error regex `id=([a-f0-9]+)` | Verified from JSON |
| Quote wizard payload shape | `quote-wizard.liquid:2232-2256` | Read and documented |
| Inline form payload shape | `quote-wizard.liquid:2065-2073` | Read and documented |

## Compromises

- **No retry queue** — failures after 200 ACK are logged + alerted via Slack, but not retried. Monday won't retry. Acceptable for v1; add Supabase-backed retry if failure rate is meaningful.
- **Templates hardcoded in JS** — matches current approach (n8n templates also hardcoded).
- **create_item not reimplemented** — Cloudflare Worker's create_item → n8n path is already dead (workflow `qFL8bw5M3dO7dudw` inactive). No regression.
- **n8n workflow JSON not version-controlled** — exported to `discovery/n8n-exports/` as build artefacts (2026-03-30 snapshots).

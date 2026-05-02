# Plan: Fix Shopify Forms → Intercom Attribution

**Date:** 2026-03-30 (updated with Ferrari's feedback)
**Author:** Claude Code
**Status:** Execution gated. Do not start implementation until Phase 0 spikes + contract freeze are complete.
**For review by:** Michael Ferrari

**Latest research update:** `research-shopify-intercom-phase0-2026-04-01.md`

---

## The Problem

When a customer submits any form on icorrect.co.uk (contact form, quote wizard, warranty claim, corporate enquiry), the enquiry arrives in Intercom attributed to **michael.f@icorrect.co.uk** instead of the customer.

This happens because the n8n workflows send SMTP emails FROM michael.f@icorrect.co.uk TO support@icorrect.co.uk, and Intercom attributes the conversation to michael.f's contact. A "Contact Swap" workflow tries to fix this by parsing the email body and swapping the contact, but it fails for new customers who don't already exist in Intercom.

**Impact:** Enquiries from new customers are permanently attributed to michael.f. Ferrari has to manually identify and re-attribute these. Some may be missed entirely.

---

## The Fix

Replace the SMTP/contact-swap hacks with a VPS service that creates/links the correct Intercom customer from the start.

**Frozen v1 product decisions:**
- Consumer contact form → create Intercom **ticket** attributed to the customer
- Corporate enquiry → create Intercom **ticket** attributed to the customer, attach company, preserve Slack notification
- Quote wizard inline question → create Intercom **ticket** attributed to the customer
- Quote wizard email quote → **preserve outbound customer quote email** and also create internal Intercom ticket/notification
- Warranty claim → create Intercom **ticket** attributed to the customer

**Important:** The target state above is the implementation target. It is **not yet proven** across all production cases. Phase 0 exists to prove the risky assumptions before build starts.

**Phase 0 update as of 2026-04-01**
- consumer and warranty are still confirmed on SMTP-authored ingress through `michael.f@icorrect.co.uk`
- quote email is still confirmed on SMTP for both customer email and internal Intercom notification
- corporate has stronger live evidence of direct ticket-plus-company handling than the older narrative suggested
- the live customer ticket type is now proven simpler than expected: only `_default_title_` and `_default_description_` remain active

**Current flow (broken):**
```
Shopify form → n8n → SMTP email FROM michael.f → Intercom → wrong attribution
                                                          → Contact Swap tries to fix
                                                          → fails for new customers
```

**New flow (correct):**
```
Shopify form → VPS service → search/create Intercom contact
                           → create Intercom TICKET linked to customer
                           → correct attribution from the start
```

We have partial proof only: the Intercom Tickets API works, contact/company writes work, and the current payload shapes are documented. We do **not** yet have enough proof to skip spike work for new contacts, company attach behavior, quote-email, and warranty.

---

## All 4 Forms In Scope

Ferrari confirmed 3 forms exist. We found 4 submission paths total:

| # | Form | Current n8n Workflow | Current Endpoint | Has michael.f Problem |
|---|------|---------------------|------------------|-----------------------|
| 1 | Quote Wizard (email quote + inline question) | Shopify Contact Form (`tNQphRiUo0L8SdBn`) | `/webhook/shopify-contact-form` | Yes |
| 2 | Corporate Enquiry | Shopify Contact Form (`tNQphRiUo0L8SdBn`) | `/webhook/shopify-contact-form` | No (uses Tickets API correctly) |
| 3 | Warranty Claim | Warranty Claim Form (`LjNBWaDz9f5Rj8g5`) | `/webhook/warranty-claim` | Yes (same SMTP hack + 45s wait + swap) |
| 4 | Consumer Contact Form | Shopify Contact Form (`tNQphRiUo0L8SdBn`) | `/webhook/shopify-contact-form` | Yes |

**Note:** The corporate path is the closest existing pattern, but it is not safe to copy blindly. The current n8n path returns success before company/ticket/Slack completion, so the new VPS implementation must define failure behavior explicitly.

---

## Ferrari's Decisions (Confirmed 2026-03-30)

| Decision | Answer |
|----------|--------|
| Use Tickets or Conversations? | **Tickets** — Ferrari needs ticket states to track awaiting reply vs resolved |
| Slack notification on corporate? | **Yes, preserve** — sends to `#corporate-onboarding` channel |
| Test email for verification? | **admin@icorrect.co.uk** — avoids confusion with michael.f |
| Warranty claim form? | **In scope** — same michael.f problem, separate n8n workflow |

---

## Execution Gate

This plan becomes build-ready only after the following are complete and written back into the document:

1. **Intercom spike:** prove ticket creation for:
   - new contact
   - existing contact
   - corporate contact + company attach
2. **Quote-email contract frozen:** v1 preserves outbound customer quote email and current UI copy
3. **Theme deploy source of truth confirmed:** exact production branch/theme target recorded
4. **Contracts frozen:** request fixtures, response contracts, validation rules, and ticket templates recorded

If a Phase 0 spike fails or becomes ambiguous, cut scope in this order:

1. Warranty claim
2. Quote-email internal ticket changes

Do **not** cut consumer or corporate attribution fixes first.

Current recommendation after the 2026-04-01 research pass:

- keep Phase 1 as consumer + corporate only
- keep quote inline, quote email, and warranty outside the first live cutover batch
- treat Shopify theme ID `158358438141` (`icorrect-shopify-theme/main`) as the production cutover target until contrary evidence appears
- replace the invalid build path with a stable service home, preferably `/home/ricky/builds/intercom/services/shopify-contact-form/`

---

## What Changes

### For Ferrari / Customer Service
- All enquiries in Intercom will show the **real customer name and email** — not michael.f
- All enquiries use **Tickets** with ticket states (waiting, resolved, etc.)
- Corporate enquiries continue sending Slack notifications to `#corporate-onboarding`
- The "Consumer Contact Swap" workflow becomes unnecessary
- No change to how Ferrari responds to customers in Intercom

### For the website
- Consumer/corporate/warranty/quote-inline keep the same visible success/error behavior
- Quote wizard email quote continues sending a customer email; the "Sent! Check your inbox." behavior is preserved in v1
- Theme cutover happens in stages, not as one all-or-nothing push
- The main visible change is where the form data is sent (VPS instead of n8n Cloud)

---

## What Gets Built

A new VPS service on port 8015 with three public routes:

| Route | Purpose |
|------|---------|
| `GET /health` | Health check for systemd/nginx/ops |
| `POST /webhook/shopify/contact-form` | Consumer, corporate, quote-inline, quote-email |
| `POST /webhook/shopify/warranty-claim` | Warranty claim only |

### Normalized Submission Types

The service has **4 form entrypoints** but **5 normalized submission types**:

| Source | What happens |
|--------|-------------|
| Consumer contact form | Search/create Intercom contact → create ticket from customer |
| Corporate enquiry | Search/create contact + company → create ticket → Slack notification to `#corporate-onboarding` |
| Quote wizard (email quote) | Preserve outbound customer quote email → create internal Intercom ticket/notification |
| Quote wizard (inline question) | Search/create contact → create ticket with device context |
| Warranty claim | Search/create contact → create ticket with warranty details (device, repair date, issue) |

### Request Contract

The server must normalize wrapped, flat snake_case, and flat camelCase payloads into one internal shape before routing.

```json
{
  "sourceType": "consumer | corporate | quote_inline | quote_email | warranty",
  "name": "string",
  "email": "string (lowercased)",
  "phone": "string | null (normalized to E.164-ish +44 format where possible)",
  "message": "string | null",
  "deviceType": "string | null",
  "deviceModel": "string | null",
  "faultArea": "string | null",
  "company": "string | null",
  "jobTitle": "string | null",
  "fleetSize": "string | null",
  "sla": "string | null",
  "interestedDevices": "string | null",
  "repairDate": "string | null",
  "pricing": {
    "repairTitle": "string | null",
    "route": "string | null",
    "basePrice": "number | null",
    "expressName": "string | null",
    "expressMeta": "string | null",
    "expressPrice": "number | null",
    "serviceName": "string | null",
    "servicePrice": "number | null",
    "totalPrice": "string | null",
    "estimates": "array | null",
    "warranty": "string | null",
    "parts": "string | null",
    "productUrl": "string | null",
    "deviceColor": "string | null"
  },
  "pageUrl": "string | null",
  "referrer": "string | null",
  "raw": "original request body"
}
```

### Validation Rules

| Submission type | Required fields | Notes |
|----------------|-----------------|-------|
| Consumer | `name`, `email`, `phone`, `deviceType`, `deviceModel`, `faultArea`, `message` | Mirrors current contact form |
| Corporate | `name`, `email`, `phone`, `company`, `jobTitle`, `fleetSize`, `sla` | `message` optional |
| Quote inline | `name`, `email`, `phone` | `message` and device context may be partially empty; preserve wizard behavior |
| Quote email | `name`, `email` | Preserve current no-phone requirement |
| Warranty | `name`, `email`, `phone`, `deviceType`, `message` | `repairDate`, `deviceModel` optional |

Validation failures return `400` JSON. Do **not** silently coerce missing required fields into success.

### Response Contract

All POST routes must always return JSON with `Content-Type: application/json`.

**Success**
```json
{
  "success": true,
  "message": "human-readable success message"
}
```

**Validation failure**
```json
{
  "success": false,
  "error": "human-readable validation message"
}
```

**Dependency/runtime failure**
```json
{
  "success": false,
  "error": "We couldn't process your request. Please try again or contact us directly at support@icorrect.co.uk"
}
```

### Browser / CORS Contract

- Allowed origins: `https://icorrect.co.uk`, `https://www.icorrect.co.uk`
- `OPTIONS` returns `204` with:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Accept`
- All POST responses must include the same CORS headers
- No Shopify-specific challenge handler is required for these routes

### Output Contract

| Submission type | Intercom output | Other output |
|----------------|-----------------|-------------|
| Consumer | Ticket linked to customer contact | None |
| Corporate | Ticket linked to customer contact + company attached | Slack post to `#corporate-onboarding` |
| Quote inline | Ticket linked to customer contact | None |
| Quote email | Internal ticket/notification with quote details | Outbound customer quote email preserved |
| Warranty | Ticket linked to customer contact | None |

### Duplicate / Retry Policy

v1 must suppress obvious browser/user retries:

- Build a submission fingerprint from normalized `sourceType` + core fields + message/quote content
- Keep a 10-minute in-memory dedupe cache
- If an identical submission is seen inside the window:
  - do **not** create a second ticket/email
  - return the same `200 {success:true}` contract

This is **not** durable across process restarts. That limitation is accepted for v1. There is no retry queue in v1.

### Failure Alerting / Logging

- Structured logs for every accepted request: `sourceType`, `email`, `contactId`, `ticketId`, dedupe hit/miss, outcome
- Slack alert on:
  - Intercom API failure
  - outbound quote email failure
  - corporate Slack post failure
  - unexpected exception after request enters the handler
- Alert channel configurable by env, defaulting to an ops channel

### Warranty Claim Payload (newly documented)

```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "repair_date": "string (optional, e.g. 'March 2025')",
  "device_type": "string (required) — MacBook | iPhone | iPad | Apple Watch",
  "model": "string (optional, e.g. 'MacBook Pro 14 M3')",
  "body": "string (required) — issue description"
}
```

Posts to a separate endpoint: `/webhook/warranty-claim` (currently n8n, will move to VPS).

### Theme changes required

| File | Line | Change |
|------|------|--------|
| `assets/contact-form-interceptor.js` | 23 | `webhookUrl` → `https://mc.icorrect.co.uk/webhook/shopify/contact-form` |
| `sections/quote-wizard.liquid` | 1981 | fetch URL → `https://mc.icorrect.co.uk/webhook/shopify/contact-form` |
| `templates/page.our-warranty.json` | (inline JS) | `WEBHOOK_URL` → `https://mc.icorrect.co.uk/webhook/shopify/warranty-claim` |

**Deploy prerequisite:** do not push theme changes until the exact production theme source of truth is recorded. Discovery only proves a local repo exists; it does **not** prove the current checkout/branch is the production branch.

---

## n8n Workflows Affected

| Workflow | ID | Action |
|----------|-----|--------|
| Shopify Contact Form | `tNQphRiUo0L8SdBn` | Disable after VPS service proven (1 week) |
| Consumer Contact Swap | `e1puojhc35tFJML5` | Disable only after no theme-driven consumer/warranty/quote flows still generate michael.f email conversations |
| Warranty Claim Form | `LjNBWaDz9f5Rj8g5` | Disable after VPS service proven (1 week) |

All workflows **disabled, not deleted** — kept for reference.

---

## Rollout Plan

1. **Complete Phase 0 spikes + contract freeze**
2. **Build + verify** VPS service independently
3. **Confirm production theme source of truth**:
   - exact branch
   - exact deploy target/theme
   - rollback commit procedure
4. **Stage A cutover:** push `assets/contact-form-interceptor.js` only
   - live test consumer + corporate
   - monitor logs/Intercom/Slack for 24h
5. **Stage B cutover:** push `sections/quote-wizard.liquid`
   - live test quote-inline + quote-email
   - verify outbound customer quote email still arrives
   - monitor 24h
6. **Stage C cutover:** push `templates/page.our-warranty.json`
   - live test warranty
   - monitor 48h
7. **Ferrari verifies** tickets and attribution using `admin@icorrect.co.uk`
8. **Disable** old n8n workflows after 1 week stable

**Rollback runbook**

1. Revert the most recent cutover commit on the confirmed production theme branch
2. Push the revert
3. Verify browser traffic is hitting the previous endpoint again
4. If any n8n workflow was already disabled, re-enable the relevant workflow(s) before retest
5. Keep the VPS service running unless ingress itself is broken; if ingress is broken, remove the nginx route or stop the service and restore the previous path
6. Verify one live submission completes through the restored path before declaring rollback complete

---

## Discovery Artefacts

All in `builds/webhook-migration/discovery/`:
- `shopify-payload-schemas.md` — exact field schemas for all form sources
- `n8n-exports/shopify-contact-form.json` — exported n8n workflow (78KB)
- `n8n-exports/consumer-contact-swap.json` — exported Contact Swap workflow (15KB)
- `n8n-exports/warranty-claim.json` — exported Warranty Claim workflow (30KB)
- `intercom-api-proof.md` — API test transcripts proving ticket creation works
- `shopify-deploy.md` — git deploy confirmed, CORS origins documented

---

## Build Todo

### Phase 0 — Spikes + Contract Freeze — blocking

| # | Task | Output |
|---|------|--------|
| 0a | Prove Intercom ticket flow for **new contact** and **existing contact** | Exact request/response samples recorded |
| 0b | Prove corporate **company create/attach** behavior, including duplicate/collision outcome | Company contract recorded |
| 0c | Freeze quote-email behavior as: **send customer email + create internal ticket/notification** | Explicit acceptance criteria recorded |
| 0d | Prove warranty claim ticket behavior | Warranty contract recorded |
| 0e | Confirm production Shopify theme source of truth | Branch/theme target recorded |
| 0f | Freeze payload fixtures, validation rules, success/error contracts, and ticket templates | Contract section updated and approved |

### Phase 1 — Build Service Skeleton + Boring Path

| # | Task | Blocked by |
|---|------|------------|
| 1a | Create project directory + package.json at `builds/shopify/services/contact-form/` | 0f |
| 1b | Build shared helpers: `intercom.js`, `alerts.js`, `dedupe.js` | 0a, 0b, 0f |
| 1c | Build `index.js` skeleton with `GET /health`, JSON parsing, CORS, structured logging | 1b |
| 1d | Implement `/webhook/shopify/contact-form` for consumer + corporate only | 1c |
| 1e | Create systemd service (`shopify-contact-form.service`) | 1d |
| 1f | Add nginx location blocks (`auth_basic off;` for both routes) | 1e |
| 1g | Verify health, OPTIONS, validation failures, consumer ticket, corporate ticket/company/Slack, ops alert path | 1f |

### Phase 2 — Quote Wizard Paths

| # | Task | Blocked by |
|---|------|------------|
| 2a | Implement quote-inline handling on `/webhook/shopify/contact-form` | 1g, 0f |
| 2b | Implement quote-email handling preserving outbound customer quote email | 2a, 0c |
| 2c | Verify quote-inline ticket, quote-email internal ticket, outbound customer email, and client-compatible success/error responses | 2b |

### Phase 3 — Warranty Route

| # | Task | Blocked by |
|---|------|------------|
| 3a | Implement `/webhook/shopify/warranty-claim` using frozen warranty contract | 1g, 0d |
| 3b | Verify warranty validation, ticket creation, attribution, and client-compatible JSON responses | 3a |

### Phase 4 — Staged Theme Cutover

| # | Task | Blocked by |
|---|------|------------|
| 4a | Record exact production branch/theme target before any push | 0e |
| 4b | Update `contact-form-interceptor.js` line 23 → VPS URL | 1g, 4a |
| 4c | Push Stage A theme change only | 4b |
| 4d | Live test consumer + corporate on icorrect.co.uk | 4c |
| 4e | Update `quote-wizard.liquid` line 1981 → VPS URL | 2c, 4d |
| 4f | Push Stage B theme change only | 4e |
| 4g | Live test quote-inline + quote-email on icorrect.co.uk | 4f |
| 4h | Update `page.our-warranty.json` WEBHOOK_URL → VPS URL | 3b, 4g |
| 4i | Push Stage C theme change only | 4h |
| 4j | Live test warranty on icorrect.co.uk | 4i |
| 4k | Ferrari verifies tickets and attribution in Intercom (`admin@icorrect.co.uk`) | 4d, 4g, 4j |

### Phase 5 — Monitoring + Cleanup (after 1 week stable)

| # | Task | Blocked by |
|---|------|------------|
| 5a | Monitor logs, Intercom artifacts, Slack alerts, and duplicate rate for 7 days | 4k |
| 5b | Disable n8n workflow `tNQphRiUo0L8SdBn` (Shopify Contact Form) | 5a |
| 5c | Disable n8n workflow `e1puojhc35tFJML5` (Consumer Contact Swap) only after no new michael.f consumer/warranty/quote email conversations are observed | 5a |
| 5d | Disable n8n workflow `LjNBWaDz9f5Rj8g5` (Warranty Claim Form) | 5a |

---

## QA Review — Second Pass

### Findings

#### 1. Critical — Quote email path is being changed without admitting it

**What is still wrong**

The plan treats quote wizard email submissions as "create Intercom ticket with quote/pricing details" and claims "forms look and behave exactly the same." That is false. The current flow sends a real quote email to the customer and separately notifies Intercom. The proposed flow, as written, drops the outbound customer email and replaces it with a ticket.

**Why this would cause execution pain**

This is not an implementation detail. It is a customer-facing behavior change. The UI still says "Sent! Check your inbox." If engineers build what this plan says, they will ship a regression while believing they are only fixing attribution.

**Evidence**

- `sections/quote-wizard.liquid` shows the success UI text is inbox-oriented and unchanged by this plan.
- `discovery/n8n-exports/shopify-contact-form.json` shows the current quote path does both:
  - `Send Quote Email` → sends HTML email to `{{ $json.email }}`
  - `Send Quote to Intercom` → separate support notification
- `discovery/shopify-payload-schemas.md` documents quote email as its own path, but the revised plan collapses it into "create ticket with pricing details."

**What should change before implementation starts**

Add an explicit scope decision:

1. Preserve outbound customer quote email in v1, or
2. Change the UI copy, acceptance criteria, and Ferrari sign-off to match a ticket-only flow.

Do not leave this as implicit engineering interpretation.

#### 2. Critical — "Tickets are proven" is overstated and not sufficient for production cases

**What is still wrong**

The plan says ticket-based attribution is proven and the build is ready. The discovery proof only shows that a ticket can be created via API and that contacts/companies can be created. It does not prove the real production cases this plan depends on:

- new contact + ticket attribution behavior
- existing contact duplicate handling under the intended flow
- corporate company create/attach collision behavior
- warranty claim ticket behavior
- quote-email path under ticket-only handling

The same proof document also recommends conversations for consumer/quote paths, not tickets.

**Why this would cause execution pain**

The team will discover API behavior while coding the production service. That is discovery on the critical path masquerading as implementation.

**Evidence**

- `discovery/intercom-api-proof.md` proves `/tickets` works on one test path and separately recommends conversations for consumer/quote.
- The tested contact was an existing contact (`michael.f@icorrect.co.uk`), not a representative new customer case.
- The plan still claims "We've proven this works" for the ticket approach across all paths.

**What should change before implementation starts**

Add a spike before build:

1. New contact → ticket
2. Existing contact → ticket
3. Corporate enquiry → contact + company + attach + ticket
4. Warranty claim → ticket
5. Quote-email path → exact intended behavior

Capture exact request/response payloads and resulting Intercom objects in the plan.

#### 3. High — The VPS service contract is still not defined tightly enough to build safely

**What is still wrong**

The plan says the service handles "all 4 form sources," but the actual implementation surface is more fragmented than that:

- consumer form
- corporate form
- quote wizard inline question
- quote wizard email quote
- warranty claim

Those paths do not share one payload shape. They use wrapped payloads, flat payloads, different naming conventions, and different response expectations.

The revised plan removed most of the contract detail that existed in the older plan and replaced it with a task list.

**Why this would cause execution pain**

Someone starting tomorrow will still need to answer:

- What is the normalized internal schema?
- Which fields are required for each path?
- Which validation failures return 400 vs soft success?
- What exact ticket title/description format is required per path?
- Which paths can tolerate missing phone/device fields?

If those are decided during coding, the implementation will drift and tests will be weak.

**Evidence**

- `discovery/shopify-payload-schemas.md` shows:
  - wrapped `contact.*` payloads
  - flat snake_case payloads
  - flat camelCase payloads
- `discovery/shopify-payload-schemas.md` also documents different client response handling rules per source.
- The older `archive/plan-combined-2026-03-30.md` had explicit CORS, parsing, browser contract, and failure response detail that this revised plan dropped.

**What should change before implementation starts**

Add a proper contract section with:

1. Canonical normalized DTOs for consumer, corporate, quote-inline, quote-email, warranty
2. Required/optional fields for each
3. Exact validation rules
4. Exact response contract for both endpoints
5. Exact ticket/body output contract per path

#### 4. High — Corporate path is still hand-wavy and the current n8n flow is not a safe model to copy

**What is still wrong**

The plan says the corporate path "already works correctly" and should be preserved as a pattern. That is too charitable.

The current workflow returns success immediately, while the actual Intercom contact/company/ticket/Slack work runs separately. That means the browser can see success even if the back-end work fails. The company creation path is also loosely defined and does not show a robust duplicate/search strategy.

**Why this would cause execution pain**

If engineers copy the current behavior, they preserve silent failure semantics. If they improve it ad hoc, they are making integration decisions that the plan should already have made.

**Evidence**

- `discovery/n8n-exports/shopify-contact-form.json` shows `Return Corporate Success` is wired in parallel from `Is Corporate?`, before downstream company/ticket/Slack completion.
- The same export shows company creation is just `POST /companies` with `company_id` derived from a slug of the company name.
- `Extract Company ID` accepts `companyResponse.id || null` with no explicit duplicate handling contract.

**What should change before implementation starts**

Split corporate into a spike-first contract:

1. Define company lookup/create behavior
2. Define collision policy for `company_id`
3. Define attach failure behavior
4. Define whether Slack failure fails the request or only alerts ops
5. Define exact ticket title/description format and required fields

#### 5. High — Warranty claim path is documented, but not actually ready

**What is still wrong**

The plan presents the warranty route as newly documented and in scope, but that is not the same as implementation-ready. There is no proof for the proposed direct ticket flow. The current flow is still an email-to-Intercom hack followed by delayed conversation surgery.

**Why this would cause execution pain**

Warranty will become live integration research during implementation. It is a separate workflow with separate behavior and should not be smuggled into the same execution pass under the label of "same problem."

**Evidence**

- `discovery/n8n-exports/warranty-claim.json` shows:
  - send email to Intercom
  - return success immediately
  - wait 45 seconds
  - search conversation
  - add real customer
  - remove sender contact
- `discovery/shopify-payload-schemas.md` does not document warranty; the revised plan adds warranty payload notes itself.
- `templates/page.our-warranty.json` assumes JSON response parsing and a specific success/error model.

**What should change before implementation starts**

Either:

1. Split warranty into a separate spike/build phase, or
2. Prove the exact ticket-based warranty flow first and add a full contract section equivalent to the other paths.

#### 6. High — Idempotency, duplicate submissions, and post-cutover monitoring are still underdefined

**What is still wrong**

The plan still has no concrete idempotency or duplicate-submission policy. It also has no meaningful operational monitoring beyond "Monitor 48 hours."

Both browser clients use 30-second timeouts. Users retry. Browsers retry. Engineers retest. Without dedupe rules, duplicate tickets are likely.

**Why this would cause execution pain**

You will create duplicate Intercom artifacts and then have no reliable way to distinguish legitimate volume from retries or partial failures. After cutover, "check Intercom" is not monitoring.

**Evidence**

- `assets/contact-form-interceptor.js` uses a 30s timeout.
- `sections/quote-wizard.liquid` uses a 30s timeout.
- The revised plan says to monitor 48 hours but defines no metrics, alerts, logs, or failure thresholds.
- The older `archive/plan-combined-2026-03-30.md` explicitly called for failure alerting on Intercom API failures; this revised plan does not.

**What should change before implementation starts**

Add:

1. Duplicate policy: what constitutes the same submission
2. Idempotency strategy or explicit "no dedupe" acceptance
3. Structured logging fields
4. Slack/ops alerting on Intercom or Slack API failure
5. Concrete cutover checks and failure thresholds

#### 7. High — Theme cutover and rollback are presented as deterministic without validating the real deployment source of truth

**What is still wrong**

The plan says rollback is just reverting three theme file changes via git and that deploy is via git push. That is not enough.

The local theme checkout referenced by discovery is currently on `feature/trust-bar`, not a clearly established production branch. The plan never states which branch or theme ID is the real deploy target.

**Why this would cause execution pain**

If the local repo/branch is not the actual production source of truth, rollout and rollback are both unreliable. "Takes 2 minutes via git" becomes wishful thinking.

**Evidence**

- `discovery/shopify-deploy.md` only says deploys via git and gives the local path.
- Local repo status showed the checkout on branch `feature/trust-bar`.
- The plan still states rollback as a simple git revert of the three file changes.

**What should change before implementation starts**

Record:

1. The exact production theme branch
2. The exact theme target/source of truth
3. The rollback commit procedure
4. The verification step after rollback

Without that, the rollback section is superficial.

#### 8. Medium — "Health + CORS + challenge handling" is vague and partially cargo-culted

**What is still wrong**

The task list says to verify health, CORS, and challenge handling, but the revised plan never defines:

- `GET /health` response shape
- `OPTIONS` behavior
- allowed headers/methods
- whether challenge handling is actually required for these Shopify/browser routes at all

Challenge handling appears to be borrowed from the Monday webhook plan, not grounded in a documented Shopify requirement here.

**Why this would cause execution pain**

Engineers will either waste time implementing irrelevant challenge logic or skip concrete interface work because the plan never pins it down.

**Evidence**

- `plan-shopify-contact-form.md` includes "Verify health + CORS + challenge handling"
- `archive/plan-combined-2026-03-30.md` previously had concrete CORS and health details for this service
- Discovery docs for Shopify/browser forms do not establish a real challenge contract

**What should change before implementation starts**

Replace vague wording with explicit interface definitions:

1. `GET /health` response
2. `OPTIONS` behavior for both origins
3. POST success/error payloads
4. Remove challenge handling unless a real caller requires it

### What The First QA Likely Missed

- The revised plan is materially less executable than the older `archive/plan-combined-2026-03-30.md` because it dropped explicit contracts and kept only high-confidence prose plus a task checklist.
- The quote-email path is not just attribution plumbing; it contains a customer-visible outbound email feature and UI promise.
- The deployment/rollback story is not validated against the actual theme source of truth.

### Required Plan Changes Before Execution

1. Add a spike phase for Intercom ticket behavior on:
   - new contact
   - existing contact
   - duplicate email case
   - company attach
   - warranty
2. Add a separate product decision for quote-email:
   - preserve outbound email, or
   - explicitly change behavior and UI copy
3. Add canonical normalized request schemas and validation rules for:
   - consumer
   - corporate
   - quote-inline
   - quote-email
   - warranty
4. Add explicit response contracts for:
   - `/webhook/shopify/contact-form`
   - `/webhook/shopify/warranty-claim`
5. Add idempotency/duplicate policy
6. Add failure alerting and measurable post-cutover monitoring
7. Replace the rollback note with a full operational rollback runbook
8. Record the actual production theme deploy source of truth before implementation

### Recommended Execution Order

1. Spike quote-email behavior and get a hard product decision
2. Spike Intercom ticket semantics for new/existing contacts and company attach
3. Write the service contract:
   - normalized schemas
   - validation
   - response contracts
   - ticket/body outputs
   - duplicate policy
   - alerts
4. Build consumer + corporate path first
5. Verify consumer + corporate against Intercom and Slack
6. Build quote-inline path
7. Build quote-email path only after the email-vs-ticket contract is settled
8. Treat warranty as a separate spike/build step, not an assumed add-on
9. Verify theme deployment source of truth
10. Cut over in stages, then disable n8n only after measured stability

### Final Assessment

**Not ready**

The plan is still mixing discovery with implementation and hiding real behavioral changes behind "ready to build" language. The ticket choice, quote-email behavior, corporate company contract, warranty path, rollback story, and operational monitoring all need to be nailed down before engineering starts.

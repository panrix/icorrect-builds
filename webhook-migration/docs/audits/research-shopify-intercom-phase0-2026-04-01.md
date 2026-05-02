# Shopify / Intercom Migration — Phase 0 Research Findings

**Date:** 2026-04-01  
**Purpose:** Convert the Shopify / Intercom migration track from partial planning into an evidence-backed build brief for Phase 1.

## Scope Reviewed

- Live n8n workflows:
  - `tNQphRiUo0L8SdBn` — `Shopify Contact Form`
  - `LjNBWaDz9f5Rj8g5` — `Warranty Claim Form`
  - `e1puojhc35tFJML5` — `Intercom - Consumer Contact Swap (Webhook)`
- Live Shopify theme entrypoints:
  - `assets/contact-form-interceptor.js`
  - `sections/quote-wizard.liquid`
  - `templates/page.our-warranty.json`
- Live Intercom API surface:
  - `ticket_types`
  - `tickets/search`
  - `conversations/search`
  - `conversations/{id}`
  - `companies/{id}`

## Executive Summary

The current Shopify/Intercom estate is mixed-mode, not uniform.

- Consumer contact form still enters Intercom through the old SMTP path, with `michael.f@icorrect.co.uk` as the original source author.
- Warranty claims still use the old SMTP path plus a delayed contact-swap pattern.
- Quote email still uses SMTP for both the customer-facing email and the internal Intercom notification.
- Corporate has stronger evidence of a real ticket-plus-company path today, but the n8n workflow still returns success before downstream Intercom and Slack side effects finish.
- The Intercom ticket schema risk is now much lower than earlier feared: the live customer ticket type `2985889` only has two active attributes, `_default_title_` and `_default_description_`.

This means the safest Phase 1 migration remains:

1. consumer
2. corporate

while keeping:

1. quote email
2. warranty

as later phases unless explicitly re-scoped.

## Proven Current State By Path

### 1. Consumer Contact Form

**Entry point**
- Shopify theme `assets/contact-form-interceptor.js`
- POST target: `https://icorrect.app.n8n.cloud/webhook/shopify-contact-form`

**Live n8n behavior**
- Sends SMTP email from `michael.f@icorrect.co.uk` to `support@icorrect.co.uk`
- Creates or reuses an Intercom contact in parallel
- Returns browser success after the SMTP send path
- Does **not** create a direct ticket in the visible consumer branch of the exported workflow

**Live Intercom evidence**
- `conversations/search` for `source.subject ~ "Contact Form:"` returns `228` conversations
- recent examples are still authored by `michael.f@icorrect.co.uk`
- recent objects with `Contact Form:` titles also appear in the live ticket corpus
- `GET /conversations/215473732395440` confirms:
  - source author email is `michael.f@icorrect.co.uk`
  - the object later receives ticket/workflow parts
  - the visible ticket surface is being layered on top of the email-authored conversation object

**Conclusion**
- Consumer is **not** direct-ticket-from-customer yet
- the michael.f authorship problem is still real at ingress
- production appears to reshape the conversation into the ticket surface afterwards

### 2. Corporate Enquiry

**Entry point**
- Shopify theme `assets/contact-form-interceptor.js`
- same n8n endpoint as consumer

**Live n8n behavior**
- create/reuse contact
- create/update company using slugified `company_id`
- attach company to contact
- create Intercom ticket using `ticket_type_id = 2985889`
- send Slack notification to `#corporate-onboarding`
- return browser success **before** those downstream side effects are fully complete

**Live Intercom evidence**
- recent ticket sample includes:
  - `Corporate Enquiry: QA Test Ltd`
  - stable `company_id = 69cbec8f206280817bc902fb`
  - same company reused across different contacts
- company `69cbec8f206280817bc902fb` resolves to:
  - `name = QA Test Ltd`
  - `company_id = qa-test-ltd`
  - `custom_attributes.creation_source = api`

**Conclusion**
- Corporate already has credible live proof of the direct ticket-plus-company model
- the main migration risk is not schema shape
- the main migration risk is execution semantics:
  - current browser success does not mean Intercom ticket + company + Slack are all finished

### 3. Quote Wizard Inline Question

**Entry point**
- Shopify theme `sections/quote-wizard.liquid`
- POST target: `https://icorrect.app.n8n.cloud/webhook/shopify-contact-form`

**Live n8n behavior**
- routes through the non-quote-email path
- therefore behaves like the consumer email-authored path, not like direct ticket creation

**Conclusion**
- Quote inline should still be treated as a later migration phase
- it inherits the same attribution issue class as consumer

### 4. Quote Wizard Email Quote

**Entry point**
- Shopify theme `sections/quote-wizard.liquid`
- POST target: `https://icorrect.app.n8n.cloud/webhook/shopify-contact-form`

**Live n8n behavior**
- sends customer-facing quote email from `michael.f@icorrect.co.uk`
- creates or reuses Intercom contact
- updates contact custom attributes with quote data
- sends a second SMTP email to `support@icorrect.co.uk` with subject `Quote Request: ...`
- returns browser success after the outbound customer email path

**Live Intercom evidence**
- `conversations/search` for `source.subject ~ "Quote Request:"` returns `13` conversations
- recent examples are still authored by `michael.f@icorrect.co.uk`

**Conclusion**
- Quote email is still explicitly dependent on the SMTP-to-Intercom pattern
- this path is higher-risk than consumer/corporate because it includes a customer-facing outbound email contract

### 5. Warranty Claim

**Entry point**
- Shopify theme `templates/page.our-warranty.json`
- POST target: `https://icorrect.app.n8n.cloud/webhook/warranty-claim`

**Live n8n behavior**
- sends SMTP email from `michael.f@icorrect.co.uk` to `support@icorrect.co.uk`
- searches or creates the customer contact separately
- waits `45` seconds
- searches conversations by `source.subject`
- adds the real customer to the conversation
- removes the sender contact
- returns success before the delayed reconciliation finishes

**Live Intercom evidence**
- `conversations/search` for `source.subject ~ "Warranty Claim:"` returns `4` conversations
- recent examples are still authored by `michael.f@icorrect.co.uk`

**Conclusion**
- Warranty is still squarely on the old attribution hack
- it is the least suitable path for an early cutover because the current design depends on delayed asynchronous repair logic

## Intercom Schema Proof

Live `GET /ticket_types` now proves the customer ticket type is much simpler than earlier documentation suggested.

### Ticket Type `2985889`

- Name: `Tickets`
- Category: `Customer`
- Active visible attributes:
  - `_default_title_`
  - `_default_description_`

Most earlier custom fields are archived.

**Migration implication**
- Phase 1 ticket creation can safely target `_default_title_` and `_default_description_` only
- the migration does not need to model a large custom ticket schema to be production-compatible

## Important Contradictions Found

### 1. The planning docs were directionally right, but the live state is more mixed

- consumer and warranty are still definitely on SMTP-authored ingress
- corporate has stronger live ticket/company evidence than the older narrative implied
- quote email is still tightly coupled to SMTP and must not be treated as simple plumbing

### 2. The old “choose conversations vs tickets” question is stale for Phase 1

The active plan already freezes tickets as the target state. That should remain the implementation target for Phase 1.

### 3. Local theme repo is not enough to declare deploy truth

Current local repo facts:
- repo: `git@github.com:panrix/icorrect-shopify-theme.git`
- branch: `main`
- local checkout is dirty

This means:
- repo ownership is known
- deploy method is git-backed
- but the exact production push source of truth is still not fully frozen from local state alone

## Theme Target Evidence

Shopify Admin now provides a stronger target picture:

- live main theme:
  - name: `icorrect-shopify-theme/main`
  - theme ID: `158358438141`
  - role: `main`
- related preview themes exist for:
  - `feature/trust-bar [preview]`
  - `fix/theme-audit-p0-remediation [qa] 7cba476`
  - `Copy of icorrect-shopify-theme/main`

**Migration implication**
- the production cutover target should be treated as theme ID `158358438141`
- rollback planning should explicitly reference that main theme ID and the corresponding git commit/branch used for the push

## Recommended Service Directory

The current proposed path `/home/ricky/builds/shopify/services/contact-form/` is invalid and does not match the existing service layout.

Current live service pattern:
- `/home/ricky/builds/monday/services/status-notifications/`
- `/home/ricky/builds/backmarket/services/bm-shipping/`
- `/home/ricky/builds/backmarket/services/bm-payout/`
- `/home/ricky/builds/backmarket/services/bm-grade-check/`

Best-fit recommendation for this migration:

- `/home/ricky/builds/intercom/services/shopify-contact-form/`

Why this is the best fit:
- the long-lived runtime owner is Intercom ticket/contact creation, not the temporary migration workspace
- `builds/intercom/` already exists as the domain folder
- it matches the existing `builds/<domain>/services/<service-name>/` structure used elsewhere on the VPS

Second-best fallback:

- `/home/ricky/builds/webhook-migration/services/shopify-contact-form/`

Use the fallback only if the intent is to keep this as a migration-scoped implementation rather than a durable service home.

## Phase 1 What Is Now Proven Enough

- consumer and corporate request shapes
- current browser success/error contract for consumer and corporate
- Intercom customer ticket type and minimum required attributes
- corporate company reuse pattern
- need for CORS on `icorrect.co.uk` and `www.icorrect.co.uk`
- need to preserve JSON response behavior for browser compatibility

## Phase 1 What Is Still Blocked

- exact implementation directory is still not frozen
- exact production theme deploy target/process is still not written as an operator-grade source of truth
- quote email contract remains mixed customer-email + internal-notification behavior
- warranty remains mixed SMTP + delayed contact swap behavior
- current n8n success timing means production parity must check side effects, not just HTTP 200

## Recommended Next Actions

### Build-Ready Research Tasks

1. Freeze the actual VPS service directory.
   - recommended: `/home/ricky/builds/intercom/services/shopify-contact-form/`
2. Freeze the exact production theme deployment path and operator rollback steps.
   - production target should explicitly reference Shopify theme ID `158358438141`
3. Write a Phase 1 migration matrix for:
   - consumer
   - corporate
4. Define explicit service semantics for:
   - when to return success
   - what counts as a failed submission
   - whether Slack failure should fail corporate requests or only alert

### Execution Recommendation

Phase 1 should remain:
- consumer
- corporate

Deferred:
- quote inline
- quote email
- warranty

### Reason

Consumer and corporate now have enough evidence to build a clean ticket-first VPS replacement.

Quote email and warranty still depend on old SMTP-authored behavior in ways that make regression more likely if they are bundled into the first cutover.

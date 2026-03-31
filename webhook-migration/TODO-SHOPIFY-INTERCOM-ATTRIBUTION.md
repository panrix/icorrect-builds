# Todo — Shopify / Intercom Attribution Fix

**Date:** 2026-03-31
**Status:** Discovery and planning only. Do not start production implementation from the old combined plan.

## Current State

Known facts:

- Local theme repo exists at `/home/ricky/builds/icorrect-shopify-theme`
- GitHub repo is `https://github.com/panrix/icorrect-shopify-theme.git`
- Live consumer/corporate forms still post to n8n from:
  - `assets/contact-form-interceptor.js`
- Live quote wizard still posts to n8n from:
  - `sections/quote-wizard.liquid`
- The planned `/home/ricky/builds/shopify/services/contact-form/` path does not exist

Current planning docs:

- `plan-shopify-contact-form.md`
- `execution-checklist-shopify-contact-form.md`

## First Decision To Freeze

Before implementation starts, decide the Intercom artefact type for consumer and quote flows:

- `conversations`
- or `tickets`

This must be resolved once and written into the main plan. The docs currently conflict.

## Safe Delivery Phases

### Phase 1

Consumer + corporate only.

Included:

- consumer contact form
- corporate enquiry

Excluded:

- quote wizard inline
- quote email
- warranty

### Phase 2

Quote wizard inline.

### Phase 3

Quote email.

### Phase 4

Warranty.

## Before Writing Service Code

1. Record the actual service directory.
2. Record the exact production theme source of truth.
3. Freeze the normalized DTO for:
- consumer
- corporate
4. Freeze the exact response contract for `POST /webhook/shopify/contact-form`.
5. Freeze validation rules.

## Intercom Proof Still Needed

Before implementation, prove:

1. New contact flow using the chosen artefact type
2. Existing contact flow using the chosen artefact type
3. Corporate company create behavior
4. Corporate company attach behavior when company already exists
5. Quote email internal handling
6. Warranty handling
7. Intercom 4xx failure behavior
8. Intercom 5xx failure behavior

## Build Requirements

The new service must support:

- `GET /health`
- `OPTIONS`
- `POST /webhook/shopify/contact-form`

Phase 1 behavior only:

- normalize consumer and corporate payloads
- validate required fields
- return JSON on both success and failure
- include CORS headers on every response
- log structured request outcomes
- dedupe obvious browser retries
- alert on runtime dependency failures

Deferred routes/types must fail explicitly, not silently.

## Verification Before Theme Change

1. Consumer success
2. Consumer validation failure
3. Consumer runtime failure
4. Corporate success
5. Corporate validation failure
6. Corporate runtime failure
7. CORS for both storefront origins
8. Dedupe behavior
9. Intercom side effect confirmed

## Theme Cutover Order

1. Stage 1:
- only cut over consumer + corporate
- do not bundle quote wizard or warranty changes into the same push

2. Stage 2:
- cut over quote wizard inline

3. Stage 3:
- cut over quote email
- preserve outbound customer email and UI success behavior

4. Stage 4:
- cut over warranty

## Only After Stability

Disable old n8n workflows only after each corresponding path is proven:

- `tNQphRiUo0L8SdBn`
- `e1puojhc35tFJML5`
- `LjNBWaDz9f5Rj8g5`

## Non-Negotiables

1. No same-day all-forms cutover.
2. No theme push without a tested rollback.
3. No “HTTP 200 means success” verification.
4. No implementation from the historical combined `plan.md`.

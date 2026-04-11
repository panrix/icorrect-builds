# Execution Checklist: Shopify Form Migration

**Date:** 2026-03-31
**Author:** Codex
**Purpose:** Start building today without breaking the live Shopify form flows.
**Status:** Build can start in a restricted scope. Production cutover is blocked until red items are cleared.

## Operating Rule

If "nothing breaks" is the requirement, then the only safe approach is:

1. build in narrow scope
2. prove parity off-production
3. cut over one path at a time
4. keep instant rollback

No same-day all-forms cutover is permitted by this checklist.

## Traffic Light

### Green

These are established enough to build against:

- The live Shopify theme integration points are real:
  - `/home/ricky/builds/icorrect-shopify-theme/assets/contact-form-interceptor.js`
  - `/home/ricky/builds/icorrect-shopify-theme/sections/quote-wizard.liquid`
  - `/home/ricky/builds/icorrect-shopify-theme/templates/page.our-warranty.json`
- Current payload shapes are documented in `/home/ricky/builds/webhook-migration/discovery/shopify-payload-schemas.md`.
- The current browser behavior is visible in theme code:
  - consumer/corporate use JSON-aware fetch with a 30s timeout
  - quote wizard uses a 30s timeout and looser success handling
  - warranty expects JSON and specific success/error messages
- Live Intercom ticket type `2985889` is now proven as a simple customer ticket shape with only:
  - `_default_title_`
  - `_default_description_`
- Corporate company reuse is now proven in production through recent `QA Test Ltd` tickets sharing one `company_id`
- A working VPS shadow-mode pattern already exists on this machine for another migration:
  - `status-notifications.service`
  - `/home/ricky/builds/monday/services/status-notifications/index.js`
  - `/home/ricky/logs/status-notifications-shadow.jsonl`

### Amber

These are buildable, but not safe to cut over yet:

- Consumer + corporate contact-form handling on one VPS route.
- Shared service skeleton:
  - `GET /health`
  - CORS handling
  - request normalization
  - structured logging
  - dedupe cache
  - ops alert hooks
- Intercom ticket flow for existing contacts, if verified during Phase 0.
- Corporate company attach flow, if duplicate/collision behavior is explicitly frozen.
- Consumer current-state parity is more complex than the old docs implied:
  - ingress is still SMTP-authored as `michael.f@icorrect.co.uk`
  - the ticket surface appears later on the same Intercom object
- Corporate current-state parity must account for the fact that n8n returns success before downstream Intercom and Slack work is fully finished.

### Red

These block production cutover:

- The plan path for the new service is wrong. `/home/ricky/builds/shopify/services/contact-form/` does not exist and cannot be treated as the implementation target.
- Production Shopify deploy source of truth is not fully recorded. We now know the live main target is theme ID `158358438141` (`icorrect-shopify-theme/main`), but rollback/process ownership still needs to be written operator-grade.
- Ticket-first behavior is not fully proven for:
  - new contacts
  - corporate company attach edge cases under the new service
- Quote-email is customer-facing and cannot be treated as plumbing. The UI promise is "Sent! Check your inbox."
- Warranty is a separate route with separate browser behavior and separate current back-end behavior.
- No Shopify VPS service, systemd unit, nginx route, or port `8015` listener exists yet.

## Today’s Allowed Scope

Build may start today only for this scope:

- freeze the service contract for consumer + corporate
- prove Intercom ticket flow for new and existing contacts
- prove company create/attach behavior for corporate
- build the VPS service in non-production mode
- verify request/response compatibility locally

Build must not start today for this scope:

- quote-email production behavior changes
- warranty production behavior changes
- theme push to production
- disabling n8n workflows
- switching any live Shopify endpoint to `mc.icorrect.co.uk`

## Go / No-Go Gates

### Gate 0: Before Writing Service Code

Required:

- Record the actual service directory.
- Recommended target: `/home/ricky/builds/intercom/services/shopify-contact-form/`
- Record the exact production theme branch and deploy target.
- Minimum deploy target evidence now known:
  - Shopify main theme ID `158358438141`
  - theme name `icorrect-shopify-theme/main`
- Freeze the normalized DTO for:
  - consumer
  - corporate
- Freeze exact response contracts for `POST /webhook/shopify/contact-form`.
- Freeze validation rules for consumer and corporate.

No-go if:

- any engineer is still deciding field names during implementation
- the service directory is still the invalid `/home/ricky/builds/shopify/...` path
- the production theme source of truth is still "probably this repo/branch"

### Gate 1: Before Any Theme Change

Required:

- `GET /health` returns 200 from the local service.
- `OPTIONS` works for:
  - `https://icorrect.co.uk`
  - `https://www.icorrect.co.uk`
- Consumer request fixture creates the correct Intercom artifact.
- Corporate request fixture creates the correct Intercom artifact and handles company attach correctly.
- Failure path returns browser-compatible JSON.
- Logs include enough detail to detect duplicates and silent drops.
- Rollback steps are written and tested for the exact theme target.

No-go if:

- success means only "HTTP 200" without checking the Intercom side effect
- CORS behavior is assumed rather than tested
- Slack failure policy for corporate is still undefined

### Gate 2: Before Stage A Production Cutover

Required:

- Only `assets/contact-form-interceptor.js` changes in the theme push.
- Consumer and corporate smoke tests pass against the VPS endpoint.
- Ferrari or owner verifies resulting Intercom objects with `admin@icorrect.co.uk`.
- nginx route exists and is tested.
- systemd service auto-restarts cleanly.
- rollback commit target is identified before push.

No-go if:

- quote wizard or warranty files are bundled into the same production push
- the VPS service has not run stably under local or shadow verification
- rollback requires discovery

## Owner-Ready Tasks

### Track A: Product / Owner

- Confirm today’s scope is consumer + corporate only.
- Confirm quote-email remains blocked until its exact output contract is signed off.
- Confirm warranty remains blocked until its exact output contract is signed off.
- Record the production Shopify branch/theme source of truth.

### Track B: Backend

- Create the Shopify form service in the recorded service directory.
- Implement:
  - `GET /health`
  - `POST /webhook/shopify/contact-form`
  - `OPTIONS` support
- Normalize only these source types first:
  - consumer
  - corporate
- Add validation, logging, dedupe, and ops alert stubs from day one.
- Keep quote-inline, quote-email, and warranty behind explicit "not implemented" handling until their contracts are frozen.

### Track C: Intercom Spike

- Prove and save exact request/response examples for:
  - new contact ticket
  - existing contact ticket
  - corporate contact + company create under the new service
  - corporate contact + company attach when company already exists under the new service
- Record exact failure behavior for:
  - duplicate company slug or ID
  - missing contact
  - Intercom 4xx
  - Intercom 5xx

### Track D: Ops

- Add the systemd unit only after the service boots locally.
- Add nginx route only after the service is responding locally.
- Keep the route private to testing until Stage A.
- Verify:
  - process restart
  - port binding
  - health response
  - request logs

### Track E: QA

- Build fixed request fixtures from current theme payloads.
- Verify browser compatibility for:
  - consumer success
  - consumer validation failure
  - consumer runtime failure
  - corporate success
  - corporate validation failure
  - corporate runtime failure
- Confirm duplicate submission behavior inside the 30s retry window.
- Confirm no regression in visible form behavior before any theme push.

## Minimum Contract For Phase 1

### Endpoint

- `POST /webhook/shopify/contact-form`

### Supported sources in Phase 1

- consumer
- corporate

### Required success shape

```json
{
  "success": true,
  "message": "human-readable success message"
}
```

### Required failure shape

```json
{
  "success": false,
  "error": "human-readable error message"
}
```

### Required service behavior

- Always return JSON with `Content-Type: application/json`
- Always include CORS headers on both success and failure
- Never return HTML to browser clients
- Never silently accept invalid required fields
- Never create duplicate Intercom artifacts for obvious browser retries inside the dedupe window

## Explicitly Deferred

These items are not part of the first safe build batch:

- quote wizard inline production cutover
- quote-email production cutover
- warranty production cutover
- disabling `tNQphRiUo0L8SdBn`
- disabling `LjNBWaDz9f5Rj8g5`
- disabling `e1puojhc35tFJML5`

## Stop Conditions

Stop the build and re-open the plan if any of the following happens:

- Intercom ticket behavior for new contacts is inconsistent
- company attach behavior is inconsistent or lossy
- browser contract needs to change to make the service work
- the actual production theme branch cannot be confirmed
- rollback is not concrete enough to execute in minutes

## Recommended Sequence For Today

1. Record service directory and production theme source of truth.
2. Freeze consumer + corporate contracts.
3. Run Intercom spikes and write back exact payloads.
4. Build the service skeleton.
5. Implement consumer + corporate only.
6. Verify locally with fixtures.
7. Add systemd and nginx only after local verification passes.
8. Decide whether Stage A can happen tomorrow.

## Final Rule

If anyone wants same-day quote wizard or warranty cutover, this checklist says no.

The boring path is the only path likely to avoid breakage:

- consumer + corporate first
- quote wizard later
- warranty last

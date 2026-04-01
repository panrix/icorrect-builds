# Master Todo — Webhook Migration

**Date:** 2026-04-01
**Purpose:** One execution pack covering both active migration tracks without mixing their scopes again.

## Tracks

There are **2 separate projects** here:

1. **Monday Status Notifications**
   - Current state: live on VPS as of 2026-04-01. Old n8n sender is disabled. Controlled live smoke send passed. Remaining work is monitoring and automation cleanup.
   - Current docs:
     - `plan-status-notifications.md`
     - `status-notifications-shadow-verification-2026-03-31.md`
     - `status-notifications-live-cutover-2026-04-01.md`
     - `cutover-checklist-status-notifications.md`

2. **Shopify / Intercom Attribution Fix**
   - Current state: discovery and planning only. Not yet implementation-ready.
   - Current docs:
     - `plan-shopify-contact-form.md`
     - `execution-checklist-shopify-contact-form.md`

## Rules

1. Do not execute from `plan.md`.
   - That file is now historical only.

2. Do not combine Monday and Shopify cutovers.
   - They are separate code paths, separate risks, and separate rollback plans.

3. No production cutover without:
   - written rollback
   - explicit verification artefacts
   - confirmation of the external side effect, not just HTTP 200

4. Do one production surface at a time.
   - No same-day all-forms Shopify cutover.
   - No live Monday sender switch while parity is still unproven.

## Execution Order

1. Monitor Monday for 48 hours.
2. Review Monday automation destinations in the UI.
3. Disable only the confirmed-safe Monday token-burner automations.
4. Re-scope and freeze Shopify / Intercom product decisions.
5. Build Shopify Stage 1 only: consumer + corporate.
6. Cut over Shopify in stages.
7. Disable old n8n flows only after each completed stage is proven.

## Monday Track — Remaining Work

1. Monitor logs and Slack alerts for 48 hours.
2. Confirm there are no duplicate or missed notifications in production.
3. Review Monday automation destinations in the UI.
4. Disable only the automations confirmed safe to remove.

## Shopify / Intercom Track — Remaining Work

1. Freeze the product decision for consumer and quote flows:
   - `conversations` or `tickets`
2. Keep Phase 1 narrow:
   - consumer + corporate only
3. Record the real service directory before implementation.
4. Build the VPS service in non-production mode.
5. Verify browser contract, CORS, dedupe, validation, and Intercom side effects locally.
6. Cut over the Shopify theme in stages:
   - consumer/corporate first
   - quote inline second
   - quote email third
   - warranty last

## Done Criteria

### Monday is done when

- VPS sender is live
- old n8n sender is disabled
- controlled live smoke send is verified
- no duplicate or missed notifications are observed
- logs are clean for 48 hours
- token-burning automations are either safely disabled or explicitly documented as still pending UI confirmation

### Shopify / Intercom is done when

- all live customer-facing Shopify routes create the correct Intercom artefact
- attribution is correct from the start
- old n8n attribution hacks are disabled
- the visible browser behavior is preserved
- the final service, rollout notes, and rollback steps are committed

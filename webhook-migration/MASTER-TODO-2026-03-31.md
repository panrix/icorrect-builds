# Master Todo — Webhook Migration

**Date:** 2026-03-31
**Purpose:** One execution pack covering both active migration tracks without mixing their scopes again.

## Tracks

There are **2 separate projects** here:

1. **Monday Status Notifications**
   - Current state: shadow service exists and is verified across all 14 template branches plus the missing-Intercom-ID skip path.
   - Current docs:
     - `plan-status-notifications.md`
     - `status-notifications-shadow-verification-2026-03-31.md`
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

1. Finish Monday pre-cutover checks.
2. Capture Monday state in git.
3. Cut over Monday status notifications.
4. Monitor Monday for 48 hours.
5. Re-scope and freeze Shopify / Intercom product decisions.
6. Build Shopify Stage 1 only: consumer + corporate.
7. Cut over Shopify in stages.
8. Disable old n8n flows only after each completed stage is proven.

## Monday Track — Remaining Work

1. Capture the service and docs in git.
2. Test the Monday challenge path.
3. Simulate Intercom failure and confirm Slack alerting.
4. Compare representative shadow outputs against old n8n output.
5. Keep `SHADOW_MODE=true` until the above are signed off.
6. Use `cutover-checklist-status-notifications.md` for live cutover.

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
- no duplicate or missed notifications are observed
- logs are clean for 48 hours
- token-burning automations are either safely disabled or explicitly documented as still pending UI confirmation

### Shopify / Intercom is done when

- all live customer-facing Shopify routes create the correct Intercom artefact
- attribution is correct from the start
- old n8n attribution hacks are disabled
- the visible browser behavior is preserved
- the final service, rollout notes, and rollback steps are committed

# webhook-migration

**State:** dormant (last activity: 2026-04-08)
**Owner:** operations
**Purpose:** Documentation workspace for two webhook migration tracks — Monday status notifications moved to a VPS service (shipped), and Shopify/Intercom contact-form attribution slice (unbuilt).
**Last updated:** 2026-05-02 UTC

## Current state

Dormant. Last meaningful change: 2026-04-08. Monday-status slice shipped (cutover live since Apr 1, see `verification/`); Shopify/Intercom slice still unbuilt.

**Phase 7c review candidate:** decide whether to revive the Shopify/Intercom track or archive this folder once status-notifications is fully embedded in `monday/services/status-notifications/`.

## Structure

- `briefs/` — `plan-status-notifications.md`, `plan-shopify-contact-form.md`. The two original migration plans.
- `decisions/` — empty.
- `docs/` — `cutover-checklist-status-notifications.md`, `execution-checklist-shopify-contact-form.md`, `shopify-intercom-migration-matrix-2026-04-01.md`, plus `audits/research-shopify-intercom-phase0-2026-04-01.md`.
- `archive/` — pre-existing: `plan-combined-2026-03-30.md` (early combined plan, superseded), `qa-review-prompt-for-combined-plan.md`.
- `scratch/` — three TODO files (MASTER-TODO-2026-03-31, TODO-MONDAY-STATUS-NOTIFICATIONS, TODO-SHOPIFY-INTERCOM-ATTRIBUTION). Working-notes.
- `discovery/` — pre-existing: cloudflare scripts, intercom/monday/shopify discovery notes, `n8n-exports/`.
- `verification/` — pre-existing: cutover-checks and live-cutover verification reports for status-notifications, parts-webhook-remap, status-webhook-remap.

## Key documents

### Briefs
- [`briefs/plan-status-notifications.md`](briefs/plan-status-notifications.md) — Monday status-notifications migration plan.
- [`briefs/plan-shopify-contact-form.md`](briefs/plan-shopify-contact-form.md) — Shopify contact-form migration plan (unbuilt).

### Docs
- [`docs/cutover-checklist-status-notifications.md`](docs/cutover-checklist-status-notifications.md) — cutover checklist (status-notifications).
- [`docs/execution-checklist-shopify-contact-form.md`](docs/execution-checklist-shopify-contact-form.md) — execution checklist (Shopify form).
- [`docs/shopify-intercom-migration-matrix-2026-04-01.md`](docs/shopify-intercom-migration-matrix-2026-04-01.md) — migration matrix.
- [`docs/audits/research-shopify-intercom-phase0-2026-04-01.md`](docs/audits/research-shopify-intercom-phase0-2026-04-01.md) — phase-0 research.

### Verification (live cutover evidence — kept in pre-existing subdir)
- [`verification/status-notifications-live-cutover-2026-04-01.md`](verification/status-notifications-live-cutover-2026-04-01.md)
- [`verification/status-notifications-precutover-checks-2026-03-31.md`](verification/status-notifications-precutover-checks-2026-03-31.md)
- [`verification/status-notifications-shadow-verification-2026-03-31.md`](verification/status-notifications-shadow-verification-2026-03-31.md)
- [`verification/parts-webhook-remap-2026-04-08.md`](verification/parts-webhook-remap-2026-04-08.md)
- [`verification/status-webhook-remap-2026-04-08.md`](verification/status-webhook-remap-2026-04-08.md)

### Discovery
- [`discovery/`](discovery/) — initial reverse-engineering notes (Monday webhooks, Shopify payload schemas, Intercom API proof, Cloudflare worker scripts, n8n exports).

### Archive
- [`archive/plan-combined-2026-03-30.md`](archive/plan-combined-2026-03-30.md) — earlier combined plan (superseded by the two split plans in `briefs/`).

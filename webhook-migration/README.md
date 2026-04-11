# Webhook Migration Workspace

This workspace is now split into active docs, supporting discovery, verification records, and archive material.

## Start Here

If you want the current execution entry point, use:

- `MASTER-TODO-2026-03-31.md`

## Active Docs

- `MASTER-TODO-2026-03-31.md` — top-level execution order across both tracks
- `plan-status-notifications.md` — Monday status notification plan and current state
- `TODO-MONDAY-STATUS-NOTIFICATIONS.md` — Monday operational follow-up
- `cutover-checklist-status-notifications.md` — Monday cutover and rollback checklist
- `plan-shopify-contact-form.md` — main Shopify / Intercom planning doc
- `TODO-SHOPIFY-INTERCOM-ATTRIBUTION.md` — scoped rollout todo for Shopify / Intercom
- `execution-checklist-shopify-contact-form.md` — Shopify implementation gate

## Supporting Folders

- `discovery/` — research artefacts and source-of-truth proofs
- `verification/` — Monday shadow, pre-cutover, live cutover, and Apr 8 webhook remap records
- `archive/` — historical combined-plan material kept for reference only

## Rules

1. Do not execute from anything in `archive/`.
2. Treat Monday and Shopify as separate workstreams.
3. Prefer the active docs above over older narrative plans.

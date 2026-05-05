# Phase 7b Batch 2 Webhook Migration Move Report - 2026-05-05

## Status

Physical documentation move complete; parent repo cleanup PR created.

## Scope

`~/builds/webhook-migration` -> `~/operations/webhook-migration`

No Back Market, Intake, Inventory, Shopify theme, nginx, cron, systemd, or live service runtime paths were changed.

## Reason

`webhook-migration` is an operations documentation/control workspace, not a live runtime. It records two separate tracks:

- Monday status notifications: shipped and verified; live runtime remains `/home/ricky/builds/monday/services/status-notifications`.
- Shopify/Intercom attribution: unbuilt; kept as open operations planning material.

Moving it to `~/operations/webhook-migration` keeps the shipped evidence and open planning docs in the operations domain without confusing it with the live status-notifications service.

## Moved Files

| New path | Purpose |
|---|---|
| `~/operations/INDEX.md` | Operations domain index, updated to include `webhook-migration/` |
| `~/operations/webhook-migration/INDEX.md` | Moved workspace index and live-service warning |
| `~/operations/webhook-migration/briefs/plan-status-notifications.md` | Shipped Monday status-notifications migration plan |
| `~/operations/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md` | Live cutover evidence |
| `~/operations/webhook-migration/briefs/plan-shopify-contact-form.md` | Open Shopify/Intercom attribution plan |
| `~/operations/webhook-migration/docs/` | Cutover checklists, execution checklists, and phase-0 research |
| `~/operations/webhook-migration/discovery/` | Cloudflare, n8n, Shopify, Monday, and Intercom discovery evidence |

## Live Reference Check

No `webhook-migration` path references were found in:

- live user crontab
- user systemd unit files
- root systemd unit files

The check did find the live `status-notifications.service`, but it runs from:

`/home/ricky/builds/monday/services/status-notifications`

That service path was intentionally left unchanged.

## Verification

- Local source removed: `/Users/ricky/vps/builds/webhook-migration` no longer exists.
- Live VPS source removed: `/home/ricky/builds/webhook-migration` no longer exists.
- Local destination exists under `/Users/ricky/vps/operations/webhook-migration`.
- Live VPS destination exists under `/home/ricky/operations/webhook-migration`.
- Key local mirror checksums recorded after the move:

| File | SHA-256 |
|---|---|
| `INDEX.md` | `4d447b9922b09fff457d4698ffdcd6c8229fc4343b8542eee67ffdeee061f7b1` |
| `briefs/plan-status-notifications.md` | `6b3352b50017ea84c36dfd04a05db26bfc82b194fbb9c296fb2b38b96772fda1` |
| `verification/status-notifications-live-cutover-2026-04-01.md` | `1469ced00e7a85e482705f534ae687fb9cde0afd838b1750d11d3983fa67acc4` |
| `briefs/plan-shopify-contact-form.md` | `29806eee61ffbeb53c12bd0bc78e23e361d53e97810c3558922c6544ac5b93cd` |

## GitHub Cleanup

The parent `panrix/icorrect-builds` repo now removes the old tracked `webhook-migration/` files, matching the physical operations destination.

## Verification Note

The VPS source removal and destination listing were verified after the move. A later SSH checksum rerun timed out, so the checksum table above records the local mirror state rather than a final remote checksum comparison.

## Follow-up

Phase 7c should split the open Shopify/Intercom attribution plan into a current implementation backlog before anyone builds it. A separate service-path migration is required before moving the live `monday/services/status-notifications` runtime.

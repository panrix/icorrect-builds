# Back Market Cleanup Control Board — 2026-05-02

## Objective
Stabilise the trade-in automation pipeline so we know what is live, what is committed, what is draft, and what must be built next toward end-to-end automation from bid → intake → repair decision → repair/QC/SKU → listing/pricing → sale/dispatch/returns.

## Freeze rule
- No new live listing, payout, SKU write, return reset, or customer-facing mutation until the script/service involved is classified.
- Existing scheduled services/cron stay running unless they show active harm.

## Immediate classification

| Area | Current state | Risk | Action |
|---|---|---|---|
| iCloud/spec checker | Fixed file exists and service reloaded at 06:05 UTC | Previous live process was stale; BM 1624 already deduped old failure | Keep service running; add one safe recheck/reset path for individual items |
| Sale detection | Commit 2cdd38d fixes SKU matching; script is in cron | Git branch has no upstream; local state around repo is dirty | Push/PR clean branch already exists; verify deployed cron runs same file |
| Listing/SOP06 | Strong dry-run tooling exists; many untracked reports/cards | Risk of mixing dry-run evidence with code | Separate reports/data from code branch; keep live listing approval-only |
| Browser URL capture | Scaffold + tests exist; not production live | Captured URL map not reliable as live feed | Operationalise as read-only scheduled capture before consuming as source of truth |
| Value checker | bm-grade-check running on 8011 | Warns, but not full Ronny decision-card workflow | Promote into Trade-in Profit Gate |
| P12 returns | SOP exists; automation not live | Return/relist state can poison listing/sale matching | Build return detection/reset confirmation module next |
| SOP/docs | SOP set exists but master index stale | Agents follow stale docs | Patch docs after code inventory |
| Git control | /home/ricky/builds has 100+ dirty/untracked entries in BM areas | Cannot tell shipped vs draft from Git alone | Create branches by concern and commit/park/archive |

## Branch plan
1. `stabilise/tradein-control-plane-inventory` — reports + SOP index cleanup only.
2. `fix/spec-check-tradein-lookup` — iCloud/spec checker runtime fix and recheck tool.
3. `stabilise/backmarket-live-services` — sale-detection/shipping/grade-check service fixes already live or needed by cron.
4. `feat/p12-returns-automation` — automated return detection/classification/reset confirmation.
5. `feat/tradein-profit-gate` — Ronny/Ricky repair-vs-sell decision card.
6. `feat/browser-url-capture-production` — authenticated read-only frontend URL capture pipeline.

## P12 automation target
P12 should become a service that polls/reads Back Market returns/customer-care, classifies return type, locates original BM Devices item, verifies serial/listing/order lineage, posts a confirmation card, and only then applies Monday reset/move/link mutations. It must preserve one physical device = one BM Devices item.

## First build order
1. Commit/PR control-plane inventory + SOP audit reports.
2. Patch stale SOP master index so agents stop following old truth.
3. Build safe one-item spec recheck command for cases like BM 1624.
4. Build P12 return detector in dry-run mode; no writes until card approval.
5. Wire value/profit gate card before repair spend.

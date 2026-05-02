# Return Refund Relist Invariant - 2026-04-26

## Decision

Ricky confirmed the return/refund relist model:

A returned/refunded Back Market device is not a separate listing path. It re-enters the normal repair/QC/listing path after receipt, but it must remain linked to the same canonical BM Devices item.

## Core invariant

One physical BM device = one canonical BM Devices item.

Each return/refund/repair cycle can create or use a Main Board workflow item, but that Main Board item must link back to the original BM Devices item.

The BM Devices item preserves:

- device identity
- cost/spec history
- original acquisition context
- listing lifecycle history
- sales/order trail where relevant

The Main Board item represents the current operational workflow cycle:

- return received
- inspect
- repair/refurb if required
- QC
- final grade
- To List
- listed/sold/shipped

## Required return/refund flow

1. Customer requests/gets refund and device returns.
2. Locate original BM Devices item by:
   - BM Sales Order ID (`text_mkye7p1c`), or
   - listing ID (`text_mkyd4bx3`), or
   - other verified sale/order evidence if needed.
3. Reset sale/listing-specific fields on the original BM Devices item so stale links do not cause false matching:
   - clear sold-to / buyer fields
   - clear sales order ID when the return lifecycle requires it
   - clear old listing ID before relisting if that listing is no longer the active sale slot
   - move to Returns group while being processed
4. Create or use the Main Board return/repair workflow item.
5. Link that Main Board item back to the original BM Devices item.
6. Device goes through repair/QC like a normal BM device.
7. Once QC passes:
   - final grade is confirmed
   - SKU handoff runs/validates
   - item enters To List
8. SOP 06 listing proposal runs normally.
9. New active listing ID is written back to the same BM Devices item after verified listing.

## Listing rule

Do not list a return/refund item unless all are true:

- Main Board item is linked to the correct original BM Devices item.
- BM Devices item has stale sale/listing fields cleared or intentionally updated.
- Device has passed QC again.
- Final grade is current.
- SKU is generated/validated through QC handoff.
- SOP 06 proposal passes resolver/commercial gates.

## Current queue implication

BM 1541 / Muhab Saed has item name marker `*RTN > REFUND`.

Before it can be listed, verify:

- it is linked to the correct original BM Devices item `11778297586` or correct if this is wrong
- stale sold/order/listing fields are clear
- the current Main Board workflow represents the post-return repair/QC cycle
- QC has passed again

Only after that should it be treated like a normal SOP 06 listing candidate.

## Docs to update

- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`
- `/home/ricky/kb/operations/sop-bm-return.md`
- `/home/ricky/builds/backmarket/sops/05-qc-final-grade.md` if needed
- `/home/ricky/builds/backmarket/sops/06-listing.md` if needed
- `/home/ricky/builds/backmarket/docs/sop-script-issue-log.md`

## Build follow-up

Queue classifier should add a return/refund caution classification or flag, not block all returns blindly.

Suggested field:

- `return_relist_caution: true|false`
- `return_relist_reason: "RTN > REFUND marker; verify original BM Devices linkage and reset before listing"`

This lets SKU backfill continue while preventing premature live listing.

# Back Market Listing SOP/Script Audit First Pass - 2026-04-26

## Scope

Audit existing listing SOPs/scripts in Hugo workspace, main KB, and Back Market build repo after Ricky corrected the objective: list all BMs, not only the one row currently marked safe by the narrow queue script.

No live Back Market, Monday, customer-message, return, warranty, or bulk listing mutations were performed.

## Sources checked

- `/home/ricky/builds/backmarket/sops/06-listing.md`
- `/home/ricky/builds/backmarket/sops/06.5-listings-reconciliation.md`
- `/home/ricky/kb/backmarket/product-id-resolution.md`
- `/home/ricky/kb/operations/sop-bm-sale.md`
- `/home/ricky/.openclaw/agents/backmarket/workspace/docs/sop6-to-list-cards-2026-04-02.md`
- `/home/ricky/.openclaw/agents/backmarket/workspace/memory/2026-04-21-bm-listing-sop6.md`
- `/home/ricky/builds/backmarket/scripts/list-device.js`
- `/home/ricky/builds/backmarket/scripts/current-queue-readonly.js`
- `/home/ricky/builds/backmarket/scripts/lib/monday.js`
- `/home/ricky/builds/backmarket/reports/queue-script-safety-audit-2026-04-25.md`

## Root cause hypothesis

The overnight queue script over-treated BM Devices `text89` as a prerequisite for listing. That is not how SOP 06 works.

SOP 06 and `list-device.js` construct the SKU from BM Device specs plus Main Board final grade/colour, then write SKU to BM Devices `text89` only after successful live listing verification. Therefore, a blank `text89` means the device may still be listable if the underlying specs are present. It should not automatically block the listing proposal stage.

## What the canonical listing flow says

SOP 06 listing trigger:

- Main Board group: `BMs Awaiting Sale` / `new_group88387__1`
- Main Board status column: `status24`
- `To List` index: `8`

Operating model:

- Run one device at a time for live listing.
- Dry-run/proposal first.
- Ricky approves each device before live.
- Live mode must use `--item <mainBoardItemId>`.
- Batch live is disabled.

Required listing data:

- Main Board final grade: `status_2_Mjj4GJNQ`
- Main Board colour: `status8`
- Main Board parts/labour: `lookup_mkx1xzd7`, `formula__1`, `formula_mkx1bjqr`
- BM Devices specs: model, RAM, SSD, CPU, GPU, purchase price, board relation back to Main
- Resolver truth: `data/listings-registry.json` first, then verified `data/bm-catalog.json`

## Important finding: SKU is output, not input

`list-device.js` Step 3 constructs SKU via `constructSku(specs, grade.gradeText)`.

`list-device.js` only writes BM Devices `text89` in `updateMonday()` after published listing verification succeeds.

So the current queue classifier is wrong to say:

```js
if (!sku) return BLOCKED: Missing BM Devices SKU
```

Better classification:

- missing BM Device relation = true blocker
- missing grade/colour/spec fields = blocker
- missing existing `text89` = expected pre-listing state, not blocker
- script should calculate `sku_expected` and classify based on resolver/profitability gates

## Other mismatch found

`/home/ricky/builds/backmarket/scripts/lib/monday.js` defines:

```js
BOARD_RELATION: 'board_relation5'
```

That is risky because recent evidence showed Main Board `board_relation5` links to the generic Devices board, while BM Devices rows link back to Main via `board_relation`.

`list-device.js` itself correctly scans BM Devices and reads `board_relation`, so SOP 06 listing path is probably safer than the shared helper suggests. But shared helper users need review before relying on `BOARD_RELATION`.

## Existing safety model still stands

- Do not run live without `--item`.
- Do not run bulk live listing.
- Do not use `reconcile-listings.js` for quiet discovery until notification behaviour is controlled because dry-run posts Telegram.
- No portal/browser mutation without scoped approval.

## Recommended next audit/fix step

Patch the read-only queue map to follow SOP 06:

1. Query all Main Board `To List` items.
2. Map each to BM Devices using BM Devices `board_relation` back-link.
3. Read full specs and grade/colour/cost fields.
4. Reuse or extract `constructSku()` logic to calculate `sku_expected`.
5. Classify missing `text89` as `NEEDS_SKU_WRITE_AFTER_LISTING`, not `BLOCKED`.
6. Only block when relation/spec/grade/colour/resolver data is missing.

This creates the real all-BM listing worklist before any live action.

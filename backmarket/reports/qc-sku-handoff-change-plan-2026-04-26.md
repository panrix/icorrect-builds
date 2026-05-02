# QC SKU Handoff Change Plan - 2026-04-26

## Decision

Going forward, Back Market SKU generation should move upstream into the QC / repair-complete handoff, instead of being primarily created during the listing flow.

Ricky approved this direction on 2026-04-26.

## Why

SKU is part of the finished device identity, not the commercial listing decision.

A complete Back Market device identity requires:

- model / A-number
- chip
- CPU/GPU variant where relevant
- RAM
- storage
- colour
- final grade

Final grade is only known at QC end, so the correct point to lock the SKU is after QC passes and before the item enters the To List queue.

## Current state

Current SOP 06 / `list-device.js` does this during listing:

1. Reads final grade from Main Board `status_2_Mjj4GJNQ`.
2. Reads BM Devices specs from BM Devices Board `3892194968`.
3. Constructs SKU in `constructSku()`.
4. Uses SKU to resolve listing/product identity.
5. Writes BM Devices `text89` only after successful live listing verification.

This makes listing responsible for both identity completion and commercial publishing.

## Target state

### SOP 05: QC & Final Grade Assignment

At QC pass for a BM device:

1. Confirm final grade.
2. Confirm specs are complete:
   - model / A-number
   - RAM
   - storage
   - CPU
   - GPU
   - colour
3. Generate canonical Back Market SKU.
4. Write SKU to BM Devices `text89`.
5. Move or leave item in the list-ready state only if SKU generation succeeds.

### SOP 06: Listing

Listing should no longer be the first place SKU is created.

It should:

1. Read existing BM Devices `text89`.
2. Recalculate expected SKU from source fields.
3. Compare stored SKU vs expected SKU.
4. If missing or mismatch: block and report a QC/data handoff issue.
5. If matched: continue to resolver, pricing, proposal, approval, and live listing.

## Script changes needed

### 1. Extract shared SKU module

Create a shared module, for example:

- `/home/ricky/builds/backmarket/scripts/lib/sku.js`

Move or mirror the logic from `list-device.js` `constructSku()` into this module.

Exports:

- `constructBmSku(specs, gradeText)`
- normalization helpers for model/chip/RAM/storage/colour
- validation result helper: `validateSku({ storedSku, expectedSku })`

Reason: QC handoff and listing must use the exact same SKU logic.

### 2. Add QC SKU generation script

Create one read/write gated script, for example:

- `/home/ricky/builds/backmarket/scripts/qc-generate-sku.js`

Modes:

- default/dry-run: read Main + BM Devices, calculate expected SKU, report only
- `--write --item <mainBoardItemId>`: write BM Devices `text89` only after all required fields pass

Required gates:

- must use `--item`
- no batch write by default
- no BM API calls
- no listing mutations
- no customer/return/warranty actions
- write only BM Devices `text89`

### 3. Change `list-device.js`

Modify SOP 06 behavior:

- import shared SKU module
- calculate `expectedSku`
- read stored BM Devices `text89`
- if stored SKU missing:
  - dry-run: classify as `BLOCK_QC_SKU_MISSING`
  - live: hard block
- if stored SKU mismatches expected:
  - dry-run: classify as `BLOCK_QC_SKU_MISMATCH`
  - live: hard block
- if matched: proceed

Transitional option:

- keep a temporary `--legacy-construct-sku` or `--repair-missing-sku` flag only for controlled backfill, not normal operations.

### 4. Fix read-only queue map

Update `current-queue-readonly.js` to separate:

- listability blockers
- QC handoff blockers
- commercial blockers

New classifications should include:

- `READY_FOR_LISTING_PROPOSAL`
- `QC_SKU_MISSING`
- `QC_SKU_MISMATCH`
- `MISSING_BM_DEVICE_RELATION`
- `MISSING_FINAL_GRADE`
- `MISSING_SPEC_FIELD`
- `RESOLVER_BLOCKED`
- `COMMERCIAL_REVIEW`

Important: missing `text89` should not mean “not a BM to list”. It means “needs QC SKU completion before listing”.

### 5. Review Monday relationship helper

`/home/ricky/builds/backmarket/scripts/lib/monday.js` currently defines:

```js
BOARD_RELATION: 'board_relation5'
```

Recent evidence shows Main Board `board_relation5` points to generic Devices, while BM Devices rows point back to Main via `board_relation`.

Any helper used for BM Devices mapping should use BM Devices `board_relation` as the authoritative back-link unless fresh Monday evidence proves otherwise.

## Documentation changes needed

### Back Market build repo

Update:

- `/home/ricky/builds/backmarket/sops/05-qc-final-grade.md`
- `/home/ricky/builds/backmarket/sops/06-listing.md`
- `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`
- `/home/ricky/builds/backmarket/docs/sop-script-issue-log.md`

Add:

- this report as implementation plan
- a short migration note once scripts are patched

### Main KB

Update:

- `/home/ricky/kb/operations/qc-workflow.md`
- `/home/ricky/kb/operations/sop-bm-sale.md`
- `/home/ricky/kb/backmarket/product-id-resolution.md` if SKU/resolver boundary wording needs tightening
- `/home/ricky/kb/monday/bm-devices-board.md` after fresh schema verification

## Migration path

### Phase 1: Audit and document

Done first-pass:

- confirmed SKU is currently constructed in listing
- confirmed missing `text89` was wrongly treated as a blocker by the new queue script
- documented this change plan

### Phase 2: Patch safely

Dispatch implementation to Codex:

1. extract shared SKU module
2. add dry-run QC SKU generation script
3. update read-only queue classifier
4. update SOP docs
5. add regression tests around A2338/M2, variable GPU models, colour normalization, and missing SKU classification

No live writes in this phase.

### Phase 3: Backfill proposal

Run dry-run report for all current To List BMs:

- expected SKU
- stored SKU
- missing fields
- readiness classification

Then present Ricky with backfill batch proposal.

### Phase 4: Controlled backfill

Only after approval:

- write SKU for one BM item
- verify Monday field
- if correct, write the remaining approved batch

### Phase 5: Listing proposals

Once SKU handoff is clean:

- run SOP 06 dry-run cards for all ready BMs
- group into:
  - approve to list normally
  - approve clearance with `--min-margin 0`
  - resolver/spec review
  - do not list

## Non-goals for this change

- No Back Market portal login.
- No live listing creation.
- No bulk live listing.
- No customer, warranty, return, or refund actions.
- No automatic grade assignment.

## Open question

Should `qc-generate-sku.js` be triggered automatically when a BM item gets final grade and moves to To List, or stay operator-triggered until the workflow has proven reliable?

Recommendation: operator-triggered first, then automate after a few clean backfills.

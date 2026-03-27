# QA Task: list-device.js (SOP 06)

Important:
- The active file for SOP 06 trust work is `/home/ricky/builds/bm-scripts/list-device.js`.
- `/home/ricky/builds/backmarket/scripts/list-device.js` is a stale copy and line references against it may be misleading.

## Verified Column Reference
Use `backmarket/scripts/VERIFIED-COLUMN-REFERENCE.md` as single source of truth for all column IDs.

## Known Bugs to Fix

### 1. CRITICAL: Wrong parts cost column
Line 217/230: Uses `formula_mkx1bjqr` for parts cost. This is actually **Labour Cost (£)**.
**Fix:** Replace with `lookup_mkx1xzd7` (mirror column, `... on MirrorValue { display_value }`).
Parse: split by comma, sum values. E.g. `"18, 7, 11, 8"` → sum = £44.

Line 217 query needs updating:
```js
// WRONG:
column_values(ids: ["status8", "formula_mkx1bjqr", "formula__1"])
// RIGHT:
column_values(ids: ["status8", "lookup_mkx1xzd7", "formula_mkx1bjqr", "formula__1"])
```

Where:
- `lookup_mkx1xzd7` = Parts Cost (mirror, `MirrorValue { display_value }`, comma-separated, SUM)
- `formula_mkx1bjqr` = Labour Cost £ (formula, `FormulaValue { display_value }`)
- `formula__1` = Labour Hours (formula, `FormulaValue { display_value }`)

### 2. CRITICAL: Safety gate bypass check
Historical concern. Re-verify against the active `bm-scripts/list-device.js`, not the stale copy.
Every safety check must apply in single-item mode too.

### 3. Colour column
Line 217: reads `status8` (Colour) from Main Board. Verified correct.

### 4. `text` column deleted
The `text` column (Model Number) on BM Devices Board was deleted Mar 23. If the script references it, use `lookup` (Device mirror, `MirrorValue { display_value }`) instead.

Check line 241 area for model number references.

### 5. Verify against SOP 06
SOP at: `backmarket/sops/06-listing.md`
The script should follow all steps, especially:
- Step 1: Final Grade hard gate (status_2_Mjj4GJNQ)
- Step 4: product_id lookup
- Step 9: Auto-list DISABLED — all devices go through PROPOSE
- Step 11: Post-listing verification (grade + title + publication_state + quantity)
- Step 12: Monday updates (both boards)

Known current gap:
- colour is still a documented requirement, but the active post-list verification does not yet fully enforce it

### 6. Profitability calculation
Should use real data from profitability lookup (`/home/ricky/builds/data/buyback-profitability-lookup.json`) when available, fall back to per-device costs from Monday.

## Testing
```
node list-device.js --dry-run          # All To List items
node list-device.js --dry-run --item <id>  # Single item
```
Verify: correct parts cost, correct model name, correct grade, correct product_id matching.

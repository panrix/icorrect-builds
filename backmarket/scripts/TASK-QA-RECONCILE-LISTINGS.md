# QA Task: reconcile-listings.js (SOP 6.5)

## Verified Column Reference
Use `backmarket/scripts/VERIFIED-COLUMN-REFERENCE.md` as single source of truth.

## Known Bugs to Fix

### 1. CRITICAL: Wrong parts cost column + missing fragments
Line 267-272: Uses `formula_mkx1bjqr` for parts AND reads via `.text` (not `display_value`).

Two bugs:
- `formula_mkx1bjqr` is Labour Cost £, not parts
- `.text` returns null for formula columns — must use `... on FormulaValue { display_value }`

**Fix line 267:**
```js
// WRONG:
column_values(ids:["formula_mkx1bjqr","formula__1"]) { id text }
// RIGHT:
column_values(ids:["lookup_mkx1xzd7","formula_mkx1bjqr","formula__1"]) { 
  id text 
  ... on MirrorValue { display_value } 
  ... on FormulaValue { display_value } 
}
```

**Fix line 271:**
```js
// WRONG:
const parts = parseFloat(mainItem.column_values.find(cv => cv.id === 'formula_mkx1bjqr')?.text) || 0;
// RIGHT:
const partsRaw = mainItem.column_values.find(cv => cv.id === 'lookup_mkx1xzd7')?.display_value || '0';
const parts = partsRaw.split(',').reduce((sum, v) => sum + (parseFloat(v.trim()) || 0), 0);
const labourCost = parseFloat(mainItem.column_values.find(cv => cv.id === 'formula_mkx1bjqr')?.display_value) || 0;
```

### 2. Labour hours also broken
Line 272: `formula__1` read via `.text` — returns null. Must use `display_value`.

### 3. `text` column deleted
If script references BM Devices Board `text` column (Model Number), replace with `lookup` (Device mirror).

### 4. Safety: no destructive actions without checks
Reconcile can take listings offline. Verify all offline actions have proper guards and logging.

## Testing
```
node reconcile-listings.js --dry-run
```
Verify: parts costs show real values (not £0), labour shows real values, no crashes on mirror/formula columns.

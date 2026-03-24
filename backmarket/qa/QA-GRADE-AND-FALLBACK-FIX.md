# Fix: Grade + Model Name Fallback in Profitability Builder

## Verified against real data: 2026-03-23 10:24 UTC

## Fix 1: Grade is UNKNOWN for all entries

### Problem
Line 404: `const grade = (order.grade || 'UNKNOWN').toUpperCase()`
`order.grade` from BM orders API is always `undefined`. Every entry shows "UNKNOWN".

### Fix
Use `status_2_Mjj4GJNQ` (Final Grade) from Main Board (349212843).
This column is already queried in Step 3 (Main Board cost data fetch).

**Add to the Step 3 query:**
```graphql
column_values(ids: ["lookup_mkx1xzd7", "formula_mkx1bjqr", "status_2_Mjj4GJNQ"]) {
  ... on MirrorValue { display_value }
  ... on FormulaValue { display_value }
  ... on StatusValue { text }
}
```

**Verified values:**
- `status_2_Mjj4GJNQ` returns: "Fair" (index 11), "Good" (index 0), "Excellent" (index 6)
- Tested on BM 1353: "Fair", BM 1400: "Fair", BM 1429: "Fair"

**Map to lookup key:**
- "Fair" → FAIR
- "Good" → GOOD  
- "Excellent" → VERY_GOOD (this is BM's current name for top grade)

Store in `mainItemData[itemId].finalGrade`.

Then in Step 4 (buildLookup), replace:
```js
const grade = (order.grade || 'UNKNOWN').toUpperCase();
```
With:
```js
const grade = (mainData?.finalGrade || 'UNKNOWN').toUpperCase();
```

**Do NOT parse grade from SKU.** Our SKUs use inconsistent grade naming (VGood, Excellent, Fair) that doesn't match BM API values.

## Fix 2: "BM 1175" showing as model name (75 sales)

### Problem
BM 1175 (listing ID 4857996) has no `lookup` (Device) value on Monday because it's an old item.
The script falls back to `item.name` ("BM 1175") instead of using the BM order title.

Line 399: `const modelSource = device.bmDeviceName || order.title;`

This is correct logic BUT `order.title` needs to actually be populated. Check that the BM order's `product` or `title` field is being captured in Step 1.

### Verified BM order data
The orderline has a `product` field with the full BM title, e.g.:
- "MacBook Air 13-inch (2020) - Apple M1 8-core and 7-core GPU - 8GB RAM - SSD 256GB"

This should be stored as `order.title` in Step 1 and used as fallback when Monday's `lookup` is empty.

### Check
Run the script and verify "BM 1175" no longer appears. Those 75 sales should merge into "MacBook Air 13 M1 A2337" (assuming that's what listing 4857996 is).

## Testing
After both fixes, run: `node buyback-profitability-builder.js --compare`

Expected: no "UNKNOWN" grades, no "BM XXXX" model names (except items with genuinely missing data).

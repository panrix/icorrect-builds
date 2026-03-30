# Brief: sent-orders.js Fixes

**Date:** 27 Mar 2026
**From:** Code (orchestrator)
**For:** Codex build agent
**Priority:** HIGH — items arriving with blank/wrong fields on Monday

---

## File to Modify

```
/home/ricky/builds/backmarket/scripts/sent-orders.js
```

This is the canonical tracked copy (510 lines). Runs on cron daily at 06:00 UTC.

Also update the SOP:
```
/home/ricky/builds/backmarket/sops/01-trade-in-purchase.md
```

---

## Fix 1: BM Grade Mapping (CRITICAL)

The BM buyback API sends cosmetic grade values at `listing.grade`. The current script (line 302-308) only maps `FUNC_*` / `NONFUNC_*` values and silently drops everything else. In practice, BM sends cosmetic tier names.

### Current code (line 302-308):

```js
const BM_GRADE_MAP = {
  'FUNC_CRACK': 'FUNC_CRACK', 'FUNC_USED': 'FUNC_USED', 'FUNC_GOOD': 'FUNC_GOOD',
  'FUNC_EXCELLENT': 'FUNC_EXCELLENT', 'NONFUNC_CRACK': 'NONFUNC_CRACK', 'NONFUNC_USED': 'NONFUNC_USED',
};
const rawGrade = extractField(order, 'grade', 'condition', 'listing.grade', 'offer_grade');
const bmGrade = BM_GRADE_MAP[rawGrade] || '';
```

### Replace with:

```js
const BM_GRADE_MAP = {
  // BM cosmetic tiers (what the API actually sends)
  'STALLONE': 'NONFUNC_CRACKED',
  'BRONZE': 'NONFUNC_USED',
  'SILVER': 'FUNC_CRACKED',
  'GOLD': 'FUNC_USED',
  'PLATINUM': 'FUNC_GOOD',
  'DIAMOND': 'FUNC_EXCELLENT',
  // Legacy / direct values (keep for safety)
  'FUNC_CRACK': 'FUNC_CRACKED',
  'FUNC_USED': 'FUNC_USED',
  'FUNC_GOOD': 'FUNC_GOOD',
  'FUNC_EXCELLENT': 'FUNC_EXCELLENT',
  'NONFUNC_CRACK': 'NONFUNC_CRACKED',
  'NONFUNC_USED': 'NONFUNC_USED',
};
const rawGrade = extractField(order, 'listing.grade', 'grade', 'condition', 'offer_grade');
const bmGrade = BM_GRADE_MAP[rawGrade] || '';
if (!bmGrade && rawGrade) {
  console.warn(`  ⚠️ Unknown BM grade: "${rawGrade}" — not mapped. Grade field will be blank.`);
}
```

### Important notes:
- Change the `extractField` order to try `listing.grade` first — that's where it actually lives (confirmed from live SENT orders)
- The Monday board labels use `FUNC_CRACKED` and `NONFUNC_CRACKED` (with the D). The SOP had `FUNC_CRACK` without the D. Check the live board and use the exact label that exists there.
- Log a warning for unknown grades so we catch any new BM values

### Verified from live BM API (27 Mar 2026):
- SENT orders: BRONZE (2), STALLONE (2), SILVER (1)
- RECEIVED orders: DIAMOND (1), STALLONE (1), SILVER (1)

---

## Fix 2: Remove Source Column Write (DONE — confirm)

The SOP says to write `color_mkzmbya2` = "Back Market". The script already doesn't write this (removed in an earlier fix). This is correct — Ricky confirmed Source is not needed at this stage.

**Action:** Update the SOP to remove line 26 (`color_mkzmbya2 | Source | "Back Market"`). The column exists but is not set during trade-in creation.

---

## Fix 3: Order ID Field — Confirm Correct Value

Line 318: `text_mkqy3576: String(orderId)` writes the numeric internal BM order ID.

Ricky confirmed: **`text_mky01vb4` on Main Board should contain the `GB-xxxxx` public ID** (it already does — line 211). BM Devices board now has `lookup_mm1vzeam` which mirrors this value via board relation.

**Action:** Remove the `text_mkqy3576` write from line 318. The column is redundant — `lookup_mm1vzeam` (mirror of Main Board `text_mky01vb4`) now provides the public `GB-xxxxx` ID on BM Devices via board relation. No need to write a separate Order ID column.

---

## Fix 4: Post-Create Verification (MEDIUM)

The script creates items but doesn't verify column values persisted. Monday's `create_item` can silently drop invalid labels.

**Action:** After creating the BM Devices item (line 342), add a verification read:

```js
// Verify critical fields persisted
if (bmDeviceItem) {
  await sleep(1000);
  const verifyQ = `{ items(ids: [${bmDeviceItem.id}]) { column_values(ids: ["text_mkqy3576", "numeric", "color_mm1fj7tb"]) { id text } } }`;
  const verifyResult = await mondayApi(verifyQ);
  const cols = verifyResult.data?.items?.[0]?.column_values || [];
  const missing = [];
  for (const col of cols) {
    if (!col.text || col.text === '') missing.push(col.id);
  }
  if (missing.length > 0) {
    console.warn(`  ⚠️ Post-create check: empty columns: ${missing.join(', ')}`);
  }
}
```

This doesn't block creation — it just warns when columns are blank so we can catch label mismatches.

---

## Fix 5: Update SOP

Update `backmarket/sops/01-trade-in-purchase.md`:

1. Remove `color_mkzmbya2 | Source | "Back Market"` row from the Main Board table
2. Update the Trade-in Grade description to show the BM cosmetic grade mapping:

```
| `color_mm1fj7tb` | Trade-in Grade | BM listing.grade mapped: STALLONE→NONFUNC_CRACKED, BRONZE→NONFUNC_USED, SILVER→FUNC_CRACKED, GOLD→FUNC_USED, PLATINUM→FUNC_GOOD, DIAMOND→FUNC_EXCELLENT |
```

3. Add `lookup_mm1vzeam` to the BM Devices table:

```
| `lookup_mm1vzeam` | BM Trade-in ID (mirror) | Mirror of Main Board text_mky01vb4 via board relation |
```

4. Add `keyboard_layout__1` to the BM Devices table:

```
| `keyboard_layout__1` | Keyboard Layout | Layout from BM listing title (text column) |
```

---

## What NOT to Change

- Do not change the cron schedule (already correct: daily 06:00 UTC)
- Do not change the dedup logic (text_mky01vb4 matching works)
- Do not change the two-board creation + linking flow
- Do not change the Telegram notification
- Do not change the spec extraction from title (parseSpecsFromTitle) — that was recently fixed
- Do not change the `--dry-run` / `--live` / `--order` flags

---

## Verification

After changes:
1. Run `node sent-orders.js --dry-run` — confirm it still detects SENT orders and shows grade mappings
2. Run `node sent-orders.js --order=<one-known-sent-order> --dry-run` — confirm a single order shows the mapped grade correctly
3. Show the diff of all changes
4. Do NOT run `--live` during QA — let the next cron run handle real creation

---

## Acceptance Criteria

1. BM cosmetic grades (STALLONE/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND) all map to Monday labels
2. Unknown grades log a warning instead of silently dropping
3. Post-create verification warns on empty critical columns
4. SOP matches the script behavior
5. `listing.grade` is checked before `grade` in the extractField order

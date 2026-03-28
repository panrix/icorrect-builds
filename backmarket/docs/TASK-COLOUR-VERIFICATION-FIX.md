# Task: Fix Post-Create Colour Verification in SOP 6

**Date:** 2026-03-28
**Priority:** High (blocking all listings where BM title omits colour)
**Script:** `backmarket/scripts/list-device.js`
**SOP:** `backmarket/sops/06-listing.md` (Step 8 verification + Step 11)

---

## Problem

Step 10/11 post-create verification checks whether the device colour appears in the BM listing title. This fails on products where BM's title format does not include colour.

### Example (BM 1353)

- Device: MacBook Pro 13" i5, 8GB/1TB, **Space Grey**, Fair
- Catalog resolution: exact match, `verification_status: verified`, colour confirmed at Step 4
- Product ID: `1e646c25-5397-4ff3-9301-1c9adc23e752`
- BM title returned: `MacBook Pro Retina 13-inch (2020) - Core i5 - 8GB SSD 1000 QWERTY - English`
- Result: `TITLE COLOUR MISMATCH` > listing taken offline

The colour was already verified at Step 4 via catalog lookup. The Step 10 title check is a false failure.

### Impact

Any BM product family where the title format omits colour will fail post-create verification, even when the product_id is correct and colour-verified. This blocks listing creation for those devices.

---

## Root Cause

The post-create verification treats the BM title as the authority for colour. But BM title formatting is inconsistent across product families:

- Some titles include colour: `MacBook Air 13-inch (2022) - Apple M2 - 8GB RAM - SSD 256GB - **Silver** - QWERTY`
- Some titles omit colour: `MacBook Pro Retina 13-inch (2020) - Core i5 - 8GB SSD 1000 QWERTY - English`

The real colour authority is the **product_id** itself. Each product_id in BM's catalog represents a specific model + RAM + SSD + colour combination. If the catalog resolution at Step 4 verified colour, the product_id IS the colour verification.

---

## Fix

### Rule

Post-create colour verification (Step 10 and Step 11) should use a two-tier approach:

| Catalog resolution at Step 4 | Post-create colour check |
|------------------------------|--------------------------|
| `catalog-exact` with colour verified | SKIP title colour check. Colour already proven by product_id. |
| `--product-id` override used | REQUIRE title colour check. Product_id was manually overridden, cannot trust catalog. |
| `verification_status: needs_review` | REQUIRE title colour check. Catalog match is uncertain. |
| `resolution_confidence: market_only` | REQUIRE title colour check. Product not from our history. |

### Implementation

1. The catalog resolution step (Step 4) already sets `resolution` and `colour_verified` flags. Pass these forward to the verification step.

2. In the post-create verification function, add a check before the colour assertion:

```javascript
// Colour title check
if (resolution.colour_verified && resolution.type === 'catalog-exact') {
  // Colour already verified by catalog product_id match at Step 4
  // Skip title colour check — BM titles don't always include colour
  log(`  Colour: ✅ verified by catalog (skipping title check)`);
} else {
  // Colour not verified upstream — must check title
  if (!titleContainsColour(listing.title, expectedColour)) {
    failures.push(`TITLE COLOUR MISMATCH: ...`);
  }
}
```

3. When the colour title check IS required and fails, the behaviour stays the same: leave as draft, alert Telegram, do NOT publish.

4. Log the decision path clearly so QA can see which verification route was taken.

### What NOT to change

- Do NOT remove the colour title check entirely. It is a valid safety net for override and unverified paths.
- Do NOT change any other verification checks (product_id, grade, RAM, SSD, qty, pub_state). They are correct.
- Do NOT change the catalog resolution logic at Step 4. It already works correctly.
- Do NOT change the "take offline on critical mismatch" behaviour. That is correct.

---

## SOP Update

Update Step 8 (Verify Draft Listing) and Step 11 (Verify Published Listing) in `backmarket/sops/06-listing.md`:

Current text for colour verification:
> Title contains correct colour (when known from catalog)

Replace with:
> Colour verification: if catalog resolution was `catalog-exact` with `colour_verified`, colour is proven by product_id and title colour check is skipped (BM titles do not always include colour). If product_id was overridden or catalog status is `needs_review`/`market_only`, title MUST contain correct colour.

---

## Second Issue Found: BM Ignores state=3 on Existing Listing Slots

When the script POSTs a new listing via Path B with `state=3` (draft), BM may return the listing as `pub_state=2` (live) if a previous listing slot with the same product_id already exists.

In the BM 1353 case:
- Script sent state=3 (draft)
- BM returned listing 6505341 with pub_state=2 (live, reactivated the old slot)
- The verification failure then correctly took it offline (qty=0)

### Recommended fix

After Path B creation and task polling, if pub_state is NOT 3:

1. **Immediately set qty=0** before running verification (safety first)
2. Log: `WARNING: BM returned pub_state={X} instead of draft. Setting qty=0 for safe verification.`
3. Run verification as normal
4. If verification passes, proceed to Step 9 (pricing) then Step 10 (publish)

This ensures no listing is ever live without passing verification, even if BM ignores the draft state.

### What NOT to change

- Do NOT assume BM will always respect state=3. Treat pub_state=2 on creation as a known BM behaviour.
- Do NOT skip verification just because BM published it. Verification is mandatory regardless.

---

## Testing

### Test case 1: Catalog-verified colour, BM title omits colour
- Device: BM 1353 (MBP 13" i5, 8GB/1TB, Space Grey, Fair)
- Expected: Step 4 resolves `catalog-exact`, `colour_verified: true`
- Expected: Step 10 skips title colour check, logs "colour verified by catalog"
- Expected: Listing proceeds to pricing and publish

### Test case 2: Product_id override
- Run with `--product-id <uuid>` on any device
- Expected: Step 10 REQUIRES title colour check
- If BM title omits colour: verification fails, listing stays as draft

### Test case 3: BM returns pub_state=2 instead of 3
- May happen on any device that had a previous listing with the same product_id
- Expected: Script sets qty=0 immediately, runs verification, only publishes after passing

### Test case 4: Normal flow (colour in title)
- Device with a product family where BM title includes colour (e.g. MBA M2)
- Expected: Both verification paths work (catalog skip or title check)

---

## Files to Change

1. `backmarket/scripts/list-device.js` — verification function (colour check logic + pub_state safety)
2. `backmarket/sops/06-listing.md` — Steps 8 and 11 wording

---

## Verification

After changes:
1. `node --check scripts/list-device.js` passes
2. Dry-run on BM 1353: shows "colour verified by catalog (skipping title check)"
3. Dry-run on any device: no regression on other verification checks
4. Do NOT live-run without Ricky approval

# Overnight Dispatch Match Fix — 2026-04-25

## Root cause
Current matchByListingId picks the first unshipped BM Devices item for a shared listing_id. That can write tracking to the wrong Main Board item when multiple physical devices share the same BM listing slot.

## Smallest safe fix
1. Fetch the BM Devices Sales Order ID column text_mkye7p1c in matchByListingId.
2. Pass the current BM order_id into matchByListingId from matchToMonday.
3. If multiple unresolved candidates remain, only auto-select when exactly one candidate has Sales Order ID equal to the current order_id.
4. If there is no exact Sales Order ID match, return null and let the existing downstream fallback logic run instead of choosing the first candidate.
5. Add one focused offline test for the selector helper covering single candidate, exact order match, and no-match ambiguity.

## Diff summary
Patched `/home/ricky/builds/royal-mail-automation/dispatch.js` only.

Changes made:
- `matchByListingId(listingId, orderId)` now receives the current BM order ID.
- The BM Devices query now fetches `text_mkye7p1c` (Sales Order ID).
- Candidate rows carry `salesOrderId` into the resolver.
- If multiple unshipped candidates share one listing ID, the script now selects only an exact Sales Order ID match.
- If no exact Sales Order ID match exists, it returns `null` instead of choosing the first candidate, allowing safer fallback matching.

No live BM, Monday, Royal Mail, or Slack calls were made for this fix.

## Verification
- `node -c /home/ricky/builds/royal-mail-automation/dispatch.js` passes.
- Reviewed git diff for `dispatch.js`; scope is limited to matching logic.
- No live dispatch run was performed.

## Remaining risks
- If `sent-orders.js` failed to populate the BM Devices Sales Order ID, the stricter match will fall back instead of auto-selecting. That is safer than writing tracking to the wrong device.
- The fallback buyer/colour matching paths can still be ambiguous in edge cases. Longer-term fix should write a direct BM-order-to-Main-Board link at sale detection time.
- No regression test file was added yet; next pass should extract the candidate-selection rule into a tiny pure helper and test single candidate, exact order match, and no-match ambiguity.

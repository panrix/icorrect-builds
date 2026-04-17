# SOP 12: Returns & Aftercare

**Version:** 1.1
**Date:** 2026-03-20 (initial), 2026-04-17 (interim handoff added)
**Scope:** Buyer returns, wrong device shipped, suspended orders, counter-offer approval flow, and sales aftercare.
**Owner:** Agent + Ferrari/Ricky (manual); Phase 4.9 `backmarket-browser/operations/returns.js` will automate incoming-returns detection + classification (in build)

---

## Interim manual handoff (Phase 0 → Phase 4.9)

Until Phase 4.9 ships, incoming returns are detected manually via BM seller portal CS tab. When a return is logged, the following reset on the **original** BM Devices item (the one that was sold) is required:

1. Locate the original BM Devices item by either:
   - BM Sales Order ID (`text_mkye7p1c`), OR
   - Listing ID (`text_mkyd4bx3`) visible on the return record
2. On that original item, manually:
   - **Clear `text_mkyd4bx3`** (BM Listing ID) — set empty
   - **Clear `text4`** (Sold to) — set empty
   - **Move to the "Returned" group**
3. Create the new Main Board item for the returned device per existing flow below
4. Link the new Main Board item to the original BM Devices item via `board_relation5` so cost history is preserved

**Why:** ISSUE-005 (stale listing_id on BM Devices) causes reconciliation false positives and sale-detection ambiguity. Until Phase 4.9 automates this handoff, doing it manually on every return is the stopgap.

Phase 4.9 automates steps 1-4 by polling the BM seller portal every 6 hours, parsing the return, and posting a Telegram card for Ferrari/Ricky confirmation before applying the Monday mutations. RTN data model: **original BM Devices item is reused** through the full return → QC → relist cycle (preserves cost history, matches Ricky's "one BM item" pattern).

---

## 1. Buyer Return Request

### Trigger
BM notifies us of a buyer return request via:
- BM dashboard notification
- Email notification
- API state change (order enters return flow)

### Flow

1. **Check return reason:** BM provides reason from buyer (defective, not as described, changed mind)
2. **DO NOT cancel the order** (see Section 2 below)
3. **Acknowledge on BM** within their SLA (typically 48h)
4. **Wait for device to be returned physically**
5. When returned:
   - Move BM Devices item to "BM Returns" group:
     ```graphql
     mutation { move_item_to_group(
       item_id: BM_DEVICE_ITEM_ID,
       group_id: "new_group_mkmybfgr"
     ) { id } }
     ```
   - Re-assess device condition (Step 6 below)
6. **Alert BM Telegram** (`-1003888456344`): "📦 Return received: {device} from {buyer}. Reason: {reason}. Awaiting re-assessment."

| Group | ID | Board |
|-------|----|-------|
| BM Returns | `new_group_mkmybfgr` | BM Devices (3892194968) |

---

## 2. Wrong Device Shipped

### ⛔ CRITICAL: DO NOT CANCEL THE ORDER

Cancellation counts against seller score on BM. Every cancellation damages our account standing.

### Flow

1. **Escalate to Ricky immediately** via BM Telegram
2. **Options (Ricky decides):**

| Option | Action | When |
|--------|--------|------|
| Send correct device | Ship the right device + arrange return of wrong one | If correct device is available |
| Partial refund | Negotiate with buyer via BM messaging | If buyer is willing to keep |
| Full return + reship | Accept return, ship correct device | Standard resolution |

3. **Track on Monday:**
   - Add Monday comment documenting the error
   - If replacement shipped: new tracking number in `text53`
   - Original order remains: do NOT create a new order

4. **Root cause:** Document what went wrong (mislabelled, wrong pick, identical devices swapped)

---

## 3. Return Received: Re-assessment

When a returned device arrives back:

1. **Physical inspection:** Check device condition against original sale grade
2. **Re-grade if needed:** Update `status_2_Mjj4GJNQ` (Final Grade) on Main Board if condition changed

   | Column ID | Title | Board |
   |-----------|-------|-------|
   | `status_2_Mjj4GJNQ` | * Final Grade * | Main Board (349212843) |

3. **Decision matrix:**

| Condition | Action |
|-----------|--------|
| Same as when shipped | Relist (SOP 06) at same grade |
| Minor new damage | Relist at lower grade (recalculate profitability) |
| Significant damage | Assess repair cost, relist if profitable, BER if not |
| Buyer fraud (swapped device) | Escalate to Ricky + BM support |

4. **Status updates on Main Board:**
   - If relisting: `status24` → "To List" (index 8)
   - If repair needed first: `status24` → appropriate repair status
   - If BER: `status24` → "BER" (index 13)

5. **Clear buyer data on BM Devices Board:**
   - Clear `text4` (Sold to)
   - Clear `text_mkye7p1c` (BM Sales Order ID)
   - Clear `numeric5` (Sale Price) if relevant

---

## 4. Suspended Sale Orders

### Trigger
BM suspends a sale order (rare). Usually due to:
- Payment processing failure on buyer side
- Fraud detection on buyer account
- BM internal review

### Flow

1. **Do NOT ship the device** while suspended
2. Check BM dashboard / API for suspension reason
3. Alert BM Telegram: "⚠️ Order {order_id} SUSPENDED. Reason: {reason}. Device NOT to be shipped."
4. Wait for BM to resolve (may take 1-5 days)
5. If resolved: proceed with shipping (SOP 09)
6. If cancelled by BM: clear buyer data from Monday, return device to listing flow

### Escalation
- Suspension > 3 days: escalate to Ricky
- BM may require seller support contact

---

## 5. Counter-Offers on Trade-in Side

Counter-offers happen when the device received doesn't match what the customer described (spec mismatch, worse condition, etc.).

### Full Counter-Offer Flow

1. **Detection:** SOP 02 (Intake) or SOP 03 (Diagnostic) identifies mismatch
2. **Assessment:** Calculate value difference between expected and actual device
3. **Decision thresholds (from Hugo's SOP-T4):**

| Scenario | Action |
|----------|--------|
| Device BETTER than expected | Pay out at original price. No counter-offer. |
| Device WORSE, diff < ~£20 | Absorb the loss. Pay out at original price. |
| Device WORSE, diff > ~£20 | Counter-offer. Get Ricky approval first. |
| Completely different model | Counter-offer. Escalate to Ricky. |
| Fraud (misrepresentation) | Counter-offer or reject. Escalate. |

4. **Counter-offer rate MUST stay below 15%.** Exceeding this triggers BM account review.

5. **Monday status:** Set `status24` to "Counteroffer" (index 3) on Main Board

   | Column ID | Value | Index |
   |-----------|-------|-------|
   | `status24` | Counteroffer | 3 |

6. **Prepare counter-offer:**
   - New price (what we're willing to pay)
   - Reason codes (required by BM API)
   - Photo evidence (required by BM API)
   - Comment (optional, max 200 chars)

7. **Ricky Approval (Slack button flow):**

This is implemented in the shared `icloud-checker` service and counter-offer helper logic:
- Slack approval buttons are posted during the counter-offer flow
- Actions include approve, pay original, and adjust price
- Supporting logic lives in `icloud-checker/src/index.js` and `icloud-checker/src/lib/counter-offer.js`

8. **Submit counter-offer:**
   ```
   PUT https://www.backmarket.co.uk/ws/buyback/v2/orders/{orderPublicId}/counter-offers
   Content-Type: multipart/form-data
   Fields:
     price          — new offer price (required)
     reasons[]      — reason codes (required)
     files[]        — photo evidence (required)
     comment        — optional, max 200 chars
   ```

9. **After submission:**
   - Customer has 7 days to accept/reject the counter-offer
   - If accepted: proceed with payout at new price (SOP 03b)
   - If rejected: BM arranges return to customer at customer's expense
   - If no response in 7 days: auto-accepted by BM

10. **Monday updates after resolution:**
    - Accepted: `status24` → "Pay-Out" (index 12), update purchase price on BM Devices Board
    - Rejected: `status24` → appropriate status, prepare for device return

---

## 6. Sales Aftercare API

```
GET/POST https://www.backmarket.co.uk/ws/sav
```

**Status: "Under construction"** per BM API. This endpoint is not yet functional.

When/if BM enables `/ws/sav`:
- It would handle post-sale service requests
- Warranty claims from buyers
- Defect reports after delivery

**Current workaround:** All aftercare is handled via BM dashboard messaging and manual processes.

---

## 7. BM Devices Board Group Moves

| Scenario | Target Group | Group ID |
|----------|-------------|----------|
| Device returned by buyer | BM Returns | `new_group_mkmybfgr` |
| Device shipped to buyer | Shipped | `new_group269` |
| Device ready for sale | BM To List / Listed / Sold | `new_group` |
| New trade-in arriving | BM Trade-Ins | `group_mkq3wkeq` |
| iCloud locked | Rejected / iCloud Locked | (no confirmed ID) |

```graphql
mutation { move_item_to_group(
  item_id: ITEM_ID,
  group_id: "TARGET_GROUP_ID"
) { id } }
```

---

## What Does NOT Happen

- This SOP does NOT handle initial spec validation (that's SOP 02)
- This SOP does NOT handle diagnostics (that's SOP 03)
- This SOP does NOT execute payouts (that's SOP 03b)
- This SOP does NOT create listings (that's SOP 06)
- There is NO automated return detection: BM notifications are currently manual-check
- The `/ws/sav` API is non-functional: no automated aftercare possible
- Returns do NOT auto-trigger relisting: human re-assessment is always required

---

## Error Handling

| Issue | Action |
|-------|--------|
| Counter-offer API fails (4xx) | Check reason codes are valid, photos attached, price > 0. Retry with fixes. |
| Counter-offer API fails (5xx) | Retry after 30s. If persistent, manual submission via BM dashboard. |
| Return received but no BM notification | Check BM dashboard manually. May be customer-initiated outside normal flow. |
| Device returned in worse condition than sold | Document with photos. May need BM support claim. |
| Buyer claims device is different from what was sent | Check serial number records (`text4` / `mirror7__1` on BM Devices). If serial matches, respond to BM with evidence. |

---

## Notifications

All notifications to BM Telegram: `-1003888456344`

| Event | Message |
|-------|---------|
| Return received | "📦 Return received: {device} from {buyer}" |
| Wrong device shipped | "🚨 Wrong device shipped: {details}. Escalating to Ricky." |
| Counter-offer submitted | "💰 Counter-offer submitted: {device} — Original: £{old}, New: £{new}" |
| Counter-offer resolved | "✅/❌ Counter-offer {accepted/rejected}: {device}" |
| Suspended order | "⚠️ Order {id} SUSPENDED" |

---

## Boards & Columns Reference

| Board | ID | Key Columns |
|-------|----|-------------|
| Main Board | 349212843 | `status24` (Repair Type), `status_2_Mjj4GJNQ` (Final Grade), `color_mkyp4jjh` (iCloud) |
| BM Devices Board | 3892194968 | `text4` (Sold to), `text_mkye7p1c` (Sales Order ID), `numeric5` (Sale Price), `lookup_mm1vzeam` (BM Trade-in ID mirror) |

---

## Implementation Location

| Component | Location | Status |
|-----------|----------|--------|
| Counter-offer submission | Manual / agent process | No webhook |
| Return handling | Manual process | No automation |
| Sales aftercare API | `/ws/sav` | Under construction (BM side) |
| Slack button approval | `icloud-checker/src/index.js` + `icloud-checker/src/lib/counter-offer.js` | Exists |
| Notifications | BM Telegram `-1003888456344` | Target channel |

## QA Notes (2026-03-28)

### Findings
1. `PASS` Redundant BM Devices trade-in ID column corrected.
   `text_mkqy3576` is no longer the right reference here. `lookup_mm1vzeam` is the current BM trade-in ID mirror on the BM Devices board.

2. `PASS` Counter-offer rate cap corrected.
   The live `icloud-checker` counter-offer logic uses a 15% rolling cap, not 18%.

3. `PASS` Column IDs are consistent with the rest of the rebuild docs.
   `status24`, `status_2_Mjj4GJNQ`, `color_mkyp4jjh`, `text4`, `text_mkye7p1c`, `numeric5`, and the BM Returns / Shipped group IDs all align with the current SOP set.

4. `PASS` Slack button approval flow documented.
   The counter-offer Slack button flow exists in the `icloud-checker` service and supporting `counter-offer` library; it is no longer an unknown.

5. `PASS` No stale `bm-scripts/` or V6 references found.

### Per-check Summary
1. BM Devices trade-in ID column reference: `PASS`
2. Counter-offer rate cap vs live code: `PASS`
3. Column IDs / status indexes / group IDs: `PASS`
4. Slack button approval-flow documentation: `PASS`
5. Stale references: `PASS`

### Known Operational Limits
- This SOP remains largely manual/agent-driven; there is no dedicated return/aftercare automation service.
- `/ws/sav` is still described as non-functional / under construction on the BM side.
- The counter-offer button flow exists, but returns and aftercare workflows are not yet similarly automated.

### Verdict
SOP 12 is now consistent with the current counter-offer and returns-related documentation. The main remaining gap is implementation breadth, not SOP accuracy.

## Open Build Question (2026-04-02)

### RTN device linking and shipped-state reconciliation

**Problem:**
Returned / resold BM devices (`RTN` items) can break the normal BM Devices ↔ Main Board relationship.
This causes downstream automation failures, especially when scripts rely on the Main Board link for tracking-aware moves or shipped-state reconciliation.

**Observed failure mode:**
- BM Devices RTN item exists and is saleable again
- order is accepted / shipped on BM
- tracking may exist in reality or be posted to BM
- but the linked Main Board item is missing, wrong, incomplete, or newly created without the original device context
- result: housekeeping / reconciliation / dispatch logic cannot reliably move the BM Devices item to `Shipped`

**Why this matters:**
Current housekeeping logic correctly checks the linked Main Board for tracking before moving BM Devices `Sold` items into the BM Devices `Shipped` group. That works for standard sales, but RTN devices can fail this gate because the RTN linking model is not stable.

**Questions to solve in a future build:**
1. What is the canonical relationship for an RTN sale?
   - reuse original Main Board item?
   - create a new Main Board item?
   - preserve original sold history while allowing a clean second-sale state?
2. Where should tracking truth live for RTN sales?
   - Main Board only?
   - BM Devices only?
   - both, with one as source of truth?
3. How should automation identify the correct Main Board item for an RTN device?
   - by board relation?
   - by BM number variant (`BM 421 RTN`)?
   - by original order lineage?
4. What should housekeeping do if a BM Devices RTN item is `Sold` but the linked Main Board item is missing / wrong / incomplete?
   - skip and alert?
   - self-heal the relation?
   - use BM order state as fallback?

**Required future build outcome:**
Design and implement a stable RTN data model so that:
- accepted sale detection,
- dispatch tracking,
- housekeeping group moves,
- and reconciliation
all work without manual intervention for return/resell devices.

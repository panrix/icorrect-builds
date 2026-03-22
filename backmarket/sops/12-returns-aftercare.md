# SOP 12: Returns & Aftercare

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Buyer returns, wrong device shipped, suspended orders, counter-offer approval flow, and sales aftercare.
**Owner:** Agent + Ricky (manual decisions)

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

4. **Counter-offer rate MUST stay below 18%.** Exceeding this triggers BM account review.

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

> **❓ Question for Ricky:** The task mentions a "Slack button approval process" for counter-offers. Is this currently implemented? If so, where is the code? If not, what's the desired flow? Current understanding:
> - Agent presents counter-offer details in Slack
> - Ricky approves/rejects via Slack button or message
> - On approval, agent submits to BM API

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
| BM Devices Board | 3892194968 | `text4` (Sold to), `text_mkye7p1c` (Sales Order ID), `numeric5` (Sale Price), `text_mkqy3576` (Trade-in Order ID) |

---

## Implementation Location

| Component | Location | Status |
|-----------|----------|--------|
| Counter-offer submission | Manual / agent process | No webhook |
| Return handling | Manual process | No automation |
| Sales aftercare API | `/ws/sav` | Under construction (BM side) |
| Slack button approval | Unknown | ❓ Need confirmation from Ricky |
| Notifications | BM Telegram `-1003888456344` | Target channel |

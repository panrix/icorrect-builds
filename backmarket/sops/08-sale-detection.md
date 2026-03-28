# SOP 08: Sale Detection & Acceptance

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Detecting new BM sales orders, matching to inventory, accepting orders, and updating Monday boards.
**Owner:** VPS script (replacement for n8n Flow 6)

---

## Background

This was n8n Flow 6 (`HsDqOaIDwT5DEjCn`), which ran hourly (8-18 weekdays, 9/13/17 weekends).

The VPS replacement now exists at `/home/ricky/builds/backmarket/scripts/sale-detection.js`.

Policy has changed from the old n8n flow:
- old n8n flow: detect/update only, no auto-accept
- current VPS script: auto-accept when match is confirmed and stock is verified

---

## Trigger

Scheduled poll (cron): `GET /ws/orders?state=1` on BM Sales API.

```
GET https://www.backmarket.co.uk/ws/orders?state=1&limit=50
Headers:
  Authorization: $BACKMARKET_API_AUTH
  Accept-Language: en-gb
```

**Schedule:** Every hour during business hours (8-18 UK weekdays, 9/13/17 weekends). Should be more frequent for time-sensitive order acceptance.

**Current live scheduler status:** no active cron entry found for `sale-detection.js` in live crontab as of 2026-03-28.

---

## Step 1: Fetch New Orders

BM order states:
| State | Meaning |
|-------|---------|
| 1 | New (awaiting acceptance) |
| 3 | Accepted (awaiting shipment) |
| 9 | Shipped/complete |

Each order contains `orderlines[]` with one or more line items. Each line item has:
- `listing_id` (numeric): matches to our Monday BM Devices Board
- `product_id`: BM product identifier
- `price`: sale price
- `quantity`: units ordered

---

## Step 2: Match to BM Devices Board

For each `orderlines[].listing_id` (numeric), query BM Devices Board:

```graphql
{ boards(ids: [3892194968]) {
  items_page(limit: 500, query_params: {
    rules: [{ column_id: "text_mkyd4bx3", compare_value: ["{listing_id}"] }]
  }) {
    items { id name group { id title }
      column_values(ids: ["text4", "text_mkye7p1c", "text89", "numeric5"]) { id text }
    }
  }
} }
```

| Column ID | Title | Board | Purpose |
|-----------|-------|-------|---------|
| `text_mkyd4bx3` | BM Listing ID | BM Devices (3892194968) | Numeric listing_id for matching |
| `text4` | Sold to | BM Devices | Buyer name (MUST be empty for assignment) |
| `text_mkye7p1c` | BM Sales Order ID | BM Devices | Real BM order ID |
| `text89` | BackMarket SKU | BM Devices | Cross-check only; not the source used for BM acceptance |
| `numeric5` | Sale Price (ex VAT) | BM Devices | Sale price |

### Match Logic
1. Find all BM Devices items where `text_mkyd4bx3` = `listing_id`
2. For single-unit listings (qty=1): there should be exactly one match
3. For multi-unit listings (qty>1): pick the FIRST item where `text4` (Sold to) is **empty**
4. If NO match found: flag immediately (see Edge Cases)

---

## Step 3: Verify Stock

Before accepting, confirm:
- Device item exists on BM Devices Board with matching listing_id
- `text4` (Sold to) is empty (not already assigned to another buyer)
- Device is in an appropriate group (not in "BM Returns" or "Rejected")

---

## Step 4: Accept Order

⚠️ **Critical: Use `order_id`, NOT `line_item_id`.**

BM dashboard shows two numbers per order:
- **Order number** (top left) = real order ID ✅ USE THIS
- **Order line item details number** = internal reference ❌ NEVER USE

```
POST https://www.backmarket.co.uk/ws/orders/{order_id}
Headers:
  Authorization: $BACKMARKET_API_AUTH
  Accept-Language: en-gb
  Content-Type: application/json
Body: {
  "order_id": {order_id},
  "new_state": 2,
  "sku": "{SKU from orderlines[].listing}"
}
```

`new_state: 2` = accepted. BM then transitions order to state 3 (accepted/awaiting shipment).

**Source of truth for SKU in the live script:** `orderlines[].listing` from the BM order payload, not Monday `text89`.
Monday `text89` is only used as a cross-check warning.

---

## Step 5: Update Monday Boards

### BM Devices Board (3892194968)

```graphql
mutation { change_multiple_column_values(
  board_id: 3892194968,
  item_id: BM_DEVICE_ITEM_ID,
  column_values: "{
    \"text4\": \"BUYER_NAME\",
    \"text_mkye7p1c\": \"ORDER_ID\",
    \"numeric5\": SALE_PRICE
  }"
) { id } }
```

| Column ID | Title | Value |
|-----------|-------|-------|
| `text4` | Sold to | Buyer first + last name from BM order `shipping_address` |
| `text_mkye7p1c` | BM Sales Order ID | `order_id` from BM (NOT line item ID) |
| `numeric5` | Sale Price (ex VAT) | Sale price from `orderlines[].price` |

### Main Board (349212843)

Find linked Main Board item via `board_relation` on BM Devices Board, then:

```graphql
mutation { change_multiple_column_values(
  board_id: 349212843,
  item_id: MAIN_ITEM_ID,
  column_values: "{
    \"status24\": {\"index\": 10},
    \"date_mkq34t04\": {\"date\": \"YYYY-MM-DD\"}
  }"
) { id } }
```

Also rename the Main Board item to the buyer name:
```graphql
mutation { change_simple_column_value(
  board_id: 349212843,
  item_id: MAIN_ITEM_ID,
  column_id: "name",
  value: "BUYER_NAME"
) { id } }
```

| Column ID | Title | Value |
|-----------|-------|-------|
| `status24` | Repair Type | "Sold" (index 10) |
| `date_mkq34t04` | Date Sold (BM) | Today's date (YYYY-MM-DD) |
| `name` | Item Name | Buyer name |

---

## Step 6: Notifications

Send to BM Telegram (`-1003888456344`):

```
🛒 New BM sale accepted!
Device: {device name}
Buyer: {buyer name}
Order: {order_id}
Price: £{sale_price}
```

---

## Edge Cases

### No Match Found (listing_id not on BM Devices Board)
- DO NOT accept the order
- Alert BM Telegram: "⚠️ New BM order {order_id} for listing {listing_id} but NO matching device found on Monday. Manual investigation needed."
- Possible causes: listing was created outside Monday workflow, listing_id column not populated

### Quantity Goes to -1 (Two Simultaneous Checkouts)
This happens when two buyers check out at the same time on a qty=1 listing. BM may accept both orders before decrementing stock.

**Protocol:**
1. DO NOT auto-fill the second order from a random device
2. Search BM Devices Board for next available device matching the same model + spec + grade
3. Prefer device closest to being repair-complete (check `status4` on Main Board via mirror)
4. Alert BM Telegram: "⚠️ Double checkout detected on listing {listing_id}. Second order {order_id} needs manual assignment. Closest match: {device}. Can the team repair this in time?"
5. **Only proceed with explicit team sign-off**

### Multi-Unit Listings (qty > 1)
Multiple physical devices share one listing. When a sale comes in:
1. Find all BM Devices items with matching `text_mkyd4bx3`
2. Assign to the FIRST item where `text4` (Sold to) is **empty**
3. If all items have buyers assigned: treat as stock mismatch (see above)
4. After assigning, verify remaining listing qty on BM matches remaining unassigned devices

### Already Processed Order
If `text4` on the matched BM Devices item is already populated:
- Flow 6 or a previous run already processed this order
- Skip. Do not double-assign.

---

## What Does NOT Happen

- This SOP does NOT handle shipping (that's SOP 09)
- This SOP does NOT buy labels (that's SOP 09)
- This SOP does NOT confirm shipment to BM (that's SOP 09)
- This SOP does NOT create listings (that's SOP 06)
- BM auto-decrements listing qty on sale: we do NOT manually adjust qty here
- This SOP does NOT handle returns (that's SOP 12)

---

## Error Handling

| Error | Action |
|-------|--------|
| BM API down (5xx) | Retry on next poll cycle. Log error. |
| BM order already accepted (4xx) | Log and skip. Check if Monday already updated. |
| Monday API failure | Accept order on BM anyway (financial priority), alert for manual Monday update. |
| Multiple matches for listing_id | Use empty `text4` filter. If ambiguous, flag for manual assignment. |
| Order has multiple line items | Process each line item separately. Each maps to a different listing_id. |

---

## Boards & Columns Reference

| Board | ID | Columns Used |
|-------|----|-------------|
| Main Board | 349212843 | `status24` (index 10 = Sold), `date_mkq34t04` (Date Sold), `name` |
| BM Devices Board | 3892194968 | `text_mkyd4bx3` (Listing ID), `text4` (Sold to), `text_mkye7p1c` (Sales Order ID), `numeric5` (Sale Price), `text89` (SKU) |

---

## Implementation Location

| Component | Location | Status |
|-----------|----------|--------|
| n8n Flow 6 | `HsDqOaIDwT5DEjCn` | Legacy reference |
| VPS script | `/home/ricky/builds/backmarket/scripts/sale-detection.js` | Built |
| Scheduler | Live crontab | No active cron entry found |
| Notifications | BM Telegram `-1003888456344` | Active in script |

## Usage
- `node scripts/sale-detection.js`
  Live mode. Detects, accepts, updates Monday, and sends Telegram notifications.
- `node scripts/sale-detection.js --dry-run`
  Preview mode. Detects and matches orders but does not accept or update Monday. Telegram messages are logged as “would send”.

## QA Notes (2026-03-28)

### Findings
1. `PASS` Implementation status corrected.
   The VPS implementation exists at `/home/ricky/builds/backmarket/scripts/sale-detection.js`. The old “not yet built” wording was stale.

2. `PASS` Auto-accept policy clarified.
   The script already auto-accepts after match and stock verification, so the old unresolved policy question was removed.

3. `PASS` SKU source corrected.
   The live script accepts orders using `orderlines[].listing` from the BM order payload, not Monday `text89`. Monday SKU is only a mismatch warning/cross-check.

4. `PASS` Column IDs match the script.
   Verified reads/writes:
   - BM Devices: `text_mkyd4bx3`, `text4`, `text_mkye7p1c`, `numeric5`, `text89`, `board_relation`
   - Main Board: `status24`, `date_mkq34t04`, `name`

5. `PASS` Live scheduler status clarified.
   The SOP previously described a schedule, but there is currently no active live crontab entry for `sale-detection.js`.

6. `PASS` CLI `--dry-run` documented.

7. `PASS` Notification channel matches the script.
   The live script sends Telegram notifications to `-1003888456344`.

8. `PASS` No V6 references found.

9. `MEDIUM` Schedule remains an operational decision.
   The SOP still contains the desired/legacy schedule description, but the script is not currently scheduled live. This is a deployment gap, not a code mismatch.

### Per-check Summary
1. Implementation status vs script reality: `PASS`
2. Auto-accept policy vs script behavior: `PASS`
3. SKU source vs script behavior: `PASS`
4. Column IDs vs script reads/writes: `PASS`
5. Cron schedule vs live crontab: `PASS` after clarification
6. CLI flags documented: `PASS`
7. Notification channel: `PASS`
8. V6 references: `PASS`

### Known Operational Limits
- There is no active live cron entry for `sale-detection.js`, so the process is built but not currently scheduled.
- The script has Telegram notifications only; it does not send Slack alerts.
- Multi-line orders are processed line-by-line, but the script’s summary is aggregate rather than per-line persistent audit state.

### Verdict
SOP 08 now matches the live `sale-detection.js` script. The remaining gap is operational deployment: the script exists, but no active cron schedule is currently installed.

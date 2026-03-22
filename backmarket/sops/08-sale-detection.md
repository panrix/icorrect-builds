# SOP 08: Sale Detection & Acceptance

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Detecting new BM sales orders, matching to inventory, accepting orders, and updating Monday boards.
**Owner:** VPS script (replacement for n8n Flow 6)

---

## Background

This was n8n Flow 6 (`HsDqOaIDwT5DEjCn`), which ran hourly (8-18 weekdays, 9/13/17 weekends). Flow 6 is still technically active but needs VPS replacement for reliability.

Flow 6 did NOT auto-accept orders. It detected sales and updated Monday. Ricky manually accepted each order.

> **❓ Question for Ricky:** Should the new VPS implementation auto-accept when match is confirmed and stock verified? Or keep manual acceptance? Hugo's SOP-S2 says manual. The task description says "auto-accept if match confirmed."

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
| `text89` | BackMarket SKU | BM Devices | SKU needed for acceptance |
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
  "sku": "{SKU from text89}"
}
```

`new_state: 2` = accepted. BM then transitions order to state 3 (accepted/awaiting shipment).

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
| n8n Flow 6 | `HsDqOaIDwT5DEjCn` | ACTIVE but needs VPS replacement |
| VPS replacement | Not yet built | NEEDED |
| Notifications | BM Telegram `-1003888456344` | Target channel |

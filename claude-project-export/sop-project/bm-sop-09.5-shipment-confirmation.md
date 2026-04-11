# SOP 09.5: Shipment Confirmation to Back Market

**Version:** 1.0
**Date:** 2026-04-02
**Scope:** Notify Back Market that an accepted order has physically shipped, including tracking number and serial number.
**Owner:** `bm-shipping` webhook service (port 8013)

---

## Trigger

Monday webhook on Main Board (`349212843`):
- `status4` (Status) changes to **"Shipped" (index 160)**

Team physically ships the device, then changes `status4` to "Shipped" on Monday. This triggers the webhook.

**Source file:** `/home/ricky/builds/backmarket/services/bm-shipping/index.js`
**Endpoint:** `POST /webhook/bm/shipping-confirmed` → `127.0.0.1:8013` via nginx

---

## Flow

1. **Validate event**
   - `event.columnId === "status4"` (STATUS4_COLUMN)
   - `event.boardId === "349212843"`
   - parsed value index === 160 (`Shipped`)

2. **Identify the exact Main Board item**
   - Part B does not search Monday by name, buyer, or listing ID
   - it starts from the Monday webhook event item itself:
     - `event.itemId`
   - this item on Main Board is the source of truth for shipment confirmation

3. **Dedup check**
   - query last 5 Monday updates
   - if any contain `BM notified`, skip as already processed

4. **Fetch tracking number and linked BM Devices item from Main Board**
   ```graphql
   { items(ids: [ITEM_ID]) {
     column_values(ids: ["text53", "board_relation5", "text4"]) {
       id text
       ... on BoardRelationValue { linked_item_ids }
     }
   } }
   ```

   | Column ID | Title | Purpose |
   |-----------|-------|---------|
   | `text53` | Outbound Tracking | Tracking number (strip spaces) |
   | `board_relation5` | Device | Link to BM Devices Board |
   | `text4` | IMEI/SN | Serial number |

5. **HARD GATE: No tracking number**
   - Slack alert: `⚠️ {itemName} marked Shipped but no tracking number found. Manual BM update needed.`
   - return without notifying BM

6. **HARD GATE: No serial number**
   - Slack + Telegram alert with tracking number
   - return without notifying BM

7. **HARD GATE: No linked BM Devices item**
   - Slack alert with tracking number, but flag for manual BM update
   - return

8. **Fetch BM Sales Order ID from BM Devices Board**
   ```graphql
   { items(ids: [BM_DEVICE_ITEM_ID]) {
     column_values(ids: ["text_mkye7p1c"]) { id text }
   } }
   ```

   | Column ID | Title | Board |
   |-----------|-------|-------|
   | `text_mkye7p1c` | BM Sales Order ID | BM Devices (3892194968) |

9. **HARD GATE: No BM order ID**
   - Slack alert: `⚠️ {itemName} has tracking but no BM order ID. Manual BM update needed.`
   - return

10. **Notify BM of shipment**
   ```
   POST https://www.backmarket.co.uk/ws/orders/{bmOrderId}
   Headers:
     Authorization: $BACKMARKET_API_AUTH
     Content-Type: application/json
   Body: {
     "order_id": "{bmOrderId}",
     "new_state": 3,
     "tracking_number": "{tracking_number}",
     "tracking_url": "https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}",
     "shipper": "Royal Mail Express",
     "serial_number": "{text4 serial}"
   }
   ```

   Notes:
   - tracking number must have spaces stripped before sending
   - serial number is a hard gate in the standalone `bm-shipping` service

11. **After success**
   - Slack + Telegram: `✅ BM notified of shipment: {itemName} - Order {bmOrderId} - Tracking {tracking}`
   - Monday comment:
     ```
     ✅ BM notified of shipment [{timestamp}]
     Tracking: {tracking}
     Order: {bmOrderId}
     ```
   - BM order state transitions: state 3 (our submission) → state 9 (shipped/complete, BM sets this)

12. **Move BM Devices item to Shipped group**
   ```graphql
   mutation { move_item_to_group(
     item_id: BM_DEVICE_ITEM_ID,
     group_id: "new_group269"
   ) { id } }
   ```

   | Group | ID | Board |
   |-------|----|-------|
   | Shipped | `new_group269` | BM Devices (3892194968) |

---

## Error Handling

### BM API Errors

| HTTP Status | Action |
|-------------|--------|
| 2xx | Success: post Slack confirmation + Monday comment |
| 5xx | Retry ONCE after 30 seconds. If retry fails: Slack alert `❌ BM update FAILED`. Manual update needed. |
| 4xx | Do NOT retry. Slack alert with error. Likely causes: order already shipped, order cancelled, invalid tracking. |

### Common Failure Modes

| Failure | Detection | Action |
|---------|-----------|--------|
| No tracking on Main Board | `text53` empty | Webhook alerts Slack, does not notify BM |
| No serial on Main Board | `text4` empty | Webhook alerts Slack + Telegram, does not notify BM |
| No BM Devices link | `board_relation5` empty | Webhook alerts Slack with tracking for manual use |
| No BM order ID | `text_mkye7p1c` empty on BM Devices | Webhook alerts, manual BM update needed |
| BM already notified | `BM notified` in recent Monday updates | Skip (dedup) |
| Wrong tracking format | Spaces in tracking number | Code strips spaces automatically |

---

## Notifications

| Event | Channel | Currently |
|-------|---------|-----------|
| Ship confirmed | Slack BM sales (`C0A21J30M1C`) + BM Telegram (`-1003888456344`) | Active |
| Errors | Slack BM sales (`C0A21J30M1C`) + BM Telegram (`-1003888456344`) | Active |

---

## What Does NOT Happen

- This SOP does NOT buy labels (that is SOP 09)
- This SOP does NOT detect sales (that is SOP 08)
- This SOP does NOT accept orders (that is SOP 08)
- This SOP does NOT handle returns (that is SOP 12)
- This SOP does NOT reconcile payments (that is SOP 10)
- If serial is not available on Main Board (`text4`), the service hard-blocks and alerts instead of notifying BM

---

## Boards & Columns Reference

| Board | ID | Columns Used |
|-------|----|-------------|
| Main Board | 349212843 | `text53` (Outbound Tracking), `text4` (Serial Number), `status4` (Status, index 160 = Shipped), `board_relation5` (link to BM Devices Board) |
| BM Devices Board | 3892194968 | `text_mkye7p1c` (BM Sales Order ID) |

---

## Implementation Locations

| Component | Location | Status |
|-----------|----------|--------|
| Ship confirmation webhook | `/home/ricky/builds/backmarket/services/bm-shipping/index.js` | Live (port 8013) |
| Ship confirmation endpoint | `POST /webhook/bm/shipping-confirmed` → `127.0.0.1:8013` via nginx | Live |
| Monday webhook | Triggers on `status4` column change on board 349212843 | Active |
| n8n Flow 7 | `D4a5qbCtQmSCUIeT` | Legacy/manual reference; current shipping confirmation path is the standalone `bm-shipping` service |

---

## QA Notes (2026-03-28)

### Findings
1. `PASS` Service / port / source alignment corrected to standalone `bm-shipping` on `8013`.
2. `PASS` Trigger clarified as event-driven from Monday `status4 = Shipped`, not cron-driven.
3. `PASS` Lookup path clarified: starts from webhook `itemId`, then reads `text53`, `text4`, and `board_relation5` from that exact Main Board item.
4. `PASS` Hard gates confirmed for missing tracking, missing serial, missing BM Devices link, and missing BM order ID.
5. `PASS` Successful path confirmed: notify BM, comment Monday, alert Slack + Telegram, move BM Devices item to `new_group269`.

### Verdict
SOP 09.5 matches the standalone `bm-shipping` service and should be treated as distinct from label buying.

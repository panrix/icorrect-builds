# SOP 09: Label Buying & Shipping

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** From sale accepted (SOP 08) through to BM shipment confirmed. Two distinct steps: label buying and ship confirmation.
**Owner:** dispatch.js (label buying) + icloud-checker webhook (ship confirmation)

---

## ⚠️ Critical: Label Buying ≠ Ship Confirmation

These are TWO SEPARATE steps. A label purchased does NOT mean the device has shipped. The device must be physically handed to Royal Mail before ship confirmation fires.

| Step | Action | System |
|------|--------|--------|
| 1. Label buying | Purchase Royal Mail label, get tracking number | `dispatch.js` |
| 2. Ship confirmation | Notify BM that device has shipped with tracking | icloud-checker webhook |

---

## Part A: Label Buying (dispatch.js)

### Schedule
- **08:00 GMT:** First batch run
- **13:00 GMT:** Second batch run (follow-up labels posted in thread from 08:00 parent message)

### Execution
`node dispatch.js` (or `node dispatch.js --dry-run` for preview)

**Source file:** `/home/ricky/builds/royal-mail-automation/dispatch.js`

### Flow

1. Fetch pending BM orders from API:
   ```
   GET https://www.backmarket.co.uk/ws/orders?state=3&page_size=50
   Headers:
     Authorization: $BM_AUTH
   ```
   State 3 = accepted, awaiting shipment.

2. Match each order to Monday Main Board (`349212843`) by buyer name / order ID

3. Determine shipping method:
   - Royal Mail: standard UK addresses
   - Courier zone: addresses requiring courier (flagged, not auto-processed)

4. Buy Royal Mail labels via `buyLabels()` function (imported from `./buy-labels.js`)

5. Write tracking numbers to Monday Main Board:
   ```graphql
   mutation { change_multiple_column_values(
     board_id: 349212843,
     item_id: ITEM_ID,
     column_values: "{\"text53\": \"TRACKING_NUMBER\"}"
   ) { id } }
   ```

   | Column ID | Title | Board |
   |-----------|-------|-------|
   | `text53` | Outbound Tracking | Main Board (349212843) |

6. Download BM packaging slips for each order

7. Post dispatch summary to Slack #general (`C024H7518J3`)
   - Message format: "Hi guys, X BMs to ship today. Please find attached labels and packing slips."
   - NO @mentions of team members
   - Combined RM labels PDF uploaded as thread reply
   - Individual BM delivery slips uploaded as thread replies
   - 13:00 GMT follow-up labels go in the same thread as the 08:00 parent message

### What dispatch.js Does NOT Do
- ❌ Does NOT notify BM of shipment (line 755: "BM NOT notified")
- ❌ Does NOT change `status4` on Monday
- ❌ Does NOT move items between groups
- The `updateBmTracking()` function exists in code (line 524) but is **never called**: it's dead code from an earlier version

### ⚠️ Known Issue: Dead Code
`dispatch.js` contains a function `updateBmTracking()` (line 524) that would send `new_state: 3` to BM. This function is defined but **never invoked** anywhere in the current code. It's a remnant from when dispatch.js was intended to also confirm shipment. The current flow correctly separates label buying from ship confirmation.

### Dry Run
```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --dry-run
```
Shows what labels would be purchased without buying them.

### Specific Order
```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --order ORDER_ID
```

---

## Part B: Ship Confirmation (icloud-checker webhook)

### Trigger

Monday webhook on Main Board (`349212843`):
- `status4` (Status) changes to **"Shipped" (index 160)**

Team physically ships the device, then changes `status4` to "Shipped" on Monday. This triggers the webhook.

**Source file:** `/home/ricky/builds/icloud-checker/src/index.js` (line ~1112)
**Endpoint:** `POST /webhook/bm/shipping-confirmed` (port 8002)

### Flow

1. **Validate event:**
   - `event.columnId === "status4"` (STATUS4_COLUMN)
   - `event.boardId === "349212843"`
   - Parsed value index === 160 ("Shipped")

2. **Dedup check:** Query last 5 Monday updates. If any contain "BM notified", skip (already processed).

3. **Fetch tracking number:**
   ```graphql
   { items(ids: [ITEM_ID]) {
     column_values(ids: ["text53", "board_relation5"]) {
       id text
       ... on BoardRelationValue { linked_item_ids }
     }
   } }
   ```

   | Column ID | Title | Purpose |
   |-----------|-------|---------|
   | `text53` | Outbound Tracking | Tracking number (strip spaces) |
   | `board_relation5` | Device | Link to BM Devices Board |

4. **HARD GATE: No tracking number?**
   - Slack alert: "⚠️ {itemName} marked Shipped but no tracking number found. Manual BM update needed."
   - Return without notifying BM

5. **HARD GATE: No linked BM Devices item?**
   - Slack alert with tracking number, but flag for manual BM update
   - Return

6. **Fetch BM Sales Order ID from BM Devices Board:**
   ```graphql
   { items(ids: [BM_DEVICE_ITEM_ID]) {
     column_values(ids: ["text_mkye7p1c"]) { id text }
   } }
   ```

   | Column ID | Title | Board |
   |-----------|-------|-------|
   | `text_mkye7p1c` | BM Sales Order ID | BM Devices (3892194968) |

7. **HARD GATE: No BM order ID?**
   - Slack alert: "⚠️ {itemName} has tracking but no BM order ID. Manual BM update needed."
   - Return

8. **Notify BM of shipment:**
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
     "shipper": "Royal Mail Express"
   }
   ```

   **Note:** Tracking number must have spaces stripped before sending.

9. **After success:**
   - Slack: "✅ BM notified of shipment: {itemName} - Order {bmOrderId} - Tracking {tracking}"
   - Monday comment: "✅ BM notified of shipment [{timestamp}]\nTracking: {tracking}\nOrder: {bmOrderId}"
   - BM order state transitions: state 3 (our submission) → state 9 (shipped/complete, BM sets this)

10. **Move BM Devices item to Shipped group:**
    ```graphql
    mutation { move_item_to_group(
      item_id: BM_DEVICE_ITEM_ID,
      group_id: "new_group269"
    ) { id } }
    ```

    | Group | ID | Board |
    |-------|----|-------|
    | Shipped | `new_group269` | BM Devices (3892194968) |

    > **✅ Resolved (24 Mar 2026):** The new bm-shipping service moves the BM Devices item to Shipped group after successful BM notification. The monolith handler does NOT do this — it is added in the new service.

---

## Error Handling

### BM API Errors (Ship Confirmation)

| HTTP Status | Action |
|-------------|--------|
| 2xx | Success: post Slack confirmation + Monday comment |
| 5xx | Retry ONCE after 30 seconds. If retry fails: Slack alert "❌ BM update FAILED". Manual update needed. |
| 4xx | Do NOT retry. Slack alert with error. Likely causes: order already shipped, order cancelled, invalid tracking. |

### Common Failure Modes

| Failure | Detection | Action |
|---------|-----------|--------|
| No tracking on Monday | `text53` empty | Webhook alerts Slack, does not notify BM |
| No BM Devices link | `board_relation5` empty | Webhook alerts Slack with tracking for manual use |
| No BM order ID | `text_mkye7p1c` empty on BM Devices | Webhook alerts, manual BM update needed |
| BM already notified | "BM notified" in recent Monday updates | Skip (dedup) |
| Wrong tracking format | Spaces in tracking number | Code strips spaces automatically |

---

## Notifications

| Event | Channel | Currently |
|-------|---------|-----------|
| Label bought (dispatch) | Slack (DISPATCH_SLACK_CHANNEL) | Active |
| Ship confirmed | Slack BM sales (`C0A21J30M1C`) + BM Telegram (`-1003888456344`) | Active |
| Errors | Slack BM sales (`C0A21J30M1C`) + BM Telegram (`-1003888456344`) | Active |

---

## What Does NOT Happen

- This SOP does NOT detect sales (that's SOP 08)
- This SOP does NOT accept orders (that's SOP 08)
- This SOP does NOT handle returns (that's SOP 12)
- This SOP does NOT reconcile payments (that's SOP 10)
- Serial number is now sent by the bm-shipping service (port 8013). The monolith handler on 8010 still does NOT send serial.

> **✅ Resolved (24 Mar 2026):** Serial number is included in the ship confirmation payload per locked business rules. The new bm-shipping service (`backmarket/services/bm-shipping/`) sends both serial and tracking. If serial is not available on Main Board (`text4`), the service hard-blocks and alerts instead of notifying BM.

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
| Label buying | `/home/ricky/builds/royal-mail-automation/dispatch.js` | Active, manual run |
| Ship confirmation webhook | `/home/ricky/builds/backmarket/services/bm-shipping/index.js` | Live (port 8013) |
| Ship confirmation endpoint | `POST /webhook/bm/shipping-confirmed` → `127.0.0.1:8013` via nginx | Live |
| Monday webhook | Triggers on `status4` column change on board 349212843 | Active |
| n8n Flow 7 | `D4a5qbCtQmSCUIeT` | Active (manual trigger) |

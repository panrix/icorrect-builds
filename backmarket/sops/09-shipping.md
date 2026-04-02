# SOP 09: Label Buying

**Version:** 1.1
**Date:** 2026-04-02
**Scope:** Purchase Royal Mail labels for accepted BM sales orders and write tracking back to Monday.
**Owner:** `dispatch.js`

---

## ⚠️ Critical: Label Buying ≠ Ship Confirmation

A label purchased does NOT mean the device has shipped. BM shipment confirmation is a separate step handled by **SOP 09.5**.

| Step | Action | System | SOP |
|------|--------|--------|-----|
| 1 | Label buying | `dispatch.js` | 09 |
| 2 | Ship confirmation | `bm-shipping` webhook service | 09.5 |

---

## Schedule
- **07:00 UTC weekdays:** first batch run
- **12:00 UTC weekdays:** second batch run

**Current live scheduler status:** active in live crontab as of 2026-04-01:
- `0 7 * * 1-5` UTC
- `0 12 * * 1-5` UTC

When the UK is on BST, these correspond to 08:00 and 13:00 London local time.

---

## Execution
`node dispatch.js` (or `node dispatch.js --dry-run` for preview)

**Source file:** `/home/ricky/builds/royal-mail-automation/dispatch.js`

---

## Flow

1. **Fetch pending BM orders from API**
   ```
   GET https://www.backmarket.co.uk/ws/orders?state=3&page_size=50
   Headers:
     Authorization: $BM_AUTH
   ```
   State 3 = accepted, awaiting shipment.

2. **Match each order to Monday**
   - priority match via BM Devices Board `text_mkyd4bx3` (`listing_id`)
   - then resolve the Main Board item for tracking writeback

3. **Check Main Board tracking before purchase**
   - Main Board column: `text53`
   - if `text53` already contains a tracking number: **SKIP** the order
   - do not buy a duplicate label just because BM still shows state=3
   - state=3 + existing tracking = already labelled, awaiting physical shipment / BM notification

4. **Determine shipping method**
   - all UK addresses: Royal Mail (no courier path)

5. **Buy Royal Mail labels**
   - via `buyLabels()` imported from `./buy-labels.js`

6. **Write tracking and status to Monday Main Board in one mutation**
   ```graphql
   mutation { change_multiple_column_values(
     board_id: 349212843,
     item_id: ITEM_ID,
     column_values: "{\"text53\": \"TRACKING_NUMBER\", \"status4\": {\"label\": \"Return Booked\"}}"
   ) { id } }
   ```

   | Column ID | Title | Board |
   |-----------|-------|-------|
   | `text53` | Outbound Tracking | Main Board (349212843) |
   | `status4` | Status | Main Board (349212843) |

   Rule:
   - `status4` must only move to `Return Booked` if the same successful mutation also writes `text53`
   - if the Monday writeback fails, the order must not be treated as successfully prepared for shipment confirmation

7. **Download BM packaging slips for successful labels only**
   - orders without a new tracking number are excluded
   - orders with failed Monday writeback are also excluded from the successful downstream path

8. **Post dispatch summary to Slack #general (`C024H7518J3`)**
   - only after all labels are purchased
   - one Slack parent message per run, sent at the end only
   - only includes orders where a label was successfully purchased
   - combined RM labels PDF uploaded as thread reply
   - individual BM delivery slips uploaded as thread replies
   - failed orders are logged to console only
   - follow-up labels can be posted into the same thread via `--thread-ts`

---

## What dispatch.js DOES update on Monday
- ✅ writes `text53` (Outbound Tracking) after successful label purchase
- ✅ sets `status4` to `Return Booked`
- ✅ performs those two writes in the same Monday mutation so `Return Booked` cannot succeed while `text53` stays empty

## What dispatch.js Does NOT Do
- ❌ does NOT notify BM of shipment
- ❌ does NOT move BM Devices items to shipped
- ❌ does NOT confirm physical handoff to Royal Mail

Those actions belong to **SOP 09.5**.

---

## Northern Ireland (BT postcodes)
Royal Mail requires a customs declaration for NI deliveries. The script detects the modal and attempts to complete it, but the item description lookup is an interactive tariff search that cannot be fully automated. If a BT postcode order fails, buy the label manually on send.royalmail.com:
- Content type: Sale of Goods
- Item description: Laptop Computer (use the `Look up item description` search)
- Value: order sale price

---

## Known Issue: Dead Code
`dispatch.js` contains a function `updateBmTracking()` that would send `new_state: 3` to BM. This function is defined but **never invoked** in the current code path. It is dead code from the earlier combined-shipping design.

---

## Dry Run
```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --dry-run
```
Shows what labels would be purchased without buying them.

## Specific Order
```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --order ORDER_ID
```

## Existing Slack Thread
```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --thread-ts SLACK_TS
```
Use this when follow-up labels must be posted into an existing Slack dispatch thread.

---

## Boards & Columns Reference

| Board | ID | Columns Used |
|-------|----|-------------|
| Main Board | 349212843 | `text53` (Outbound Tracking), `status4` (set to Return Booked) |
| BM Devices Board | 3892194968 | `text_mkyd4bx3` (Listing ID, used for matching) |

---

## Implementation Locations

| Component | Location | Status |
|-----------|----------|--------|
| Label buying | `/home/ricky/builds/royal-mail-automation/dispatch.js` | Active, weekday cron |
| n8n Flow 7 | `D4a5qbCtQmSCUIeT` | Legacy/manual reference |

---

## QA Notes (2026-04-02)

### Findings
1. `PASS` Scope narrowed so SOP 09 is now label buying only.
2. `PASS` BM shipment confirmation moved conceptually to SOP 09.5.
3. `PASS` Monday writeback clarified: tracking goes to Main Board `text53`, not BM Devices board.
4. `PASS` Slack thread behavior documented, including `--thread-ts` follow-up usage.
5. `PASS` Dead `updateBmTracking()` path called out explicitly as non-live behavior.

### Verdict
SOP 09 now documents the real dispatch responsibility cleanly: buy labels, write tracking to Monday, and brief the team in Slack. Shipment confirmation lives separately in SOP 09.5.

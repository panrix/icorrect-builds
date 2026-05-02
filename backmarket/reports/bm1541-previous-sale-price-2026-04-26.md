# BM 1541 Previous Sale Price Investigation

Date: `2026-04-26`  
Mode: `READ ONLY ONLY`

## Conclusion

I found the previous sale for the exact returned/refunded BM item linked to:

- Main item: `11778286649`
- BM Devices item: `11778297586`
- Returned item name: `BM 1541 (Muhab Saed) *RTN > REFUND`
- SKU: `MBP.A2338.M1.16GB.512GB.Grey.Good`
- Serial: `FVFFN0QTQ05Q`

The original customer sale appears to be:

- Back Market order id: `78615203`
- Back Market listing id: `6024010`
- Back Market product id: `626770`
- Customer-paid item price: `£518.00`
- Order created: `2026-03-22T02:07:48Z`
- Payment timestamp: `2026-03-22T02:08:37Z`
- Shipped timestamp: `2026-03-23T23:21:11Z`

Confidence: `High`

Why high: the BM orderline matches the exact current returned unit on both `SKU` and `serial_number`, not just the buyer name.

## Evidence Chain

### 1. Live Monday read-only check

Read-only Monday GraphQL for items `11778286649` and `11778297586` showed:

- Main `11778286649` name: `BM 1541 (Muhab Saed) *RTN > REFUND`
- Main serial field `text4`: `FVFFN0QTQ05Q`
- BM Devices `11778297586` name: `BM 1541 RTN`
- BM Devices `11778297586` group: `BM Returns`
- BM Devices back-link `board_relation`: `11778286649`
- BM Devices stored SKU `text89`: `MBP.A2338.M1.16GB.512GB.Grey.Good`
- BM Devices sale/listing trail already cleared:
  - `text4` sold-to: empty
  - `text_mkye7p1c` sales order id: empty
  - `numeric5` sale price: empty
  - `text_mkyd4bx3` listing id: empty

This matches SOP 12 return reset behaviour and explains why the previous sale price is not recoverable from the current Monday columns alone.

### 2. Main item updates confirm return/refund workflow

Read-only Monday updates on Main `11778286649` show the returned-device handling:

- `2026-04-17T13:06:42Z` Ferrari note:
  - current issue: `Key(s) not functioning as expected`
  - `this was delivered today. Please let's assess it and confirm if we can proceed with the refund.`
- `2026-04-17T17:11:01Z` Naheed reply:
  - `we should be good to refund and relist.`
- `2026-04-20T12:43:18Z` Ricky reply:
  - approval to move back to `To List`

This is strong local evidence that `*RTN > REFUND` refers to a real return/refund cycle, not just a naming artifact.

### 3. BM seller orders API exact match

I scanned BM sell-side orders read-only across the valid order states exposed by the endpoint and filtered by:

- customer name `Muhab Saed`
- serial `FVFFN0QTQ05Q`
- SKU/spec `MBP.A2338.M1.16GB.512GB.Grey.Good`

Exact hit found:

- Order id: `78615203`
- Customer: `Muhab Saed`
- Order total: `£518.00`
- Orderline price: `£518.00`
- Listing id: `6024010`
- Product id: `626770`
- Listing string: `MBP.A2338.M1.16GB.512GB.Grey.Good`
- Product title: `MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 16GB RAM - SSD 512GB - QWERTY - English`
- Serial: `FVFFN0QTQ05Q`

This is the exact prior sale of the same physical unit.

## Return / Refund Markers

Markers supporting the return/refund interpretation:

- Main item name includes `*RTN > REFUND`
- BM Devices item is in Monday group `BM Returns`
- Monday notes on `2026-04-17` explicitly discuss proceeding with the refund and relist
- BM Devices sale/listing fields were manually cleared, which matches `sops/12-returns-aftercare.md`
- BM order `78615203` currently shows:
  - order `state: 9`
  - orderline `state: 6`

Caveat: the repo does not contain a definitive local mapping for BM sell-side orderline state `6`, so I am not asserting the exact BM label for that code. I am treating it only as supporting evidence alongside the explicit Monday return/refund notes and the cleared return fields.

## Source Paths / Queries Used

Local sources:

- `/home/ricky/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json`
- `/home/ricky/builds/backmarket/reports/current-queue-readonly-2026-04-26-000638.json`
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`
- `/home/ricky/builds/backmarket/docs/SOP-BM-REPAIRS-RETURNS-2026-04-26.md`

Read-only live queries used:

1. Monday item field check

```graphql
{ items(ids:[11778297586,11778286649]) {
  id name group { id title }
  column_values(ids:[
    "text4","text_mkye7p1c","numeric5","text_mkyd4bx3","text_mm1dt53s",
    "text89","numeric","date_mkq34t04","status24","board_relation","board_relation5",
    "text","lookup","status__1","color2","status7__1","status8__1","status8",
    "status_2_Mjj4GJNQ","creation_log4"
  ]) {
    id text
    ... on MirrorValue { display_value }
    ... on BoardRelationValue { linked_item_ids }
  }
} }
```

2. Monday updates check

```graphql
{ items(ids:[11778286649]) {
  id name
  updates(limit:50) {
    id text_body created_at
    creator { id name }
    replies { id text_body created_at creator { id name } }
  }
} }
```

3. BM orders state scan and exact order fetch

- Scan: `GET /ws/orders?state={0|1|3|8|9}&page={n}&page_size=100`
- Exact order: `GET /ws/orders/78615203`

## Jarvis Paste-Ready

BM 1541 / Muhab Saed previous sale found with high confidence. Exact unit match was recovered from BM seller orders using the same serial `FVFFN0QTQ05Q` and SKU `MBP.A2338.M1.16GB.512GB.Grey.Good`. Original BM order was `78615203`, listing `6024010`, product `626770`, sold for `£518.00`. Sale date was `2026-03-22` (`date_creation 2026-03-22T02:07:48Z`, payment `2026-03-22T02:08:37Z`). Return/refund evidence is strong: Main item is named `*RTN > REFUND`, BM Devices `11778297586` is in `BM Returns`, Monday notes on `2026-04-17` say “proceed with the refund” and “refund and relist”, and the BM Devices sale/listing fields were cleared per SOP 12. Caveat: BM orderline `state: 6` likely reflects the post-sale return/refund lifecycle, but I did not find a definitive local mapping for that numeric code.

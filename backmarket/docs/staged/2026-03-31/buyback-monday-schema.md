# Buyback Monday Schema Notes for Profit Analysis

**Status:** Staged analysis note - not authoritative board mapping
**Last checked against canon:** 2026-03-31

**Canonical note:** Use `/home/ricky/kb/monday/main-board.md`, `/home/ricky/kb/monday/board-relationships.md`, and `/home/ricky/kb/monday/bm-devices-board.md` for the current canonical Monday mapping. This file contains analytical notes and unresolved query-path assumptions only.

## Current Canonical Anchor
```
BM Devices (3892194968)
  → parallel relationship model with iCorrect Main Board (349212843)
  → Main Board links to Parts Board (985177480) via Parts Used / Parts Required
```

Older query experiments also referenced Stock Checkouts (`6267736041`), but that traversal is not part of the current canonical Monday mapping and must be revalidated before reuse.

## BM Devices Board (3892194968)
Common naming pattern observed in reviewed items: `BM 1085` etc. Grouping examples included `Shipped`, `BM Returns`, and similar statuses. Do not use item-name format as the sole join key or identifier.

**Observed fill rates in the reviewed snapshot (approximate only):**
- `text_mkqy3576`: Order ID (85%)
- `text89`: BackMarket SKU (95%) — e.g. "MBA.A2681.8GB.256GB.Silver.Fair"
- `numeric`: Purchase Price ex VAT (90%)
- `numeric5`: Sale Price ex VAT (90%)
- `text8`: Seller name (95%)
- `text4`: Sold to name (95%) in the reviewed snapshot. Canonical BM flow notes still treat this field carefully; do not assume it is always pre-filled.
- `color2`: SSD (100%)
- `status__1`: RAM (100%)
- `status7__1`: CPU (100%)

Validate field presence per item before relying on these percentages in queries or automation.

**Formula columns observed in the snapshot (depend on populated fields):**
- `formula`: Backmarket Fee
- `formula_1`: Gross Profit
- `formula_mm0xekc4`: Net Profit
- `formula7`: Tax
- `formula_mm0za8kh`: Total Costs
- `formula_mkyc2xe3`: Total Labour Cost
- `formula_mm0ykbya`: % Net Profit

**Not observed / often empty in the reviewed snapshot:**
- `text_mkyd4bx3`: Listing UUID column (10%). Canonical BM notes say this field stores the numeric `listing_id`, not a guaranteed UUID payload.
- `text`: Model Number (0%)
- `numeric_mkyha15r`: Shipping (0%)
- No "Original Buyback Grade" column exists

Re-check live schema before treating these fields as absent or permanently empty.

**Possible mirrors from Main Board:** Parts Used, Parts Cost, Repair Time, Grading fields
- These fields may be mirrored from the main board when the relation is populated; handle missing links and empty `linked_items`

## iCorrect Main Board (349212843)
This is the current canonical main-board ID. Older analysis notes used `3428555491`; do not reuse that stale ID.

Common naming pattern observed in reviewed items: `BM 1085 (Customer Name)`.

**Key fields:**
- `service`: Service type (Mail-In)
- `status`: Client (BM)
- `status4`: Status (Shipped, Returned, etc.)
- `status8`: Device Colour
- `text4`: IMEI/SN
- `date4`: Date Received
- `collection_date`: Repaired Date
- `time_tracking98`: Total Time (wall clock, not labour)
- `time_tracking`: Diagnostic Time
- `time_tracking9`: Repair Time
- `time_tracking93`: Refurb Time (column ID from data)
- `person`: Technician

**Grading fields (status columns):**
- `color_mkqg7pea`: Screen Reported
- `color_mkqgtewd`: Screen Actual
- `color_mkqg1c3h`: Casing Reported
- `color_mkqga1mc`: Casing Actual
- `color_mkqg578m`: Function Reported
- `color_mkqgj96q`: Function Actual
- `color_mkqg8ktb`: Liquid Damage
- `status_2_Mjj4GJNQ`: Final Grade
- `color_mkse6rw0`: Repair Grade
- `color_mkse6bhk`: Client Grade

**Parts tracking:**
- `text_mkpp9s3h`: Part needed (text, e.g. "LEDs")
- `color_mkppdv74`: Part stock status
- `ordered_part_from_mkkassja`: Part source (eBay, etc.)

## Stock Checkouts Board (6267736041)
Legacy/unverified analysis path only. This board is not part of the current canonical Monday mapping.

Common naming pattern observed in reviewed items: named by customer.

Older analysis linked this board from Main Board via `connect_boards`, but that traversal should be revalidated before reuse.

Subitems appear to represent part checkout lines; confirm checkout status and cost before treating them as consumed parts.

**Subitem columns:**
- `name`: Part name (e.g. "LCD - Air A2337")
- `text`: Part ID (links to product/inventory item)
- `status0`: Line Checkout Status
- `numbers`: Part Cost
- `date0`: Date

## Part Items (from Product/Inventory)
Example record from the reviewed snapshot: LCD - A2337 (ID: 6220432084)
- `supply_price`: £99 (our cost)
- `quantity`: 4 (stock)
- `status_1`: Active status
- `color_mksntr25`: Category (MacBook)
- `numeric_mm14y3we`: 37 (unknown metric)
- `numeric_mm14qe9r`: 102 (unknown metric)
- `numeric_mm1d7my1`: 70 (unknown metric)

These values are illustrative snapshot data only and should not be treated as defaults or current inventory truth.

# Verified Column Reference — Profitability Builder
# Verified: 2026-03-23 08:20 UTC against real data (not schema guesses)

## BM Devices Board (3892194968)

| Data | Column ID | Type | GraphQL Fragment | Verified Value |
|------|-----------|------|-----------------|----------------|
| Device name | `lookup` | mirror | `... on MirrorValue { display_value }` | "MacBook Pro 14 M1 Pro/Max A2442" |
| RAM | `status__1` | status | `... on StatusValue { text }` | "16GB" |
| SSD | `color2` | status | `... on StatusValue { text }` | "1TB", "256GB" |
| CPU | `status7__1` | status | `... on StatusValue { text }` | "10-Core", "Intel" |
| GPU | `status8__1` | status | `... on StatusValue { text }` | "16-Core", "Intel" |
| Colour | `mirror` | mirror | `... on MirrorValue { display_value }` | "Space Grey", "Rose Gold" |
| BM Listing ID | `text_mkyd4bx3` | text | `... on TextValue { text }` | numeric string |
| UUID | `text_mm1dt53s` | text | `... on TextValue { text }` | UUID string |
| Purchase Price (ex VAT) | `numeric` | numbers | `... on NumbersValue { text }` | "121", "76" |
| Main Item link | `board_relation` | board_relation | `... on BoardRelationValue { linked_item_ids }` | ["9749692700"] |
| Process Status | `color_mks9d2as` | status | `... on StatusValue { text }` | status text |
| Total Fixed Cost | `numeric_mm1mgcgn` | numbers | `... on NumbersValue { text }` | number |

**⚠️ Notes:**
- `lookup` (Device) is NULL on old items (pre ~BM 847). Fall back to item name.
- `mirror` (Colour) is NULL on some items. Fall back to Main Board `status8`.
- `text_mkyd4bx3` (Listing ID) is NULL on old items not yet listed.
- **DELETED columns (do NOT use):** `text` (Model Number) — deleted Mar 23. `formula_mkx13zr7` (Parts Cost formula) — deleted Mar 23.

## Main Board (349212843)

| Data | Column ID | Type | GraphQL Fragment | Verified Value |
|------|-----------|------|-----------------|----------------|
| Parts Cost | `lookup_mkx1xzd7` | mirror | `... on MirrorValue { display_value }` | "18, 7, 11, 8, 29, 55, 47.0" — **comma-separated, SUM them** |
| Labour Cost (£) | `formula_mkx1bjqr` | formula | `... on FormulaValue { display_value }` | "59.258333334" |
| Labour Hours | `formula__1` | formula | `... on FormulaValue { display_value }` | "3.9505555556" |
| Colour | `status8` | status | `... on StatusValue { text }` | "Space Grey", "Midnight" |
| Final Grade | `status_2_Mjj4GJNQ` | status | `... on StatusValue { text index }` | "Fair" (11), "Good" (0), "Excellent" (6) |
| Repair Type / Status | `status24` | status | `... on StatusValue { text index }` | "To List" (8), "Listed" (7), "Sold" (10) |

**⚠️ Parsing rules:**
- `lookup_mkx1xzd7` (Parts Cost): split by `, `, parseFloat each, sum. Returns individual part supply prices.
- `formula_mkx1bjqr` (Labour Cost): parseFloat directly. Returns £ amount.
- `formula__1` (Labour Hours): parseFloat directly. Returns decimal hours.
- All formula/mirror columns: `text` returns null. MUST use `display_value` via typed fragments.

## How to get Main Board item ID from BM Devices Board

1. Query `board_relation` on BM Devices Board item
2. Read `linked_item_ids[0]` — this is the Main Board item ID
3. Query Main Board with that ID for cost columns

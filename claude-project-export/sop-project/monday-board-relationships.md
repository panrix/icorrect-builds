# Monday.com Board Relationships

Status: partially-verified
Last verified: 2026-03-31
Verification method: local Monday schema/audit docs + staged live API schema note
Evidence sources:
- /home/ricky/builds/monday/board-schema.md
- /home/ricky/builds/monday/main-board-column-audit.md
- /home/ricky/builds/monday/board-v2-build-status.md
- /home/ricky/builds/monday/board-v2-manifest.json
- /home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/monday-main-board-schema.md

---

This document is useful as the current relationship model. Main-board schema evidence was refreshed from a 2026-03-31 live API note, but board inventory counts, BM data-chain assumptions, and sync assumptions still need a fresh end-to-end confirmation.

## Board Index

| Board | Board ID | Purpose |
|-------|----------|---------|
| Main Board (iCorrect Main Board) | 349212843 | Primary repair tracking -- all repairs, trade-ins, diagnostics |
| BM Devices Board | 3892194968 | Back Market trade-in device lifecycle |
| Parts Board | 985177480 | Part inventory, stock levels, suppliers |
| Products & Pricing Board | 2477699024 | Repair products and pricing catalogue |
| Custom Products Board | 4570780706 | Ad hoc/custom repair products linked from Main Board |
| Devices Board | 3923707691 (confirmed by the 2026-03-31 live schema note) | Device catalogue |

---

## Cross-Board Relationships

### Main Board (349212843) -> Devices Board
- **Column:** `board_relation5` (Device)
- **Direction:** Main Board item links to a device record
- **Purpose:** Associates a repair job with a specific device model

### Main Board (349212843) -> Products & Pricing Board (2477699024)
- **Column:** `board_relation` (linked board relation)
- **Direction:** Main Board item links to a product/pricing record
- **Purpose:** Connects repairs to standardised products and pricing
- **Known issue:** Shopify IDs on the Products & Pricing board are empty

### Main Board (349212843) -> Custom Products Board (4570780706)
- **Column:** `board_relation0` (Custom Products)
- **Direction:** Main Board item links to custom repair/product records
- **Purpose:** Captures non-standard or ad hoc repair products alongside the main ticket

### Main Board (349212843) -> Parts Board (985177480)
- **Column:** `connect_boards__1` (Parts Used)
- **Direction:** Main Board item links to parts consumed
- **Purpose:** Tracks which parts were used in a repair. Parts deduction automation references this link.

### Main Board (349212843) -> Parts Board (985177480)
- **Column:** `board_relation_mm01yt93` (Parts Required)
- **Direction:** Main Board item links to required parts before they are consumed
- **Purpose:** Tracks planned/sourcing parts separately from the final `Parts Used` relation

### Main Board (349212843) -> Client Information Capture (dynamic target)
- **Column:** `board_relation_mkshr9ah` (Link - Client Information Capture)
- **Direction:** Main Board item links to a client-information board relation whose target is not resolved in the current schema note
- **Purpose:** Pulls mirrored intake/client-information fields back into the Main Board

### Main Board (349212843) <-> BM Devices Board (3892194968)
- **Connection:** Items created in parallel by n8n Flow 0
- **Direction:** Bidirectional via mirror/lookup columns on BM Board
- **Mirror columns on BM Board:** Colour, Grade, Serial, IC Status (read from Main Board)
- **Lookup columns on BM Board:** Overall Grade, Battery Health, Damage, Screen Grade, Casing Grade
- **Matching:** Flow 6 (sales detection) matches BM orders to BM Board items via the numeric listing_id stored in `text_mkyd4bx3`

---

## Data Flow Summary

```
                 Devices Board
                      ^
                      | board_relation5
                      |
Products & Pricing <--+-- Main Board (349212843) --+--> Parts Board (985177480)
   (2477699024)       |    board_relation           |    connect_boards__1 / board_relation_mm01yt93
                      |
Custom Products  <----+---- board_relation0
   (4570780706)       |
                      +-- mirrors/lookups ----------+
                      |
                      v
               BM Devices Board (3892194968)
```

---

## Known Issues

- **Products & Pricing Board (2477699024):** Shopify IDs are empty -- product-to-Shopify mapping is broken
- **Client Information Capture target is still unresolved:** the live schema note confirms the relation exists, but not the fixed target board ID
- **Older audits indicated 47+ total boards** on the Monday.com account at that time -- treat inventory counts as historical until a fresh inventory is run
- **Cross-board sync assumptions are not fully re-verified:** this pass did not confirm any current automated Monday-to-Supabase sync beyond the local integration docs reviewed here
- **Inbox buyback schema note still conflicts with canon:** `kb/inbox/.../buyback-monday-schema.md` references an older main-board ID (`3428555491`) and must not be used for automation mapping until reconciled

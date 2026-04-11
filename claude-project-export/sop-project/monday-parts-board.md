# Monday.com Parts Board

Status: needs-source-verification
Last verified: 2026-03-31
Verification method: older board notes + fresh Monday evidence still required
Evidence sources:
- /home/ricky/builds/monday/board-schema.md
- fresh Parts board export/API pull still required

**Board ID:** 985177480
**Purpose:** Part inventory tracking, stock levels, supplier management

This document mixes schema notes with business/volume claims and should not be treated as current truth until a fresh Parts board export is available.

---

## Key Columns

| Column | Type | Purpose |
|--------|------|---------|
| Name | text | Part name / description |
| Quantity / Stock | number | Current stock level |
| Unit Cost | number | Cost per unit |
| Supplier | text/status | Primary supplier |
| SKU | text | Part SKU identifier |

---

## LCD Inventory (18 items documented)

LCD parts follow a naming convention: `LCD {Model Number}` (e.g., LCD A2337)

### Model Compatibility

| LCD Part | Compatible Device | Notes |
|----------|-------------------|-------|
| LCD A2337 | MacBook Air 13" M1 (2020) | Highest volume -- 0.66/day usage |
| LCD A2338 | MacBook Pro 13" M1/M2 (2020-2022) | |
| LCD A2442 | MacBook Pro 14" M1 Pro/Max (2021) | |
| LCD A2485 | MacBook Pro 16" M1 Pro/Max (2021) | |
| LCD A2681 | MacBook Air 13" M2 (2022) | |
| LCD A2779 | MacBook Pro 14" M2 Pro/Max (2023) | |
| LCD A2780 | MacBook Pro 16" M2 Pro/Max (2023) | |
| LCD A1932 | MacBook Air 13" (2018-2019) | T-con compatible with A2337 |
| LCD A2179 | MacBook Air 13" (2020 Intel) | T-con compatible with A2337 |
| LCD A2251 | MacBook Pro 13" (2020 Intel) | T-con compatible with A2338 |
| LCD A2289 | MacBook Pro 13" (2020 Intel) | T-con compatible with A2338 |

### T-con Swap Compatibility Table

iCorrect refurbishes screens by swapping T-con boards between compatible models:

| Donor LCD Model | Can Replace | Swap Required |
|-----------------|-------------|---------------|
| A1932 / A2179 | A2337 (M1 Air) | T-con board swap |
| A2251 / A2289 | A2338 (M1 Pro 13") | T-con board swap |

This allows using cheaper Intel-era screens as donors for Apple Silicon models.

---

## Top Suppliers

| Supplier | Origin | Share | Notes |
|----------|--------|-------|-------|
| Nancy | China | ~35% | Primary for LCDs. Bulk shipments. |
| MobileSentrix UK | UK | ~15% | |
| CPU Technology | UK | ~14% | |
| Laptop Power NW | UK | -- | Poor-grade screens for refurb (GBP 25-45/unit) |

---

## Highest Volume Parts

| Part | Usage Rate | Notes |
|------|-----------|-------|
| LCD A2337 (M1 Air) | 0.66/day | Highest demand |
| Battery A1965 | 0.27/day | MacBook Pro 13" 2018-2019 |

---

## LCD Naming Convention

Format: `LCD {Apple Model Number}`

The model number (e.g., A2337) identifies both the part and the compatible device. When ordering or referencing parts, always use the Apple model number.

---

## Known Gaps

- Full column schema not yet pulled via API -- only key columns documented
- Stock levels need live verification against board
- Supplier lead times not tracked in Monday
- No automated reorder triggers
- Parts deduction automation references this board from Main Board via `connect_boards__1`

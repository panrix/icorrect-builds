# Monday.com BM Devices Board

Status: needs-source-verification
Last verified: 2026-03-31
Verification method: older board docs + fresh Monday evidence still required
Evidence sources:
- /home/ricky/builds/monday/board-schema.md
- /home/ricky/builds/backmarket/docs/VERIFIED-COLUMN-REFERENCE.md
- fresh Monday export/API pull still required

**Board ID:** 3892194968
**Purpose:** Tracks Back Market trade-in devices through the BM lifecycle (receiving, listing, selling, shipping)

This document should not be treated as current schema truth until it is checked against a fresh Monday export or API pull.

---

## Groups

| Group Name | Group ID | Purpose |
|------------|----------|---------|
| BM To List / Listed / Sold | `new_group` | Active BM lifecycle items |
| BM Trade-Ins | `group_mkq3wkeq` | Incoming trade-in devices |
| BM Returns | `new_group_mkmybfgr` | Returned/defective BM items |
| Shipped | `new_group269` | Shipped to buyer |
| Devices to Refurbish | -- | Pending refurbishment |
| Rejected / iCloud Locked | -- | Devices that cannot be processed |
| TigerTech | -- | TigerTech partner items |
| MTR | -- | MTR partner items |
| Repair Board | -- | Cross-referenced repair items |
| Old BMs | -- | Legacy/archived items |

---

## Key Columns

| Column ID | Column Name | Type | Notes |
|-----------|-------------|------|-------|
| `text_mkyd4bx3` | Listing UUID | text | Must contain numeric listing_id for Flow 6 sales matching |
| `text4` | Sold To | text | Buyer name -- must be EMPTY for Flow 6 to assign |
| `text_mkye7p1c` | Sales Order ID | text | Real BM order ID (not line item ID) |
| `text89` | SKU | text | Device SKU |
| `text_mkqy3576` | BM Order ID | text | Trade-in order public ID (e.g. GB-26081-WJLEO) |
| `status__1` | RAM | status | index 11 = 8GB, index 1 = 16GB |
| `status7__1` | CPU | status | 0=10-Core, 3=12-Core, 6=11-Core, 11=8-Core, 15=Intel |
| `status8__1` | GPU | status | GPU core count |
| `color2` | Storage | status | Storage capacity |
| `mirror` | Colour | mirror | Read-only mirror from Main Board |
| `mirror_Mjj4H2hl` | Grade | mirror | Read-only mirror from Main Board |
| `mirror3__1` | IC Status | mirror | BM listing status: IC ON / IC OFF |
| `mirror7__1` | Serial | mirror | Serial from Main Board |
| `lookup_mkqg4gr8` | Overall Grade | lookup | Physical condition assessment |
| `lookup_mkqgb1te` | Battery Health | lookup | Battery health data |
| `lookup_mkqgkkpg` | Damage | lookup | Damaged / None |
| `lookup_mkqg1q79` | Screen Grade | lookup | Screen condition grade |
| `lookup_mkqgq791` | Casing Grade | lookup | Casing condition grade |

### Additional Columns (from board schema)
- BM Number
- Customer Name
- Device Model
- Colour
- Grade
- RAM
- Storage
- Purchase Price
- Sale Price
- BM Fee
- Profit
- SKU
- Status
- Order Number
- Buyer Name

---

## Relationship to Main Board

- Items on the BM Board are created by n8n Flow 0 alongside corresponding items on Main Board (349212843)
- Mirror columns pull data from the Main Board (colour, grade, serial)
- Lookup columns reference grading data
- Flow 6 (hourly sales detection) matches BM orders to this board via the listing_id in the UUID column

---

## Key Operational Notes

- The `text_mkyd4bx3` (Listing UUID) column must contain the **numeric listing_id** (not the full UUID) for Flow 6 sales matching to work
- The `text4` (Sold To) column must be **empty** for Flow 6 to assign the buyer name
- BM Board is the definitive source for device specs (not the Main Board)
- Sales Order ID must contain the real BM order ID, not the line item ID

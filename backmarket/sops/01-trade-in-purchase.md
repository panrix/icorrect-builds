# SOP 1: Trade-in Purchase

## Overview
Customer sells a MacBook to iCorrect via Back Market's buyback platform. When the customer ships the device, BM sets the order status to SENT. We detect SENT orders and create tracking items on Monday.

## Trigger
- BM API: buyback order status = `SENT` (customer has physically shipped the device)
- Our VPS script polls `GET /ws/buyback/v1/orders?status=SENT` on schedule

## Flow

### Step 1: Detect new SENT orders
- Script polls BM API for orders with status SENT
- De-duplicates against existing Monday items (match on BM order public ID via `text_mky01vb4` on Main Board)
- New orders proceed to Step 2

### Step 2: Create Monday items
For each new order, create two linked items:

**Main Board item** (board `349212843`, group `new_group34198` "Incoming Future"):

| Column ID | Title | Value Source |
|-----------|-------|-------------|
| `text_mky01vb4` | BM Trade-in ID | BM order public ID |
| `date_mkqgbbtp` | Date Purchased (BM) | BM order date |
| `text796` | Inbound Tracking | Royal Mail tracking from BM order |
| `status4` | Status | Initial status |

**BM Devices Board item** (board `3892194968`, group `group_mkq3wkeq` "BM Trade-Ins"):

| Column ID | Title | Value Source |
|-----------|-------|-------------|
| `board_relation` | Main Item | Link to Main Board item created above |
| `lookup_mm1vzeam` | BM Trade-in ID (mirror) | Mirror of Main Board `text_mky01vb4` via board relation |
| `text8` | Seller | Customer name from BM order |
| `text81` | Reported Damage / Fault | Customer's description |
| `numeric` | Purchase Price (ex VAT) | What we pay the customer |
| `color_mm1fj7tb` | Trade-in Grade | BM `listing.grade` mapped: STALLONE→NONFUNC_CRACKED, BRONZE→NONFUNC_USED, SILVER→FUNC_CRACKED, GOLD→FUNC_USED, PLATINUM→FUNC_GOOD, DIAMOND→FUNC_EXCELLENT |
| `color2` | SSD | Storage spec from BM order |
| `status__1` | RAM | RAM spec from BM order |
| `status7__1` | CPU | Processor from BM order |
| `status8__1` | GPU | GPU from BM order |
| `keyboard_layout__1` | Keyboard Layout | Layout from BM listing title (text column) |

### Step 3: Done
Items exist on both boards, linked together. Device is in transit. Next step is physical receiving (SOP 2).

## What does NOT happen at this stage
- No accept/reject decision (device is already shipped)
- No pricing decisions
- No counter-offers
- No iCloud check
- No grading

## BM API
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/buyback/v1/orders?status=SENT` | GET | List shipped trade-in orders |
| `/ws/buyback/v1/orders/{orderPublicId}` | GET | Get single order details |

## Error handling
- **API down:** Retry on next poll cycle. Log error.
- **Duplicate order:** Skip if BM order ID already exists on Main Board (`text_mky01vb4`).
- **Missing fields:** Create item anyway with available data. Log warning for missing fields.
- **Board relation fails:** Log error. Item created but unlinked. Flag for manual fix.

## Boards & Groups
| Board | ID | Group | Group ID |
|-------|----|-------|----------|
| Main Board | 349212843 | Incoming Future | new_group34198 |
| BM Devices Board | 3892194968 | BM Trade-Ins | group_mkq3wkeq |

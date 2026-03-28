# SOP 1: Trade-in Purchase

## Overview
Customer sells a MacBook to iCorrect via Back Market's buyback platform. When the customer ships the device, BM sets the order status to SENT. We detect SENT orders and create tracking items on Monday.

## Usage
- `node scripts/sent-orders.js`
  Dry run by default. Fetches SENT orders, de-duplicates against Monday, and shows what would be created.
- `node scripts/sent-orders.js --dry-run`
  Explicit preview mode. No Monday writes or Telegram sends.
- `node scripts/sent-orders.js --live`
  Creates Monday items, links them, verifies BM Devices core fields, and sends Telegram notifications.
- `node scripts/sent-orders.js --order=GB-xxxxx`
  Process one specific BM trade-in order instead of polling all SENT orders. Can be combined with `--dry-run` or `--live`.

## Trigger
- BM API: buyback order status = `SENT` (customer has physically shipped the device)
- Our VPS script polls `GET /ws/buyback/v1/orders?status=SENT` on schedule
- Current cron schedule: daily at `06:00 UTC`

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

**BM Devices Board item** (board `3892194968`, group `group_mkq3wkeq` "BM Trade-Ins"):

| Column ID | Title | Value Source |
|-----------|-------|-------------|
| `board_relation` | Main Item | Link to Main Board item created above |
| `lookup_mm1vzeam` | BM Trade-in ID (mirror) | Mirror of Main Board `text_mky01vb4` via board relation |
| `text8` | Seller | Customer name from BM order |
| `text81` | Reported Damage / Fault | Customer's description |
| `numeric` | Purchase Price (ex VAT) | What we pay the customer |
| `color_mm1fj7tb` | Trade-in Grade | BM `listing.grade` mapped: STALLONE→NONFUNC_CRACKED, BRONZE→NONFUNC_USED, SILVER→FUNC_CRACKED, GOLD→FUNC_USED, PLATINUM→FUNC_GOOD, DIAMOND→FUNC_EXCELLENT |
| `color2` | SSD | Parsed from BM `listing.title`; fallback to SKU if title parse is incomplete |
| `status__1` | RAM | Parsed from BM `listing.title`; fallback to SKU if title parse is incomplete |
| `status7__1` | CPU | Parsed from BM `listing.title` |
| `status8__1` | GPU | Parsed from BM `listing.title` |
| `keyboard_layout__1` | Keyboard Layout | Layout from BM listing title (text column) |

### Step 3: Post-create verification
- After BM Devices item creation, the script re-reads the new item and checks:
  - `numeric`
  - `color_mm1fj7tb`
- If either is empty, the run logs a warning for manual review.

### Step 4: Link the two items
- BM Devices `board_relation` is set to the newly created Main Board item.
- If the board relation write fails, both items remain created but unlinked and the run sends a Telegram alert for manual repair.

### Step 5: Telegram notifications
- Per-device success notification after both items are created
- Error alerts for:
  - Main Board created but BM Devices creation failed
  - Board relation failed after both items were created
- Run summary after completion in live mode

### Step 6: Done
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
- **API down on bulk poll:** Script exits with error and sends Telegram alert.
- **API down on specific `--order` lookup:** That order logs an error and the run continues to the next supplied order.
- **Duplicate order:** Skip if BM order ID already exists on Main Board (`text_mky01vb4`).
- **Missing fields:** Create item anyway with available data. Log warning for missing fields.
- **BM Devices create fails after Main Board create:** Main item remains created, Telegram alert sent, manual fix required.
- **Board relation fails:** Log error. Items created but unlinked. Telegram alert sent for manual fix.
- **Post-create verification warning:** Logs warning if `numeric` or `color_mm1fj7tb` is blank on the created BM Devices item.

## Boards & Groups
| Board | ID | Group | Group ID |
|-------|----|-------|----------|
| Main Board | 349212843 | Incoming Future | new_group34198 |
| BM Devices Board | 3892194968 | BM Trade-Ins | group_mkq3wkeq |

## QA Notes (2026-03-28)

### Findings
1. `PASS` Unsupported `status4` write removed from the SOP.
   The script does not write `status4` on Main Board, so it should not appear in the column table.

2. `PASS` CLI usage now documented.
   The SOP now covers default dry-run behavior, `--live`, and `--order=GB-xxxxx`.

3. `PASS` Post-create verification documented.
   The SOP now reflects `verifyBmDevicesItem()` checking `numeric` and `color_mm1fj7tb`.

4. `PASS` Telegram notifications documented.
   The SOP now matches per-device success messages, error alerts, and live run summary behavior.

5. `PASS` Spec source corrected.
   RAM/SSD/CPU/GPU are parsed from `listing.title`, with SKU fallback only for RAM/SSD.

6. `PASS` Cron schedule documented.
   Current schedule recorded as daily `06:00 UTC`.

### Per-check Summary
1. SOP flow vs script flow: `PASS`
2. Column IDs vs script writes: `PASS`
3. Error handling vs script behavior: `PASS`
4. Stale references / deleted columns / old logic: `PASS`

### Known Operational Limits
- No explicit Monday status write happens on Main Board in this SOP.
- BM Devices post-create verification only checks `numeric` and `color_mm1fj7tb`, not every populated column.
- In dry-run mode, Telegram messages are logged as “would send” only.

### Verdict
SOP 01 now matches `sent-orders.js` closely enough to hand to an agent without the earlier documentation gaps.

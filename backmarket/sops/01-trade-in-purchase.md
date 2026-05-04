# SOP 1: Trade-in Purchase

## Overview
When a Back Market buyback order reaches `SENT`, `scripts/sent-orders.js` creates one linked item on the Main Board and one linked item on the BM Devices Board.

The rebuilt script does four things before it writes to Monday:
- fetches the BM order detail
- downloads the packing slip PDF and extracts text with `pdftotext -layout`
- parses customer / assessment fields from the PDF
- parses specs from `listing.title` with RAM / SSD fallback from the SKU

## Usage
- `node scripts/sent-orders.js`
  Default mode is dry-run. The script fetches orders, prepares Monday payloads, and logs what it would create.
- `node scripts/sent-orders.js --dry-run`
  Explicit dry-run. Same behavior as the default mode.
- `node scripts/sent-orders.js --live`
  Live mode. Creates Monday items, verifies core BM Devices fields, links the items, and sends Telegram notifications.
- `node scripts/sent-orders.js --order=GB-xxxxx`
  Fetch one specific order instead of polling all `SENT` orders.
- `node scripts/sent-orders.js --order=GB-xxxxx --order=GB-yyyyy --live`
  Multiple `--order=` flags are supported.

Notes:
- Any run without `--live` stays in dry-run mode.
- If `--live` and `--dry-run` are both supplied, `--live` wins because dry-run is derived from `!isLive`.

## Trigger
- BM API status: `SENT`
- Poll endpoint: `GET /ws/buyback/v1/orders?status=SENT`
- Specific order endpoint: `GET /ws/buyback/v1/orders/{orderPublicId}`
- Current cron schedule: daily at `06:00 UTC`

## Boards & Groups
| Board | ID | Group | Group ID |
|-------|----|-------|----------|
| Main Board | `349212843` | Incoming Future | `new_group34198` |
| BM Devices Board | `3892194968` | BM Trade-Ins | `group_mkq3wkeq` |
| Device Lookup Board | `3923707691` | default lookup group | `new_group` |

## Flow

### Step 1: Fetch orders
- Bulk mode calls `GET /ws/buyback/v1/orders?status=SENT`
- Specific-order mode calls `GET /ws/buyback/v1/orders/{orderPublicId}` for each `--order=...`
- Bulk fetch failure exits the run and sends a Telegram alert
- Specific-order fetch failure logs the error and continues to the next supplied order

### Step 2: De-duplicate and allocate BM numbers
- De-dup uses Main Board column `text_mky01vb4`
- Existing IDs are read from Main Board `349212843`
- BM numbering reads the highest `BM {number}` item name from BM Devices group `group_mkq3wkeq`
- The next BM number increments once per prepared non-duplicate order in the current batch
- Actual item names created by the script are:
  - BM Devices: `BM {number}`
  - Main Board: `BM {number} ( {customerName} )`

### Step 3: Prepare payload data
- If the summary order object does not already include `transferCertificateLink`, the script fetches the full order detail first
- The script downloads `transferCertificateLink`, writes it to a temp file, and extracts text with `pdftotext -layout`
- Customer name is parsed from the PDF `I, {name}, agree to sell` line, with API fallback
- Assessment fields parsed from the PDF:
  - `Battery - ...`
  - `Screen - ...`
  - `Casing - ...`
  - `Functional - ...`
- The script does not parse the device title from the PDF body; it uses `orderDetail.listing.title`
- Price is written ex VAT as `Math.round(rawPrice / 1.1)`
- `rawPrice` comes from `extractPrice()`, which prefers `originalPrice.value` and then falls back to other price-like fields if needed

### Step 4: Parse specs and match device
- Title parsing expects the BM listing title to be split by ` - `
- Parsed fields:
  - CPU from title segment 2
  - RAM from title segment 3
  - SSD from title segment 4
  - GPU from title segment 5
  - keyboard layout from title segment 6
- RAM / SSD fallback to the listing SKU only if title parsing did not produce them
- SSD normalization:
  - `1000GB -> 1TB`
  - `2000GB -> 2TB`
  - `4000GB -> 4TB`
- BM model lookup uses `BM_TO_DEVICE_MAP`
- Device lookup then queries Device Lookup Board `3923707691`, group `new_group`, and matches by exact Monday item name
- CPU detection rules:
  - Intel titles use the detected Intel value already parsed from the title path in the script
  - non-Pro/Max Apple silicon defaults to `8-Core`
  - Pro/Max models use `GPU_TO_CPU_MAP`
  - Pro/Max fallback defaults are `10-Core` for M1 and `12-Core` for M2/M3/M4

### Step 5: Create Main Board item
Board: `349212843`
Group: `new_group34198`

| Column ID | Value written by script |
|-----------|-------------------------|
| `text_mky01vb4` | BM order public ID |
| `text5` | customer name |
| `numbers` | ex VAT price |
| `text796` | tracking number |
| `link1` | `{ "url": pdfLink, "text": "Packing Slip" }` when a PDF link exists |
| `status` | `{ "label": "BM" }` |
| `service` | `{ "label": "Mail-In" }` |
| `status4` | `{ "label": "Expecting Device" }` |
| `status24` | `{ "label": "Diagnostic" }` |
| `color_mkypbg6z` | `{ "label": "Trade-in" }` |
| `color_mkyp4jjh` | `{ "label": "Unknown" }` |
| `color_mkqg66bx` | battery assessment label |
| `color_mkqg7pea` | screen assessment label |
| `color_mkqg1c3h` | casing assessment label |
| `color_mkqg578m` | functional assessment label |
| `color_mkxga4sk` | keyboard layout label |
| `status9` | keyboard layout label duplicate |
| `status_1` | RAM label |
| `status_15` | normalized SSD label |
| `status7` | GPU label |
| `date_mkqgbbtp` | `{ "date": orderDate }` when an order date is available |
| `board_relation5` | `{ "item_ids": [deviceItemId] }` when a matching device item is found |
| `dropdown` | `{ "labels": [cpuValue] }` when CPU detection returns a value |

### Step 6: Create BM Devices item
Board: `3892194968`
Group: `group_mkq3wkeq`

| Column ID | Value written by script |
|-----------|-------------------------|
| `text_mkqy3576` | BM order public ID |
| `text8` | customer name |
| `numeric` | ex VAT price |
| `text0` | tracking number |
| `link` | `{ "url": pdfLink, "text": "Packing Slip" }` when a PDF link exists |
| `text81` | first non-empty value from `customer_comment`, `comment`, `description`, or `listing.description` |
| `status__1` | RAM label |
| `color2` | normalized SSD label |
| `status8__1` | GPU label, or `Intel` for Intel titles |
| `status7__1` | CPU label when CPU detection returns a value |

### Step 7: Verify BM Devices item
- After BM Devices creation, the script waits 1 second and re-reads:
  - `numeric`
  - `text0`
  - `link`
- If any of those columns come back empty, the script logs a warning
- This verification is read-only and does not retry, patch, or roll back anything

### Step 8: Link the items
- After both items are created, the script writes BM Devices column `board_relation`
- Value shape: `{ "item_ids": [mainBoardItemId] }`
- If link creation fails, both items remain created but unlinked

### Step 9: Telegram notifications
- Dry-run mode logs "would send" instead of sending
- Live mode sends:
  - fetch failure alert for bulk poll failure
  - BM Devices creation failure alert after a Main Board item already exists
  - board-relation failure alert after both items already exist
  - per-order success message after create + link attempt
  - end-of-run summary only when `created > 0`
- Main Board creation failure is logged locally but does not send Telegram

## Assessment Labels Written By The Script
- Battery:
  - `Normal -> Normal`
  - `Service recommended -> Service`
  - `Service -> Service`
  - unknown values -> `Battery Reported`
- Screen:
  - `Flawless -> Excellent`
  - `Flawless appearance -> Excellent`
  - `Good -> Good`
  - `Used -> Fair`
  - `Cracked -> Damaged`
  - unknown values -> `Screen Reported`
- Casing:
  - `Flawless -> Excellent`
  - `Flawless appearance -> Excellent`
  - `Good -> Good`
  - `Used -> Fair`
  - `Broken sides and/or back -> Damaged`
  - unknown values -> `Casing Reported`
- Functional:
  - perfect battery + perfect screen + perfect casing + `Product is functional` -> `Fully Functional`
  - `Product is functional` otherwise -> `Functional`
  - `Product isn't functional -> Not Functional`
  - unknown values -> `Function Reported`

## What Does NOT Happen In This Script
- No grade column is written anywhere
- No `STALLONE -> NONFUNC_CRACKED` grade mapping exists in the current script
- No BM Devices `board_relation` value is written during item creation; linking happens afterward
- No Telegram is sent for duplicates
- No Telegram is sent for Main Board creation failure
- No V6 references remain

## Error Handling
- **Bulk BM API failure:** exit with error and send Telegram
- **Specific `--order` fetch failure:** log the error and continue
- **Duplicate order:** skip if the Main Board already contains the BM public ID in `text_mky01vb4`
- **Packing slip fetch / parse failure:** log a warning and continue with API-derived data
- **Missing fields:** create with whatever data is available
- **Main Board create failure:** log error and continue to next order
- **BM Devices create failure after Main Board create:** send Telegram and leave the Main Board item in place for manual follow-up
- **Board relation failure:** send Telegram and leave both items unlinked
- **Post-create verification warning:** log empty `numeric`, `text0`, or `link`

## QA Review (2026-03-30)

### Findings
1. Severity: high
   What is wrong: The script must prefer the packing-slip device title when present, then fall back to BM API title.
   Why it matters: Device title drives spec parsing, BM-to-device mapping, CPU detection, and device-board linking.
   Evidence: `scripts/sent-orders.js` parses PDF assessments and uses `pdfData.deviceTitle || extractProductName(orderDetail)`.
   Recommended fix: Keep PDF-first title extraction and add regression examples for new BM title variants.

2. Severity: high
   What is wrong: Intel CPU handling can emit `Intel` instead of `i3` / `i5` / `i7` style labels.
   Why it matters: This changes Main Board `dropdown` and BM Devices `status7__1`, which are explicitly in scope for this QA.
   Evidence: `scripts/sent-orders.js` stores `result.cpu = 'Intel'` for Intel titles in `parseSpecsFromTitle()` and passes that through `detectCPU()`.
   Recommended fix: Change the Intel parser path to emit `i3` / `i5` / `i7` values where the BM title exposes that detail.

3. Severity: medium
   What is wrong: The script writes operational helper fields beyond the minimum intake fields.
   Why it matters: Extra writes must be intentional and documented so operators know which columns are controlled by the VPS path.
   Evidence: Main Board adds `date_mkqgbbtp`; BM Devices adds `text81`.
   Recommended fix: Keep intentional helper fields documented in this SOP and avoid adding new mutation columns without a rollback note.

4. Severity: medium
   What is wrong: Duplicate detection must have one canonical source.
   Why it matters: Partial-failure scenarios behave differently if Main Board and BM Devices disagree.
   Evidence: `scripts/sent-orders.js` queries Main Board `text_mky01vb4`.
   Recommended fix: Treat Main Board `text_mky01vb4` as the canonical de-dup key and add a repair report for partial BM Devices creation failures.

5. Severity: medium
   What is wrong: Notification routing is split between Telegram and Slack call sites.
   Why it matters: Alert routing and operator expectations can drift, and missing Telegram delivery can hide automation outcomes.
   Evidence: `scripts/sent-orders.js` sends Telegram via `sendMessage` and verifies `numeric`, `text0`, and `link`.
   Recommended fix: Move intake notifications onto the shared notifications area once built.

6. Severity: low
   What is wrong: Assessment normalization accepts aliases and trims trailing PDF layout noise.
   Why it matters: In edge-case PDFs, the script may map a label that should be left as reported.
   Evidence: `cleanAssessment()` in `scripts/sent-orders.js` truncates after `\s{2,}`, and the script-level maps include `Service` and `Flawless appearance`.
   Recommended fix: Keep aliases only when backed by current BM packing-slip examples.

### Open Questions / Assumptions
- None that block documenting the current script behavior. The main unresolved point is whether strict Flow 0 parity is still the objective, or whether the rebuilt script is allowed to be a controlled divergence.

### Per-check Summary
- Main Board mutation columns: fail. Required Flow 0 columns are present, but the script also writes extra `date_mkqgbbtp`.
- BM Devices mutation columns: fail. Required Flow 0 columns are present, but the script also writes extra `text81`.
- BM numbering and target group: pass. The script reads BM numbers from BM Devices group `group_mkq3wkeq` and increments per prepared order.
- Item naming: pass against Flow 0, with caveat. The script uses `BM {number}` and `BM {number} ( {customerName} )`, including inner spaces around the customer name.
- Assessment labels: mostly pass for final written labels, with low-severity normalization drift from Flow 0 parsing.
- `GPU_TO_CPU_MAP`: pass. The map matches Flow 0 node 12.
- `BM_TO_DEVICE_MAP`: pass. No missing entries were found versus Flow 0 node 12.
- Price calculation: pass for the main formula. The script uses `Math.round(rawPrice / 1.1)`, but allows broader raw-price fallbacks than Flow 0.
- Board IDs and group IDs: pass. Main Board `new_group34198` and BM Devices `group_mkq3wkeq` are correct.
- De-dup behavior: fail versus Flow 0, pass versus the script's current intended Main Board rule.
- Grade mapping including `STALLONE -> NONFUNC_CRACKED`: fail as a requested behavior check. No grade mapping exists in the rebuilt script.
- Post-create verification: pass as implemented, but it only checks `numeric`, `text0`, and `link`.
- Notifications: fail versus Flow 0, pass versus the current Telegram-based script design.
- CLI flags: pass. `--live` works, dry-run is default, and `--order=` works.
- No V6 references remain: pass.
- Packing slip download and extraction: pass for the download / text-extraction step, fail for exact Flow 0 device-title parsing parity.
- `Fully Functional` special case: pass.

### Verdict
The rebuilt script does not match Flow 0 closely enough to be called an exact rebuild. The main remaining drifts are PDF device-title extraction, Intel CPU labeling, extra Monday writes, de-dup source, and Telegram-vs-Slack operational behavior.

SOP 01 now matches the rebuilt script on disk. The doc reflects the real columns, boards, groups, CLI usage, PDF handling, device matching, CPU detection, BM numbering, de-dup logic, post-create verification, and Telegram notifications implemented by `scripts/sent-orders.js`.

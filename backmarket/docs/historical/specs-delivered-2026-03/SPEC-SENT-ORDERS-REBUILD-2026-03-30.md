# Spec: sent-orders.js Rebuild — Match n8n Flow 0

**Date:** 30 Mar 2026
**Author:** Code (orchestrator)
**For:** Codex build agent
**Priority:** CRITICAL — current script creates items missing ~15 columns the team expects

---

## Problem

`sent-orders.js` was built as a simplified version of n8n Flow 0. It handles the basics (dedup, create Main Board + BM Devices, link, Telegram) but is missing most of the data the team relies on. The 3 orders created on March 28 are missing assessments, statuses, device linking, naming convention, and more.

## Reference

n8n Flow 0 export: `/home/ricky/builds/backmarket/data/n8n-flow0-export.json`
Current script: `/home/ricky/builds/backmarket/scripts/sent-orders.js`
SOP: `/home/ricky/builds/backmarket/sops/01-trade-in-purchase.md`

---

## What to Add

### 1. BM Number Sequencing

**Current:** Names items `BM Trade-in GB-26131-RCJHG`
**Required:** Names items `BM 1548` (BM Devices) and `BM 1548 ( Customer Name )` (Main Board)

Implementation:
1. Fetch all items from BM Devices board group `group_mkq3wkeq`
2. Extract the highest `BM XXXX` number from item names
3. Increment by 1 for each new order in the batch
4. Use `BM {number}` for BM Devices item name
5. Use `BM {number} ( {customerName} )` for Main Board item name

```javascript
async function getNextBmNumber() {
  // Query BM Devices board for all item names in the active group
  const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { groups(ids:["group_mkq3wkeq"]) { items_page(limit: 500) { items { name } } } } }`;
  const result = await mondayQuery(q);
  const items = result.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  let highest = 0;
  for (const item of items) {
    const match = item.name?.match(/BM\s+(\d+)/i);
    if (match) highest = Math.max(highest, parseInt(match[1]));
  }
  return highest + 1;
}
```

### 2. Packing Slip PDF Download + Assessment Extraction

**Current:** Not implemented at all
**Required:** Download the packing slip PDF, extract assessment text

The BM trade-in order API returns `transferCertificateLink` — a URL to the packing slip PDF. This PDF contains:

```
Battery - Normal
Screen - Good
Casing - Used
Functional - Product is functional
```

Implementation:
1. Get `transferCertificateLink` from the BM order detail API: `GET /ws/buyback/v1/orders/{orderId}`
2. Download the PDF
3. Extract text (use `pdf-parse` npm package, or call `pdftotext` via exec)
4. Parse with regex:
   ```javascript
   const battery = text.match(/Battery\s*-\s*(.+?)(?:\n)/)?.[1]?.trim();
   const screen = text.match(/Screen\s*-\s*(.+?)(?:\n)/)?.[1]?.trim();
   const casing = text.match(/Casing\s*-\s*(.+?)(?:\n)/)?.[1]?.trim();
   const functional = text.match(/Functional\s*-\s*(.+?)(?:\n)/)?.[1]?.trim();
   ```
5. Also extract customer name from PDF: `text.match(/I,\s+([^,]+),\s+agree to sell/)?.[1]?.trim()`

### 3. Assessment Label Mapping

Map raw PDF values to Monday column labels:

```javascript
const BATTERY_MAP = { "Normal": "Normal", "Service recommended": "Service", "Service": "Service" };
const SCREEN_MAP = { "Flawless": "Excellent", "Flawless appearance": "Excellent", "Good": "Good", "Used": "Fair", "Cracked": "Damaged" };
const CASING_MAP = { "Flawless": "Excellent", "Flawless appearance": "Excellent", "Good": "Good", "Used": "Fair", "Broken sides and/or back": "Damaged" };
const FUNCTIONAL_MAP = { "Product is functional": "Functional", "Product isn't functional": "Not Functional" };
```

Special case for "Fully Functional":
```javascript
const isFullyFunctional = (
  battery === "Normal" &&
  (screen === "Flawless" || screen === "Flawless appearance") &&
  (casing === "Flawless" || casing === "Flawless appearance") &&
  functional === "Product is functional"
);
// If all perfect → "Fully Functional" instead of "Functional"
```

### 4. Main Board Columns to Add

These are all written during `createMainBoardItem()`:

| Column ID | Value | Source |
|-----------|-------|--------|
| `text5` | Customer name | PDF extraction or API `customer.firstName + lastName` |
| `numbers` | Purchase price (ex VAT) | `Math.round(originalPrice.value / 1.1)` |
| `link1` | `{ url: pdfLink, text: "Packing Slip" }` | `transferCertificateLink` from API |
| `status` | `{ label: "BM" }` | Hardcoded |
| `service` | `{ label: "Mail-In" }` | Hardcoded |
| `status4` | `{ label: "Expecting Device" }` | Hardcoded |
| `status24` | `{ label: "Diagnostic" }` | Hardcoded |
| `color_mkypbg6z` | `{ label: "Trade-in" }` | Hardcoded |
| `color_mkyp4jjh` | `{ label: "Unknown" }` | Hardcoded (iCloud status) |
| `color_mkqg66bx` | `{ label: batteryLabel }` | PDF assessment |
| `color_mkqg7pea` | `{ label: screenLabel }` | PDF assessment |
| `color_mkqg1c3h` | `{ label: casingLabel }` | PDF assessment |
| `color_mkqg578m` | `{ label: functionalLabel }` | PDF assessment |
| `color_mkxga4sk` | `{ label: keyboard }` | Parsed from BM title (QWERTY/AZERTY/QWERTZ) |
| `status9` | `{ label: keyboard }` | Same as above (duplicate column) |
| `status_1` | `{ label: ram }` | Parsed from BM title |
| `status_15` | `{ label: ssd }` | Parsed from BM title (with normalization: 1000GB→1TB) |
| `status7` | `{ label: gpu }` | Parsed from BM title |
| `dropdown` | `{ labels: [cpuValue] }` | CPU detection (see below) |
| `board_relation5` | `{ item_ids: [deviceItemId] }` | Device board matching (see below) |

**Group:** `new_group34198` (Incoming Future)

**Item name:** `BM {number} ( {customerName} )`

### 5. BM Devices Columns to Add

| Column ID | Value | Source |
|-----------|-------|--------|
| `text0` | Tracking number | `order.trackingNumber` |
| `link` | `{ url: pdfLink, text: "Packing Slip" }` | `transferCertificateLink` |

### 6. Device Board Matching

n8n has a `BM_TO_DEVICE_MAP` that maps BM model descriptions to Monday device board item names. This links the trade-in to the correct device type.

```javascript
const BM_TO_DEVICE_MAP = {
  "MacBook Air 13 (Late 2020)": "MacBook Air 13 M1 A2337",
  "MacBook Air 13 (Mid 2022)": "MacBook Air 13 M2 A2681",
  "MacBook Air 13 (Mid 2024)": "MacBook Air 13 M3 A3113",
  "MacBook Air 15 (Mid 2023)": "MacBook Air 15 M2 A2941",
  "MacBook Pro 13 (Late 2020)": "MacBook Pro 13 M1 A2338",
  "MacBook Pro 13 (Mid 2022)": "MacBook Pro 13 M2 A2338",
  "MacBook Pro 14 (Late 2021)": "MacBook Pro 14 M1 Pro/Max A2442",
  "MacBook Pro 14 (Early 2023)": "MacBook Pro 14 M2 Pro/Max A2779",
  "MacBook Pro 14 (Late 2023)": "MacBook Pro 14 M3 A2918",
  "MacBook Pro 16 (Late 2021)": "MacBook Pro 16 M1 Pro/Max A2485",
  "MacBook Pro 16 (Early 2023)": "MacBook Pro 16 M2 Pro/Max A2780",
  "MacBook Pro 16 (Late 2023)": "MacBook Pro 16 M3 Pro/Max A2991",
  // ... full map in n8n-flow0-export.json Node 12
};
```

Implementation:
1. Parse BM model from title: `"MacBook Air 15" (Mid 2023)"` → `"MacBook Air 15 (Mid 2023)"`
2. Look up in map → `"MacBook Air 15 M2 A2941"`
3. Query Monday devices board for that exact item name
4. If found → set `board_relation5` on Main Board to link them

### 7. CPU Detection

n8n uses GPU-to-CPU inference for Pro/Max chips:

```javascript
const GPU_TO_CPU_MAP = {
  "M1 Pro": { "14": "8-Core", "16": "10-Core" },
  "M1 Max": { "24": "10-Core", "32": "10-Core" },
  "M2 Pro": { "16": "10-Core", "19": "12-Core" },
  "M2 Max": { "30": "12-Core", "38": "12-Core" },
  "M3 Pro": { "14": "12-Core", "18": "12-Core" },
  "M3 Max": { "30": "12-Core", "40": "12-Core" },
  "M4 Pro": { "16": "12-Core", "20": "12-Core" },
  "M4 Max": { "32": "12-Core", "40": "12-Core" },
};
```

Logic:
- Intel → `"i3"` / `"i5"` / `"i7"` from title
- Standard M-series (Air, base Pro) → `"8-Core"`
- Pro/Max → extract GPU cores from title, look up CPU cores from map

### 8. Price Calculation

n8n divides `originalPrice.value` by 1.1 to get ex-VAT price:
```javascript
const price = Math.round(apiData.originalPrice.value / 1.1);
```

Check: does our script already do this, or does it use the raw price?

---

## What to Keep

- Dedup logic (check `text_mky01vb4` against existing Monday items)
- Grade mapping (STALLONE→NONFUNC_CRACKED etc.) — already correct
- Post-create verification
- Telegram notifications
- `--dry-run` / `--live` / `--order` flags
- Board relation linking (BM Devices → Main Board)

---

## What to Change in Existing Code

1. **Item naming** — change from `BM Trade-in {publicId}` to `BM {number} ( {customerName} )`
2. **Group** — verify we're creating in `new_group34198` (Incoming Future) on Main Board and `group_mkq3wkeq` on BM Devices
3. **Price column** — n8n writes to `numbers` (not `numeric`) on Main Board. Check which is correct.
4. **Customer name** — n8n writes to `text5`. Our script may write to a different column or not at all.

---

## BM Trade-In Order Detail API

To get the packing slip link and full order details:

```
GET /ws/buyback/v1/orders/{orderId}
```

This returns:
- `transferCertificateLink` — URL to packing slip PDF
- `originalPrice.value` — purchase price (inc VAT)
- `customer.firstName`, `customer.lastName`
- `trackingNumber`
- `listing.title` — device description
- `listing.grade` — BM grade (STALLONE/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND)
- `status`

---

## Verification

After changes:

1. `node --check scripts/sent-orders.js`
2. `node scripts/sent-orders.js --dry-run --order=GB-26131-RCJHG`
   Show ALL columns that would be written to both boards.
3. `node scripts/sent-orders.js --dry-run`
   Show how many orders detected, BM number sequencing.
4. Compare output against n8n Flow 0's column values — every column should match.
5. Do NOT run `--live` without approval.

---

## Acceptance Criteria

1. Item naming matches `BM {number} ( {customerName} )` convention
2. BM number sequences correctly from highest existing number
3. All 15+ Main Board columns written (status, service, assessments, keyboard, link, device relation)
4. All BM Devices columns written (tracking, packing slip link)
5. PDF packing slip downloaded and parsed for assessments
6. Device board matching works (board_relation5 links to correct device)
7. CPU detection works for Intel, standard M-series, and Pro/Max chips
8. Assessment labels match n8n mapping exactly
9. Price is ex-VAT (÷ 1.1)
10. Existing dedup, grade mapping, verification, and Telegram still work

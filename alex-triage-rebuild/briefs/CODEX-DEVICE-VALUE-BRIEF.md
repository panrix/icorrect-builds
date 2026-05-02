# Codex Brief: Diagnostic Device Value Enrichment

**Date:** 2026-04-13
**Owner:** Codex ACP
**Priority:** High — prerequisite for Phase 2 quote automation
**Scope:** Build and validate a script that enriches historical diagnostic items with Apple-verified specs and market value

---

## Objective

Build `scripts/diagnostic-device-value.js` that takes historical diagnostic items from Monday, resolves each device's actual Apple specs via serial number, matches to current BackMarket sell prices (market/replacement value), and joins with what we actually charged for the repair.

Output: a dataset showing **device spec → market value → what we charged** per diagnostic item.

This data enables automated logic board pricing decisions in Phase 2 — if we know a device is worth £4,000 (high-spec), we can price logic board repairs proportionally rather than leaving every price blank for manual input.

---

## Existing Pieces (DO NOT REBUILD)

### 1. Diagnostic Extraction (already run, 1,053 items)
- **Script:** `/home/ricky/builds/elek-board-viewer/diagnostics/extract_safan_diagnostics.py`
- **Data:** `/home/ricky/builds/elek-board-viewer/data/safan_diagnostics_enriched.json`
- **What it has:** item ID, device_models[], current_status, diagnostic_notes, financials (quote_inc_vat, parts_cost, labour_cost, net_profit, margin_pct), dates, condition
- **Board:** Main Board `349212843`, filtered to Saf's diagnostic items

### 2. Apple Spec Matcher (working, uses Playwright + proxy)
- **Script:** `/home/ricky/builds/icloud-checker/src/apple-specs.js`
- **What it does:** Takes a serial number → hits Apple Self Service Repair site → returns { model, color, cpu, gpu, memory, storage, partName }
- **Proxy:** DataImpulse `gw.dataimpulse.com:823`
- **Dependency:** Playwright, proxy credentials in the script

### 3. V7 Scraper Output (fresh daily, today's file exists)
- **Data:** `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`
- **What it has:** BackMarket sell prices per device model, grade, RAM, SSD, colour
- **Coverage:** MacBook, iPhone, iPad

---

## What to Build

### `scripts/diagnostic-device-value.js`

Location: `/home/ricky/builds/alex-triage-rebuild/scripts/diagnostic-device-value.js`

**Inputs:**
1. Enriched diagnostics JSON → `/home/ricky/builds/elek-board-viewer/data/safan_diagnostics_enriched.json`
2. Apple specs function → require from `/home/ricky/builds/icloud-checker/src/apple-specs.js`
3. V7 sell prices → `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`

**Process per item:**

1. Load enriched diagnostics (1,053 items)
2. For each item that has a serial number available:
   a. Look up the serial from Monday (column `text98` or similar serial column — check the item data)
   b. Call `getAppleSpecs(serial)` to get verified specs: model, chip, CPU, GPU, RAM, storage
   c. Match specs against V7 sell prices to find current market value (match by model + RAM + SSD + grade)
   d. Join with existing financials from the enriched data (quote_inc_vat, parts_cost, etc.)
3. Output combined record per item

**If serial is not in the enriched data:** The serial may need to be pulled from Monday directly. Check the Monday item for a serial number column. If no serial column exists on the board, log the item as "no serial available" and skip.

**Rate limiting for Apple specs:** The Apple Self Service Repair site may rate limit. Add a 3-5 second delay between lookups. For the initial validation run of 5 items, this is not a concern.

**Output format:**

```json
{
  "generated_at": "ISO timestamp",
  "item_count": 5,
  "items": [
    {
      "monday_item_id": "123456",
      "device_from_monday": "MacBook Pro 14\" M1 Pro",
      "serial": "C02...",
      "apple_specs": {
        "model": "MacBook Pro 14-inch",
        "cpu": "M1 Pro (10-core)",
        "gpu": "16-core",
        "memory": "32GB",
        "storage": "1TB",
        "color": "Space Gray"
      },
      "market_value": {
        "grade_excellent": 1450,
        "grade_good": 1280,
        "grade_fair": 1100,
        "source": "backmarket-sell-prices-2026-04-13"
      },
      "what_we_charged": {
        "quote_inc_vat": 349,
        "parts_cost": 45,
        "labour_cost": 120,
        "net_profit": 139,
        "margin_pct": 47.8
      },
      "value_ratio": {
        "repair_cost_vs_device_value": 0.24,
        "note": "Repair is 24% of device market value (Excellent grade)"
      }
    }
  ]
}
```

Save to: `/home/ricky/builds/alex-triage-rebuild/data/diagnostic-device-values.json`

---

## Validation Run (5 items)

Run with `--limit=5` flag to process only the first 5 items that have serials.

For each of the 5 items, verify:
1. Apple specs returned successfully (not error)
2. Specs match what we'd expect for the device listed on Monday
3. V7 sell price match found (model + RAM + SSD)
4. Financials from enriched data are present
5. Value ratio calculation is correct

Print a summary table to stdout:

```
Item ID     | Device              | Spec (RAM/SSD) | Market Value (Exc) | We Charged | Ratio
----------- | ------------------- | --------------- | ------------------ | ---------- | -----
11129983413 | MacBook Pro 14" M1P | 32GB / 1TB      | £1,450             | £349       | 24%
```

---

## Constraints

- Work in: `/home/ricky/builds/alex-triage-rebuild/`
- Use Node.js (consistent with the rest of the build)
- Require apple-specs.js from its existing location — do not copy or rewrite it
- Read V7 sell prices from disk — do not run the scraper
- Read enriched diagnostics from disk — do not re-extract from Monday
- The only external call per item is `getAppleSpecs(serial)` via Playwright
- If a serial is not available for an item, skip it and log why
- Commit your work with a clear message
- Do not modify any files outside this build directory

---

## Deliverables

1. `scripts/diagnostic-device-value.js` — the script
2. `data/diagnostic-device-values.json` — output from the 5-item validation run
3. stdout summary table showing the 5 results
4. Brief note on: how many of the 5 had serials, how many matched V7 prices, any issues

# Pricing Sync — Build Plan

**Project:** `/home/ricky/builds/pricing-sync/`
**Source of truth:** Shopify (verified in `/home/ricky/kb/pricing/`)
**Target systems:** Monday (boards 3923707691 + 2477699024), SumUp (CSV import)
**Created:** 2026-03-16

---

## Phase 1: Fresh Data Pull + Schema Discovery

**Goal:** Pull live data from all 3 systems, discover Monday board schemas we haven't seen yet.

**Scripts:** `phase1-pull.py` + `utils.py`

**What it does:**
1. **Shopify** — Pull all active products via REST API (`/admin/api/2024-10/products.json`, paginated). Extract (device, repair_type, price) from each product title.
2. **Monday board 3923707691** (Devices) — Schema discovery first (columns, groups, items). We don't know this board's structure yet.
3. **Monday board 2477699024** (Products & Pricing) — Same schema discovery. Known: has `text_mkzdte13` (Shopify ID, currently empty) and `numbers` (price).
4. **SumUp** — Parse existing CSV from `~/.openclaw/agents/main/workspace/data/sumup-items-export.csv`. Parent/variation structure → structured JSON.

**Output:** `data/shopify-live.json`, `data/monday-devices.json`, `data/monday-pricing.json`, `data/sumup-parsed.json` — all with normalized structure.

**Reuse:** `bm_utils.py` (`load_env()`, `monday_query()`) from `/home/ricky/builds/backmarket/api/`. Monday pagination pattern from `bm-crossref.py`.

**Verification:** Print item counts per system. Compare Shopify live pull against KB files (`/home/ricky/kb/pricing/`) to confirm consistency.

---

## Phase 2: Structural Matching Engine

**Goal:** Map every product across all 3 systems using normalized (device, repair_type) pairs. No fuzzy matching.

**Script:** `phase2-match.py`

**Approach:**
1. Build canonical catalog from Shopify (source of truth)
2. Normalize device names via rules + alias map:
   - `SE2` → `SE 2`, `S4` → `Series 4`, `40mm` → `40MM`, strip trailing spaces
   - Explicit alias map in `config/name-aliases.json` for edge cases
3. Normalize repair types via alias map (`config/repair-aliases.json`):
   - SumUp `"Battery"` → Shopify `"Battery Repair"` / `"Battery Replacement (Genuine Battery)"`
   - SumUp `"Genuine OLED Screen"` → Shopify `"Screen Repair (Genuine OLED)"`
   - Monday `"Screen"` → context-dependent (needs device category to resolve)
4. Match on `(normalized_device, normalized_repair)` tuples across all systems
5. Unmatched items get flagged with closest Shopify suggestion

**Output:** `data/catalog-matched.json` — single file consumed by all subsequent phases.

**Key: The alias maps are generated semi-automatically in this phase, then I pause for manual review before running the match.** This is where naming mismatches get caught.

---

## Phase 3: Three-Way Audit Report

**Goal:** Produce an accurate, actionable report Ricky reviews before any changes are made.

**Script:** `phase3-audit.py`

**Report sections:**
1. **Summary** — counts per system, match rates
2. **Price mismatches** — table: device, repair, Shopify price, Monday price, SumUp price, delta
3. **Missing products** — in Shopify but not Monday/SumUp (need creating), and vice versa
4. **Naming inconsistencies** — matched structurally but raw names differ (rename targets)
5. **Legacy items** — in Monday/SumUp with no Shopify equivalent (manual review)
6. **Action items** — numbered list of what needs to happen

**Output:** `reports/audit-YYYY-MM-DD.md`

**STOP HERE for Ricky review.** No live system changes until audit is approved.

---

## Phase 4: Monday Update Script

**Goal:** Update Monday boards to match Shopify naming + pricing.

**Script:** `phase4-monday-update.py`

**Safety:**
- **Dry-run by default** — `--dry-run` shows all planned changes. `--execute` makes API calls.
- **Pre-flight check** — reads current value before each mutation; skips if value changed since audit
- **Full change log** — `reports/update-log-YYYY-MM-DD.json` with before/after for every mutation
- **One board at a time** — Products & Pricing first, then Devices

**Changes:**
- Update item names to match Shopify naming convention
- Update prices to match Shopify
- Populate empty `text_mkzdte13` (Shopify ID) column on Products & Pricing board
- Create missing items that exist in Shopify but not Monday
- DO NOT delete any items (flag legacy items only)

---

## Phase 5: SumUp CSV Generator

**Goal:** Generate a corrected CSV importable into SumUp.

**Script:** `phase5-sumup-gen.py`

**Approach:**
- Read original CSV, preserve ALL existing Item IDs and Variant IDs (prevents duplicates on reimport)
- Update parent "Item name" to Shopify device name
- Update "Variations" names to match Shopify repair types
- Update prices to match Shopify
- New items get new UUIDs; legacy items flagged but NOT removed

**Output:** `data/sumup-corrected.csv` + `reports/sumup-changes-YYYY-MM-DD.md`

---

## File Structure

```
/home/ricky/builds/pricing-sync/
├── plan.md                     # This file
├── utils.py                    # Shared: shopify_get(), monday_paginate(), parse_sumup_csv(), normalizers
├── phase1-pull.py              # Fresh data extraction
├── phase2-match.py             # Structural matching engine
├── phase3-audit.py             # Three-way audit report
├── phase4-monday-update.py     # Monday mutations (dry-run default)
├── phase5-sumup-gen.py         # SumUp CSV generator
├── config/
│   ├── name-aliases.json       # Device name normalization map
│   └── repair-aliases.json     # Repair type normalization map
├── data/                       # API pulls + intermediate data
│   ├── shopify-live.json
│   ├── monday-devices.json
│   ├── monday-pricing.json
│   ├── sumup-parsed.json
│   ├── sumup-export-original.csv  # Untouched backup
│   └── catalog-matched.json    # Master mapping file
└── reports/
    ├── audit-YYYY-MM-DD.md
    ├── update-log-YYYY-MM-DD.json
    └── sumup-changes-YYYY-MM-DD.md
```

## Key Dependencies

| File | Reuse |
|------|-------|
| `/home/ricky/builds/backmarket/api/bm_utils.py` | `load_env()`, `monday_query()` |
| `/home/ricky/config/api-keys/.env` | API credentials |
| `/home/ricky/kb/pricing/*.md` | Verification baseline |
| `/home/ricky/.openclaw/agents/main/workspace/data/sumup-items-export.csv` | Current SumUp catalog |

## Out of Scope

- Automated ongoing sync (webhook/cron) — separate project
- Parts board (985177480) updates — different data model
- Main board (349212843) direct updates — it references the other boards via links/mirrors
- Supabase pricing table — future project
- Changes TO Shopify — Shopify is source of truth, not a target

## Verification

After each phase:
- Phase 1: Compare live Shopify pull against KB pricing files — counts and prices should match
- Phase 2: Print unmatched items list; manually verify alias maps cover all cases
- Phase 3: Ricky reviews audit report before proceeding
- Phase 4: Dry-run output reviewed; spot-check 5-10 items in Monday UI after execution
- Phase 5: Open generated CSV in spreadsheet; spot-check pricing against Shopify

---

## TODO — Full Task Breakdown

### Phase 1: Fresh Data Pull + Schema Discovery

- [x] **1.1** Create `utils.py` — shared utilities
  - [x] 1.1.1 Import `load_env()` and `monday_query()` from `bm_utils.py`
  - [x] 1.1.2 Write `shopify_get(endpoint, params)` — Shopify REST API wrapper with access token auth
  - [x] 1.1.3 Write `shopify_get_all_products()` — paginated product fetcher (page_info cursor, 250/page)
  - [x] 1.1.4 Write `monday_paginate(board_id, column_ids)` — paginated item fetcher using `items_page`/`next_items_page` cursor pattern
  - [x] 1.1.5 Write `monday_get_schema(board_id)` — fetch columns, groups, and sample items for a board
  - [x] 1.1.6 Write `parse_sumup_csv(filepath)` — parse parent/variation CSV structure into `[{device, repairs: [{name, price, variant_id}], item_id}]`
  - [x] 1.1.7 Write `normalize_device(name)` and `normalize_repair(name)` — stub implementations (full logic in Phase 2)
  - [x] 1.1.8 Write `log(msg)` — stderr logging utility
  - [x] 1.1.QA Verified: all imports work, credentials load, no syntax errors

- [x] **1.2** Create `phase1-pull.py` — data extraction script
  - [x] 1.2.1 Pull all active Shopify products → `data/shopify-live.json` (885 products, 4 pages)
  - [x] 1.2.2 Print Shopify summary: 885 total; iPhone 407, MacBook 167, Watch 128, iPad 111, Laptop 30, Uncategorized 30
  - [x] 1.2.3 Query Monday board 3923707691 schema → `data/monday-devices-schema.json` (5 cols, 6 groups)
  - [x] 1.2.4 Pull all items from Monday board 3923707691 → `data/monday-devices.json` (146 items)
  - [x] 1.2.5 Query Monday board 2477699024 schema → `data/monday-pricing-schema.json` (19 cols, 133 groups)
  - [x] 1.2.6 Pull all items from Monday board 2477699024 → `data/monday-pricing.json` (1,270 items, 7 pages)
  - [x] 1.2.7 Copy SumUp CSV to `data/sumup-export-original.csv` (backup)
  - [x] 1.2.8 Parse SumUp CSV → `data/sumup-parsed.json` (96 devices, 748 repairs)
  - [x] 1.2.9 Print summary table: Shopify 885 | Monday Devices 146 | Monday Pricing 1,270 | SumUp 748
  - [x] 1.2.QA Cross-checked Shopify prices against KB: iPhone 11 Pro Screen £189 MATCH, Watch SE 2 40MM Battery £139 MATCH, Watch SE 2 40MM Diagnostic £19 MATCH, iPhone 12 Battery £89 MATCH — all 4/4

- [x] **1.3** Verify Phase 1 output
  - [x] 1.3.1 Shopify count: 885 active (vs expected ~919 — delta is non-repair items like shipping/services)
  - [x] 1.3.2 Monday Devices board: 5 columns (Name, Products, Device Type, Pre-Check Sets, Website Booking URL), 6 groups (Apple Watch, iPad, MacBook, iPhone, Other, Test). DISCOVERY: simple lookup table, links to Pricing board via board_relation
  - [x] 1.3.3 Monday Pricing board: 19 columns including `numbers` (price), `status3` (repair type), `text_mkzdte13` (Shopify ID — empty), `status6` (Price Sync status — exists!). 133 device groups, 1,270 items
  - [x] 1.3.4 SumUp parsing: 96 devices, 748 variations, all UUIDs preserved. Parent/variation structure correct
  - [x] 1.3.5 SURPRISE: Pricing board has existing `status6` "Price Sync" column — can use for tracking sync status
  - [x] 1.3.QA Verified: sample items have correct structure, price column is `numbers`, Shopify ID column is `text_mkzdte13`

### Phase 2: Structural Matching Engine

- [x] **2.1** Build device name normalization
  - [x] 2.1.1 Extracted 113 unique Shopify device names (parsed from titles)
  - [x] 2.1.2 Extracted 133 unique Monday Pricing groups + 146 Monday Devices items
  - [x] 2.1.3 Extracted 96 unique SumUp parent device names
  - [x] 2.1.4 Built regex rules: SE2→SE 2, S4→Series 4, mm→MM, whitespace collapse, quote normalization
  - [x] 2.1.5 Applied rules; identified ~80 Monday and ~50 SumUp names needing explicit aliases
  - [x] 2.1.6 Wrote `config/name-aliases.json` with `monday_to_shopify` (93 entries) and `sumup_to_shopify` (54 entries). null = no Shopify equivalent (legacy devices)
  - [x] 2.1.QA Spot-checked: "Apple Watch S4 40mm" → "Apple Watch Series 4 40MM", "MacBook Air 13 M4 A3240" → "MacBook Air 13-inch 'M4' A3240 (2025)", "iPad Pro 11 (1G)" → "iPad Pro 11 1st Gen (2019)"

- [x] **2.2** Build repair type normalization
  - [x] 2.2.1 Extracted 34 unique Shopify repair types
  - [x] 2.2.2 Extracted 20 unique Monday repair types (from `status3` column). FINDING: 181 items use "Small Part" as catch-all
  - [x] 2.2.3 Extracted 54 unique SumUp variation names
  - [x] 2.2.4 Wrote `config/repair-aliases.json` with `sumup_to_shopify` (54 entries) and `monday_to_shopify` (20 entries). Maps to generic categories, not full Shopify names
  - [x] 2.2.5 Built `ITEM_NAME_REPAIR_PATTERNS` — 35 patterns to extract repair type from Monday item names when `status3` is unhelpful (Small Part, Not Set, Other). Falls back to matching "Earpiece Speaker", "Loudspeaker", "Front Camera", etc. from the item name suffix
  - [x] 2.2.6 Built `SHOPIFY_TO_CATEGORY` mapping (27 categories) — maps full Shopify repair names to generic categories for cross-system matching. Matching is within-device: "Battery" on iPhone 12 resolves to "Battery Replacement (Genuine Battery)" because that's the only battery for that device in Shopify
  - [x] 2.2.QA Verified: "Battery" matches correctly per device, "Small Part" items now resolve via item name parsing

- [x] **2.3** Alias map review
  - [x] 2.3.1 `config/name-aliases.json` — reviewed. 30+ devices mapped to null (no Shopify page: iPhone 6/6s/7, iPod, iPad 4/5, iPad Air 1/2, MacBook 12, etc.). Correct — these are legacy
  - [x] 2.3.2 `config/repair-aliases.json` — reviewed. DustGate/FlexGate/Touch Bar added. Home Button/Proximity Sensor/WiFi Module/ERROR 4013 mapped to null (no Shopify equivalent). Correct
  - [x] 2.3.3 No ambiguous mappings remaining. All devices either have a clear Shopify match or are explicitly legacy (null)

- [x] **2.4** Build and run matching engine (`phase2-match.py`)
  - [x] 2.4.1 Loads all 4 Phase 1 JSON files + both alias maps
  - [x] 2.4.2 Parses 868 Shopify repair products into canonical catalog (113 devices × categories). 53 non-repair items correctly skipped (shipping, services, turnaround time)
  - [x] 2.4.3 Monday Pricing matched: **799 / 1,270** (63%). Unmatched: 307 legacy devices, 137 repair gaps, 27 unmapped
  - [x] 2.4.4 SumUp matched: **457 / 748** (61%). Unmatched: 244 repair gaps, 38 legacy devices, 9 unmapped
  - [x] 2.4.5 Monday price mismatches: **115** (matched but different price)
  - [x] 2.4.6 SumUp price mismatches: **110** (matched but different price)
  - [x] 2.4.7 In Shopify, missing from Monday: **148** items
  - [x] 2.4.8 In Shopify, missing from SumUp: **415** items
  - [x] 2.4.9 Wrote `data/catalog-matched.json`
  - [x] 2.4.QA Spot-checked 3 items: MacBook Air 13 M4 Diagnostic £49=£49 MATCH, MacBook Air 13 M4 Screen £479=£479 MATCH, MacBook Air 13 M4 Keyboard £299=£299 MATCH. No false matches detected

### Phase 3: Three-Way Audit Report

- [x] **3.1** Create and run `phase3-audit.py`
  - [x] 3.1.1 Loads `data/catalog-matched.json`
  - [x] 3.1.2 Summary: 868 Shopify / 1,270 Monday / 748 SumUp. Monday 63% match, SumUp 61% match
  - [x] 3.1.3 Price mismatch tables: 115 Monday mismatches, 110 SumUp mismatches, sorted by absolute delta
  - [x] 3.1.4 Missing products: 148 Shopify items not in Monday, 415 Shopify items not in SumUp
  - [x] 3.1.5 Naming inconsistencies: device renames needed per system (Apple Watch S4→Series 4, SE2→SE 2, MacBook short→full names, iPad generation→year names)
  - [x] 3.1.6 Legacy items: 471 Monday unmatched (307 legacy devices + 137 repair gaps + 27 unmapped), 291 SumUp unmatched
  - [x] 3.1.7 Action items: 9 prioritised actions generated
  - [x] 3.1.8 Wrote `reports/audit-2026-03-16.md` (1,039 lines)
  - [x] 3.1.9 Top-10 printed: worst Monday delta £-200 (MBP 16 M4 Charging Port), worst SumUp delta £-150 (iPhone 12 Front Camera)
  - [x] 3.1.QA Verified: numbers add up (matched + unmatched = totals per system), top mismatches are real

- [x] **3.2** Ricky review
  - [x] 3.2.1 Audit summary sent to Ricky
  - [x] 3.2.2 Confirmed: Shopify prices are correct, sync everything as-is
  - [x] 3.2.3 No ambiguous price decisions — Shopify is always right
  - [x] 3.2.4 Green light for Phase 4 + 5

### Phase 4: Monday Update Script

- [x] **4.1** Create `phase4-monday-update.py`
  - [x] 4.1.1 Loads `data/catalog-matched.json`, builds mutation list
  - [x] 4.1.2 Mutation types: price updates (115), Shopify ID fills (799). Total: 799 mutations
  - [x] 4.1.3 `--dry-run` mode implemented — prints all planned changes grouped by type
  - [x] 4.1.4 Pre-flight check implemented — re-reads current value before each mutation, skips if changed since audit
  - [x] 4.1.5 `--execute` mode implemented — runs Monday GraphQL `change_multiple_column_values` mutations with rate limiting (1s pause every 10 items). 5-second abort window before starting
  - [x] 4.1.6 Full change log written to `reports/update-log-YYYY-MM-DD.json` with before/after values per mutation
  - [x] 4.1.QA Dry-run verified: 115 price changes all show correct before/after/delta, 799 Shopify IDs all show correct product IDs

- [ ] **4.2** Products & Pricing board (2477699024) — execute
  - [x] 4.2.1 Dry-run reviewed: 115 price changes (largest: MBP 16 M4 Charging Port £199→£399)
  - [x] 4.2.2 Dry-run reviewed: 799 Shopify ID fills (all currently empty)
  - [ ] 4.2.3 Execute: `python3 phase4-monday-update.py --execute`
  - [ ] 4.2.4 Review execution log at `reports/update-log-2026-03-16.json` — check for failures/skips
  - [ ] 4.2.5 Spot-check 5 items in Monday UI:
    - [ ] MacBook Air 13 M4 A3240 Diagnostic — should show Shopify ID populated
    - [ ] MacBook Pro 16 M4 Charging Port — should show £399 (was £199)
    - [ ] iPhone 15 Pro Max Screen — should show £359 (was £249)
    - [ ] Apple Watch SE2 40MM Diagnostic — should show £19 (was £49)
    - [ ] iPhone 12 Rear Camera Lens — should show £129 (was £59)
  - [ ] 4.2.QA Confirm: success count matches expected, no failed mutations, no unexpected skips

- [ ] **4.3** Devices board (3923707691) — assess
  - [ ] 4.3.1 Assess: this board has 146 items (device names only, no prices). Renames would require updating item names to match Shopify device naming. Currently NOT in the mutation script — needs separate implementation if wanted
  - [ ] 4.3.QA Confirm: no unintended changes made to Devices board

### Phase 5: SumUp CSV Generator

- [x] **5.1** Create and run `phase5-sumup-gen.py`
  - [x] 5.1.1 Reads `data/sumup-export-original.csv` (844 rows)
  - [x] 5.1.2 Loads `data/catalog-matched.json` + `config/name-aliases.json`
  - [x] 5.1.3 Updates: 20 device renames (e.g., "Apple Watch SE2 40MM" → "Apple Watch SE 2 40MM"), 110 price corrections
  - [x] 5.1.4 All 96 existing Item IDs and all variant IDs preserved — verified programmatically
  - [x] 5.1.5 SumUp items with no Shopify match: kept unchanged (not deleted)
  - [x] 5.1.6 Wrote `data/sumup-corrected.csv` (844 rows — same as original)
  - [x] 5.1.7 Wrote `reports/sumup-changes-2026-03-16.md` with all device renames and price changes
  - [x] 5.1.QA Row count: 845 = 845 MATCH. Item IDs preserved: YES. Variant IDs preserved: YES. Rename check: "Apple Watch SE 2 40MM" correct. Price check: iPhone 12 Front Camera £249.00 correct

- [ ] **5.2** SumUp import
  - [ ] 5.2.1 Send `data/sumup-corrected.csv` to team (or import directly)
  - [ ] 5.2.2 Import CSV into SumUp dashboard
  - [ ] 5.2.3 Spot-check 5 items in SumUp POS after import:
    - [ ] Apple Watch SE 2 40MM Diagnostic — should show £19 (was £49)
    - [ ] iPhone 12 Front Camera — should show £249 (was £99)
    - [ ] iPhone 15 Pro Max Screen — should match Shopify price
    - [ ] Apple Watch SE 44MM Glass Screen — should show £199 (was £89)
    - [ ] MacBook Air 13" M3 A3113 Diagnostic — should match Shopify price
  - [ ] 5.2.QA Confirm: Andres verifies walk-in pricing matches Shopify for 3 common repairs

### Post-Sync Verification

- [ ] **6.1** End-to-end cross-check
  - [ ] 6.1.1 Re-run `phase1-pull.py` to pull fresh Monday data post-update
  - [ ] 6.1.2 Re-run `phase2-match.py` to regenerate match data
  - [ ] 6.1.3 Re-run `phase3-audit.py` to generate post-sync audit report
  - [ ] 6.1.4 Verify: Monday price mismatches reduced from 115 to 0 (or near-0 if pre-flight skips occurred)
  - [ ] 6.1.5 Verify: Shopify ID fills show as populated (was 0, should be 799)
  - [ ] 6.1.QA Compare pre-sync and post-sync audit reports side by side — confirm improvement

- [ ] **6.2** Notify team
  - [ ] 6.2.1 Inform Ferrari: Monday prices now match Shopify — use these for quoting
  - [ ] 6.2.2 Inform Andres: SumUp prices updated — walk-in pricing now matches website
  - [ ] 6.2.3 Document: which items are legacy (in Monday/SumUp but not Shopify) for future cleanup decision

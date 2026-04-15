# Phase 0: Source Contract Validation Tasks

Date: 2026-04-13
Status: ready for execution
Context: QA review of TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md returned no-go on 2026-03-30. These four tasks resolve the blockers before any engine build starts.

---

## Task 1: Scraper V7 Output → PriceFact Mapping

**Goal:** Prove exactly how `sell_price_scraper_v7.js` output becomes a single Fair sell price per canonical spec.

**Steps:**

1. Read `sell_price_scraper_v7.js` and document the exact JSON output shape (top-level keys, nested structure, picker fields).
2. Pull the most recent scraper output file from `/home/ricky/builds/buyback-monitor/data/sell-prices-*.json` (latest date). Document its structure with a real example.
3. For each picker dimension (grades, ram, ssd, cpu_gpu, colour, size), document:
   - What values appear
   - Whether they map to price deltas or absolute prices
   - Whether "Fair" is always present as a grade option
4. Write a concrete algorithm (pseudocode) showing: given a canonical spec key like `MBA13.M2.8GB.256GB`, how do you resolve a single Fair sell price from the scraper output?
5. Identify gaps: specs that exist in active buyback listings but have no scraper coverage, or where the picker structure makes resolution ambiguous.
6. Check `generate_sell_lookup.py` and `run_price_pipeline.py` to understand what normalization paths already exist, and whether they are compatible with v7 output or only work with older scraper versions.

**Inputs:**
- `/home/ricky/builds/buyback-monitor/sell_price_scraper_v7.js`
- `/home/ricky/builds/buyback-monitor/data/sell-prices-*.json` (latest)
- `/home/ricky/builds/buyback-monitor/generate_sell_lookup.py`
- `/home/ricky/builds/buyback-monitor/run_price_pipeline.py`
- `/home/ricky/builds/buyback-monitor/config/scrape-urls.json`

**Deliverable:** A markdown report at `/home/ricky/builds/buyback-monitor/docs/phase0/task1-scraper-to-pricefact.md` containing:
- Exact scraper v7 output schema (documented from real data)
- Proposed resolution algorithm: scraper output → Fair sell price per spec
- Gap analysis: which specs have no coverage
- Assessment: is v7 strong enough as canonical source, or what's missing

**Constraints:**
- Read-only. Do not modify any scripts.
- Do not make API calls. Work from existing output files.

---

## Task 2: Buyback SKU Parser Audit

**Goal:** Pull all active buyback SKU shapes, categorize them, and freeze parser rules for the canonical spec key.

**Steps:**

1. Read `buy_box_monitor.py` and document the current SKU parsing logic (the model family extraction and SKU-to-spec mapping).
2. Pull the most recent buy box results from `/home/ricky/builds/buyback-monitor/data/buyback/buy-box-*.json` (latest full run, not quick). Extract all unique `buyback_sku` values.
3. For each SKU, attempt to parse into the canonical format: `{family}.{year}.{chip}.{ram}.{storage}`. Document:
   - SKUs that parse cleanly
   - SKUs that are ambiguous (multiple possible interpretations)
   - SKUs that fail to parse
   - The percentage in each category
4. Cross-reference against the SKU model mapping table in `buy_box_monitor.py` (the one documented in README.md). Identify any active SKUs not covered by the current mapping.
5. Propose frozen parser rules: a deterministic mapping from every known buyback SKU pattern to a canonical spec key, or an explicit BLOCK for unparseable patterns.

**Inputs:**
- `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`
- `/home/ricky/builds/buyback-monitor/data/buyback/buy-box-*.json` (latest full run)
- `/home/ricky/builds/buyback-monitor/README.md`

**Deliverable:** A markdown report at `/home/ricky/builds/buyback-monitor/docs/phase0/task2-sku-parser-audit.md` containing:
- Complete inventory of active buyback SKU shapes (with counts)
- Parse success/ambiguous/fail breakdown with percentages
- Proposed frozen parser rules (deterministic, no guessing)
- List of SKUs that must be BLOCKed

**Constraints:**
- Read-only. Do not modify any scripts.
- Do not make API calls. Work from existing output files.

---

## Task 3: Cost Data Reality Audit

**Goal:** Determine what cost confidence is achievable per model by auditing real data on the Monday Parts Board and existing cost scripts.

**Steps:**

1. Read `build_cost_matrix.py` and `pull_parts_data_v3.py`. Document:
   - What cost data they produce
   - What source they pull from (Monday API, local files, hardcoded)
   - What output shape they write
   - What fallback/default behavior they use
2. Check for existing cost output files in `/home/ricky/builds/buyback-monitor/data/` (any cost matrix, parts cost, or similar JSON files).
3. Cross-reference against the Parts Board schema documented in `/home/ricky/kb/monday/parts-board.md`:
   - The `supply_price` column has data for ~1,240 of 1,802 rows
   - LCD parts are named `LCD {model}` (e.g. LCD A2337) — these are the primary cost driver for FUNC_CRACK devices
4. Cross-reference against the repair pricing in `/home/ricky/kb/pricing/macbook.md` — screen repair prices by model give a ceiling for what iCorrect charges, but the `supply_price` on the Parts Board gives actual part costs.
5. For each active buyback model family (MBA13, MBP14, MBP16, etc.), determine:
   - Is there a known LCD supply price on the Parts Board?
   - Is there a known battery supply price?
   - What's the gap between the flat estimates in `buy_box_monitor.py` (£120/£50/£170) and the real per-model costs?
6. Also check BM Devices Board lookup columns (`lookup_mkqg4gr8` Overall Grade, `lookup_mkqg1q79` Screen Grade, `lookup_mkqgq791` Casing Grade) for grade distribution data that would inform cost assumptions.

**Inputs:**
- `/home/ricky/builds/buyback-monitor/build_cost_matrix.py`
- `/home/ricky/builds/buyback-monitor/pull_parts_data_v3.py`
- `/home/ricky/builds/buyback-monitor/data/` (any cost-related output files)
- `/home/ricky/kb/monday/parts-board.md`
- `/home/ricky/kb/monday/bm-devices-board.md`
- `/home/ricky/kb/pricing/macbook.md`
- `/home/ricky/kb/parts/inventory-model.md`

**Deliverable:** A markdown report at `/home/ricky/builds/buyback-monitor/docs/phase0/task3-cost-data-audit.md` containing:
- What cost data actually exists today per model (from Parts Board `supply_price`, from cost scripts)
- Gap analysis: flat estimates vs real per-model costs
- Confidence levels achievable: which models have exact costs, which need family fallback, which must BLOCK
- Recommendation: is CostFact as defined in the rebuild plan achievable, or what needs to change

**Constraints:**
- Read-only. Do not modify any scripts.
- Do not make Monday API calls. Work from existing output files, scripts, and KB docs.

---

## Task 4: Shadow Mode Gate Definition

**Goal:** Define measurable thresholds that the new engine must hit before it can control live bids.

**Steps:**

1. Read the rebuild plan's Phase 5 (shadow mode) and acceptance criteria sections.
2. Pull stats from the most recent buy box run to establish baselines:
   - Total active listings
   - Win/loss distribution
   - How many listings currently use the £500 default sell price
   - How many listings have UNKNOWN model family
   - Current auto-bump volume per day
3. Define concrete gates with numeric thresholds:
   - **Exact match coverage:** what % of active listings must have an exact PriceFact (not fallback, not default)?
   - **Fallback rate:** what % of listings using lower-spec fallback is acceptable?
   - **Blocked rate:** what % of listings blocked due to missing data is acceptable vs a problem?
   - **Stale input rate:** how old can scraper data be before the engine must refuse to act?
   - **Decision divergence:** when running shadow vs live, what divergence % triggers investigation?
4. Cross-reference against the current system's known failure modes (from BUY-BOX-MONITOR-CRITIQUE.md and the QA review).

**Inputs:**
- `/home/ricky/builds/buyback-monitor/docs/TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md` (sections 9, 15, QA review)
- `/home/ricky/builds/buyback-monitor/docs/BUY-BOX-MONITOR-CRITIQUE.md`
- `/home/ricky/builds/buyback-monitor/data/buyback/buy-box-*.json` (latest full run)
- `/home/ricky/builds/buyback-monitor/data/buyback/buy-box-*-summary.md` (latest)

**Deliverable:** A markdown report at `/home/ricky/builds/buyback-monitor/docs/phase0/task4-shadow-mode-gates.md` containing:
- Current baseline metrics from the live system
- Proposed numeric gates for each dimension
- Rationale for each threshold
- What "pass" and "fail" look like concretely

**Constraints:**
- Read-only. Do not modify any scripts.
- Do not make API calls. Work from existing output files.

---

## Execution Notes

- Tasks 1-3 are independent and can run in parallel.
- Task 4 depends partially on the gap analyses from Tasks 1-3, but can start from existing data and be refined after.
- All deliverables go to `/home/ricky/builds/buyback-monitor/docs/phase0/`.
- All tasks are read-only investigations. No code changes, no API calls.
- After all four complete, we review findings together before deciding whether to proceed with engine build or address further gaps.

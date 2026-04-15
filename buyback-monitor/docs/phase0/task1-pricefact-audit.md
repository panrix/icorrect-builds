# Phase 0 Task 1: PriceFact Audit

Date: 2026-04-14  
Repo: `/home/ricky/builds/buyback-monitor/`  
Authoring basis: current code and data in this checkout, not prior session memory

## Executive summary

The current V7 sell-price pipeline is **not strong enough to serve as a canonical PriceFact source** for the buyback engine.

The pipeline rewrite itself is real and committed:
- **`0c3931d`** — `rewrite buyback pipeline for v7 scraper output`

But the current lookup output still has a massive coverage gap and unresolved pricing ambiguity:
- Current `data/sell-price-lookup.json` has **52 exact `by_spec` entries**.
- The latest buy-box run (`buy-box-2026-04-13.json`) contains **299 canonicalized specs** once SKU chip aliases are normalized.
- That means exact lookup coverage is only **52 / 299 = 17.4%**.

This is not a small edge-case shortfall. It is a structural gap.

## Files reviewed

- `data/sell-price-lookup.json`
- `generate_sell_lookup.py`
- `sell_price_scraper_v7.js`
- `buy_box_monitor.py`
- `/home/ricky/.openclaw/agents/main/workspace/data/buyback/buy-box-2026-04-13.json`
- `CODEX-V7-PIPELINE-REWRITE-BRIEF.md`
- `docs/BM-PRODUCT-PAGE-STRUCTURE.md`

## Current state of the pipeline

### V7 contract

The v7 scraper writes `sell-prices-*.json` as:
- top-level `scraped_at`
- top-level `models` dict
- per-model picker tables: `grades`, `ram`, `ssd`, `cpu_gpu`, `colour`, `size`

This part is working.

### Downstream rewrite status

The downstream rewrite described in `CODEX-V7-PIPELINE-REWRITE-BRIEF.md` has been implemented and committed in:
- **`0c3931d`**

That rewrite updated the pipeline to consume v7 natively rather than using an adapter shim.

## Exact evidence from current lookup output

Current file:
- `data/sell-price-lookup.json`

Top-level keys present:
- `generated_at`
- `source_file`
- `scrape_date`
- `default_sell_price`
- `by_spec`
- `by_family`
- `by_apple_model`

Current counts:
- **`by_spec`: 52**
- **`by_family`: 21**
- **`by_apple_model`: 12**

## Comparison against buy-box spec demand

Source file:
- `/home/ricky/.openclaw/agents/main/workspace/data/buyback/buy-box-2026-04-13.json`

From that run:
- total listings: **2603**
- unique raw first-6-part spec keys from SKU: **343**
- unique **canonicalized** specs after normalizing chip aliases like `APPLECORE`, `7CORE`, `8CORE`: **299**

So the current exact-spec lookup coverage is:
- **52 / 299 = 17.4% exact coverage**

This confirms the central finding: the lookup is far too sparse to act as a canonical per-spec source.

## The three gap classes

### 1. Catalogue / family mismatches

Some buyback families exist in active listings but do not have matching scraper families in the current catalogue and lookup path.

Examples:
- `MBA15.2024.M4.*` family appears in buy-box demand but is not represented as a matching exact family in the lookup.
- `MBP14.2024.M4*` and `MBP16.2024.M4*` families appear heavily in buy-box demand but are not covered by exact `by_spec` entries.
- Buy-box SKUs often encode chips as `APPLECORE`, `7CORE`, or `8CORE`, while the lookup emits normalized chip families like `M1`, `M2`, `M4`, `M1PRO`, etc.

Concrete symptom:
- buy-box canonical demand includes specs like `MBA13.2022.M2...` after normalization, but raw buy-box rows arrive as `MBA13.2022.M2.APPLECORE...`
- exact lookup keys and buy-box demand keys do not naturally meet without additional canonicalization logic

This is a contract mismatch, not just missing rows.

### 2. Missing picker values

Even when a model family exists in the scraper output, many buyback-demanded RAM / SSD / chip combinations are absent from the v7 picker tables or filtered out by the generator.

Examples from missing-family / missing-option pressure:
- top missing families include:
  - `MBP14.2023.M3MAX` (30 missing canonical specs)
  - `MBP16.2023.M2MAX` (25)
  - `MBP16.2023.M3MAX` (25)
  - `MBP14.2023.M2MAX` (20)
  - `MBP14.2023.M2PRO` (20)
  - `MBP14.2023.M3PRO` (16)
- additional missing sets appear for:
  - `MBA13.2024.M4`
  - `MBA15.2023.M2`
  - `MBP13.2022.M2`
  - `MBP14.2021.M1PRO`
  - `MBP16.2021.M1PRO`

The current generator also applies explicit RAM constraints in `allowed_ram_for_chip()`, for example:
- `M3PRO -> {18, 36}`
- `M3MAX -> {36, 48, 64, 128}`
- `M1PRO -> {16, 32}`
- `M1MAX -> {32, 64}`

Those rules help avoid impossible combinations, but they also expose how incomplete the picker evidence is. If the page only exposes some values, many valid buyback specs remain uncovered.

### 3. Unresolvable cross-picker price interactions

This is the hardest problem.

The v7 model output gives separate picker tables for:
- grade
n- RAM
- SSD
- chip/GPU
- colour
- size

But those picker tables do **not** define a full valid Cartesian matrix with trusted per-combination prices.

The current generator in `generate_sell_lookup.py` still has to guess. It does this by:
- choosing an anchor grade from available grade prices
- using picker prices as if they were anchor-grade prices for requested dimensions
- taking the **max** of available picker prices (`cpu`, `ram`, `ssd`, anchor) to synthesize a per-spec price
- then applying model-level grade deltas

That is an approximation, not a proof.

The code comments already admit the core issue:
- "V7 picker tables are not a full Cartesian matrix"
- earlier logic that stacked deltas created impossible synthetic combinations on mixed-chip pages

This remains unresolved.

## Concrete examples of unreliable or contradictory output

### Example 1: missing Fair on an active model

Lookup entry:
- `MBA13.2025.M4.16GB.256GB`

Current value:
- `fair: null`
- `good: 1042.0`
- `excellent: 1039.0`
- `premium: 1128.0`

Problems:
- no Fair price exists, even though the lookup is supposed to support Fair-driven price facts
- Good is higher than Excellent by only £3, which may be real, but there is no evidence chain in the lookup proving that relation for this exact spec

### Example 2: grade ordering inversion

Lookup entry:
- `MBA15.2023.M2.8GB.256GB`

Current value:
- `fair: 715.0`
- `good: 656.0`
- `excellent: 999.0`
- `premium: 950.0`

Problems:
- Good is lower than Fair
- Premium is lower than Excellent

That may occasionally happen in a marketplace, but as a synthesized canonical fact it is a warning sign that independent picker prices are being combined without a trustworthy per-spec interaction model.

### Example 3: extreme grade jump

Lookup entry:
- `MBP13.2022.M2.8GB.256GB`

Current value:
- `fair: 546.0`
- `good: 648.0`
- `excellent: 1200.0`

Problem:
- Excellent is more than double Fair, which strongly suggests the model-level grade delta is being transferred onto a spec combination that the picker tables do not actually validate.

## Why exact coverage is so low

The low coverage is not from one bug. It is the combination of all three gap classes:

1. **Key mismatch** between buyback SKU forms and lookup key forms
2. **Sparse picker coverage** for real RAM / SSD / chip variants demanded by live buyback listings
3. **No trustworthy interaction model** for combining chip, RAM, SSD, grade, colour, and size picker prices into one exact spec fact

Because of that, `by_spec` stays tiny and `by_family` / fallback logic end up carrying too much of the system.

## Assessment

### Is v7 strong enough as a canonical sell-price source?

**No, not yet.**

It is strong enough as:
- a structured market observation source
- a family-level reference source
- a candidate input to a future PriceFact engine

It is **not** strong enough today as:
- an exact canonical per-spec sell-price source for live decisioning

### What is missing

At minimum, a canonical PriceFact system still needs:

1. **Frozen canonicalization rules** between buyback SKUs and scraper families/chips
   - especially `APPLECORE`, `7CORE`, `8CORE`, and year/family quirks

2. **A validity model for picker combinations**
   - which RAM values are valid for which chips
   - which SSD values are valid for which chips / RAMs
   - which child models inherit which subsets of parent pickers

3. **A reliable rule for cross-picker pricing**
   - not just taking max picker price
   - not stacking deltas blindly
   - ideally backed by page-level UUID evidence or expanded catalogue traversal to real variant pages

4. **Coverage expansion**
   - current exact coverage at 17.4% is too low for live buying decisions

## Recommendation

Use the current v7 pipeline as a **research / enrichment layer**, not as canonical PriceFact truth.

Recommended next move:
- keep `0c3931d` as the correct infrastructure rewrite foundation
- do **not** treat the current `sell-price-lookup.json` as complete exact-spec truth
- build the next phase around:
  - explicit SKU canonicalization
  - coverage accounting per active buyback spec
  - hard BLOCKs when picker interaction cannot be proven
  - page/UUID-based validation for exact per-spec prices

## Bottom line

The rewrite is real and useful, but the current exact-spec output is still nowhere near production-safe as a canonical sell-price fact source.

**Current state:**
- V7 pipeline rewrite committed: **yes** (`0c3931d`)
- Exact lookup entries: **52**
- Canonicalized buyback-demand specs: **299**
- Exact coverage: **17.4%**
- Verdict: **not sufficient as canonical PriceFact source**

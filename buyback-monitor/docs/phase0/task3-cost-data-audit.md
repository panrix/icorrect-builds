# Phase 0 Task 3: Cost Data Audit

## Summary

The buyback monitor has been running all profit calculations on flat hardcoded cost assumptions, not real parts data. A cost lookup pipeline exists (`pull_parts_data_v3.py` + `build_cost_matrix.py`) but writes output to a workspace path outside the repo, and those files don't currently exist on disk. Additionally, the model-to-part-number mapping contains a confirmed bug: MBP16.2023.M2PRO/MAX maps to A2918, which is a 14-inch part number.

## Current Cost Implementation

**Location:** `buy_box_monitor.py` lines 114-119 and 432-440

**Hardcoded values:**

```python
PARTS_COST = {
    "FUNC_CRACK": 120,        # screen replacement
    "NONFUNC_USED": 50,       # board work, no screen
    "NONFUNC_CRACK": 170,     # screen + board
}
DEFAULT_PARTS_COST = 100
```

**Fallback logic (lines 432-440):**
- NONFUNC + CRACK: GBP 170
- NONFUNC only: GBP 50
- FUNC + CRACK: GBP 120
- All other: GBP 100

Line 386 emits a warning: "using flat estimates" when the parts lookup file isn't found.

**Cost lookup chain (when it works):**
- `load_parts_cost_lookup()` at line 759 loads `parts-cost-lookup.json`
- `get_parts_cost(grade, model, parts_lookup)` at line 816 looks up `{APPLE_MODEL}.{GRADE_KEY}`
- Falls back to flat values above when file is missing

## Cost Data Files

**In the repo (`data/` tree):**
- `data/buyback/buy-box-2026-04-*.json` (13 daily runs)
- `data/buyback/bumps-2026-04-*.json` (13 daily bid adjustments)
- `data/sell-prices-*.json` (27 files, Mar 18 to Apr 13)
- **Zero cost matrices, parts-cost lookups, or parts extracts**

**Expected by the monitor but missing:**
- `parts-cost-lookup.json` (simple `model.grade -> cost` map)
- `parts-raw-data.json` (raw parts board extract)
- `PARTS-COST-ANALYSIS-V2.md` (human-readable cost tables)

## Script Output Mismatch

| Script | Writes to | Expected by monitor |
|---|---|---|
| `pull_parts_data_v3.py` | `/home/ricky/.openclaw/agents/main/workspace/data/buyback/parts-raw-data.json` (line 39) | Not directly consumed |
| `build_cost_matrix.py` | `/home/ricky/.openclaw/agents/main/workspace/data/buyback/` (line 18) | `parts-cost-lookup.json` in same dir |

Both scripts write to the Jarvis workspace data directory, not the buyback-monitor repo. The monitor's `load_parts_cost_lookup()` looks for the file relative to its own `OUTPUT_DIR`, which is the repo's `data/buyback/` directory. Even if the scripts ran successfully, the monitor would not find their output.

## Mapping Bugs

**Confirmed: MBP16.2023 maps to wrong part number**

`buy_box_monitor.py` lines 64-65:
```python
"MBP16.2023.M2PRO": "A2918",   # ← A2918 is MBP14 (14-inch)
"MBP16.2023.M2MAX": "A2918",   # ← same wrong mapping
```

A2918 is the MacBook Pro 14-inch (2023, M2 Pro/Max). The correct 16-inch part number for 2023 M2 Pro/Max is **A2780**.

**Impact:** Any future per-model cost lookup for MBP16.2023 would pull 14-inch screen prices (GBP 206 per `build_cost_matrix.py` line 21) instead of 16-inch prices. Screen costs for 16-inch are typically higher.

**Also noted:** MBP14.2024 M4/M4PRO/M4MAX all map to A2918 (lines 59-61). This may be correct for some 2024 14-inch models but should be verified.

## Impact on Profit Calculations

Every daily buy-box run from Apr 1-13 used flat cost assumptions:
- A GBP 120 screen cost is applied uniformly to FUNC_CRACK regardless of whether it's an MBA13 (real cost ~GBP 90) or MBP16 (real cost ~GBP 199)
- This means: **MBA margins are understated by ~GBP 30, and MBP16 margins are overstated by ~GBP 79**
- NONFUNC grades use GBP 50 flat, which doesn't account for board-level repair variation by model
- The bid recommendations derived from these runs have been directionally useful but numerically unreliable

## Recommendations

1. **Fix the output path.** `build_cost_matrix.py` should write to the repo's `data/buyback/` directory, or the monitor should read from the workspace path. One source of truth.

2. **Fix the A2918 mapping.** MBP16.2023.M2PRO/MAX should map to A2780. Verify all 2024 mappings against Apple's current model number list.

3. **Build the CostFact contract.** The rebuild should define a `CostFact` that:
   - Sources LCD and battery prices from the Parts Board (Monday)
   - Produces a `{APPLE_MODEL}.{GRADE} -> GBP cost` lookup
   - Runs on a schedule (weekly) and commits output to the repo
   - Falls back to flat estimates only when a model is genuinely unknown, not as the default path

4. **Re-run profit analysis.** Once real costs are in place, re-run the last 2 weeks of buy-box data to see how margins shift. This will validate bid recommendations before any bid changes go live.

# Phase 0 Task 2: SKU Parser Audit

## Summary

The repo has three distinct parsing paths for SKU/listing data, each serving a different purpose. The canonical spec key format exists in `generate_sell_lookup.py` but is not used by the main monitor at runtime. The primary issue is the `APPLECORE` token: when a chip lacks a known core count, the parser inserts a literal `APPLECORE` placeholder that breaks any fixed-position extraction expecting `{model}.{year}.{chip}.{cores}.{ram}.{storage}`.

## Parser Locations

| Function | File | Lines | Purpose |
|---|---|---|---|
| `extract_model_family(sku)` | `buy_box_monitor.py` | 338-353 | Extracts prefix (MBA13, MBP14, MBP16) |
| `extract_apple_model(sku)` | `buy_box_monitor.py` | 356-365 | Maps SKU prefix to Apple model number via `SKU_TO_MODEL` dict |
| `sku_label(sku)` | `buy_box_monitor.py` | 443-457 | Human-readable label from dot-separated fields |
| `parse_model(title)` | `bid_order_analysis.py` | 66-114 | Parses Back Market listing titles via regex |
| `extract_model(device_name)` | `pull_parts_data_v3.py` | 84-89 | Extracts Apple model numbers (A\d{4}) from parts board names |
| `parsed_spec_to_lookup_key(parsed)` | `generate_sell_lookup.py` | 47-83 | Normalizes parsed specs to `{MODEL}.{YEAR}.{CHIP}.{RAM}.{STORAGE}` |

## Canonical Spec Format

Defined in `generate_sell_lookup.py` lines 48-57:

```
{MODEL}.{YEAR}.{CHIP}.{RAM}.{STORAGE}
```

Example: `MBA13.2022.M2.8GB.256GB`

Helper normalizers: `normalise_chip()` (lines 86-105), `normalise_storage()` (lines 108-118), `normalise_ram()`.

This format is used only by the sell-price lookup pipeline. The main monitor's `sku_label()` uses a different, longer format that includes core count and grade.

## Dataset

Source: `/home/ricky/builds/buyback-monitor/data/buyback/buy-box-2026-04-13.json` (latest run).

Daily buy-box files from Apr 1-13 available. SKU strings are dot-separated with the following shape:

```
{MODEL}.{YEAR}.{CHIP}.{CORES}.{RAM}.{STORAGE}.{FUNC_STATUS}.{SCREEN_STATUS}
```

## Parse Results

Across the Apr 13 dataset, SKUs fall into two structural categories:

- **With numeric core count:** `MBA13.2020.M1.7CORE.16GB.1000GB.FUNC.CRACK` (base M1/M2 chips)
- **With APPLECORE placeholder:** `MBP14.2021.M1MAX.APPLECORE.32GB.1000GB.NONFUNC.USED` (Pro/Max chips)

Both categories parse correctly through `sku_label()` because it splits on dots and reads positionally. The issue is downstream: any consumer expecting field 4 to always be a numeric core count will misparse APPLECORE entries.

## Failure Patterns

### 1. APPLECORE Token (Primary)
- **Affected:** All Pro/Max chip variants (M1PRO, M1MAX, M2PRO, M2MAX, M3PRO, M3MAX, M4PRO, M4MAX)
- **Example:** `MBA15.2022.M2PRO.APPLECORE.8GB.256GB.FUNC.CRACK`
- **Impact:** Field 4 is not a parseable core count. Any code that does `int(parts[3].replace('CORE',''))` will fail.
- **Root cause:** The scraper doesn't extract core count for Pro/Max chips, inserts a literal placeholder instead.

### 2. Dual Format Drift
- **Issue:** `generate_sell_lookup.py` uses a 5-field canonical key (`MODEL.YEAR.CHIP.RAM.STORAGE`) while the monitor SKUs use an 8-field format (`MODEL.YEAR.CHIP.CORES.RAM.STORAGE.FUNC.SCREEN`).
- **Impact:** No shared parser translates between the two formats. Each pipeline has its own extraction logic with no common contract.

### 3. Title Parsing (bid_order_analysis.py)
- `parse_model(title)` uses regex against Back Market listing titles (natural language, not structured SKUs).
- Screen size extraction: `r'(\d{2})["\u201d...]'` may match non-screen numbers.
- Output format (`MBP14 M3Pro`) doesn't align with either the canonical key or the monitor SKU format.

## Recommendations

1. **Define a single SpecKey contract** used by all pipelines: scraper, sell-price lookup, cost lookup, and the monitor. Proposed: `{MODEL}.{YEAR}.{CHIP}.{RAM}.{STORAGE}` (the generate_sell_lookup format, without core count or grade).

2. **Eliminate APPLECORE.** Either scrape the real core count or drop the core field entirely from SKUs. Core count isn't used in pricing logic.

3. **Grade as a separate dimension.** Keep `FUNC.CRACK` / `NONFUNC.USED` as a grade enum, not embedded in the SKU key. The SpecKey identifies the device; the grade identifies condition.

4. **Single parse function.** Replace the three parsing paths with one canonical `parse_sku(raw) -> SpecKey` that all pipelines call.

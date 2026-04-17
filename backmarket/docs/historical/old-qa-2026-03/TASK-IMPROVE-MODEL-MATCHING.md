# Task: Improve Model Name Matching Between Buy Box Check and Profitability Lookup

## Problem
Buy box check only matched 4/11 listings (36%) to the profitability lookup. The issue is model name normalization: BM listing titles don't match lookup keys.

## Examples of mismatches

BM listing title: `"MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB"`
Lookup key: `"MacBook Pro 13 M1 A2338|FAIR"`

BM listing title: `"MacBook Air 13-inch (2020) - Apple M1 8-core and 7-core GPU - 8GB RAM - SSD 256GB"`  
Lookup key: `"MacBook Air 13 M1 A2337|FAIR"`

## What needs to happen

The `matchProfitability()` function in `buy-box-check.js` needs to normalize BOTH:
1. The BM listing title (from the listings API)
2. The lookup key model name (from the profitability builder)

Into a common format that can be compared.

### Approach: Extract key identifiers from both sides

From BM title, extract:
- Family: "MacBook Pro" / "MacBook Air"
- Size: "13" / "14" / "15" / "16" (from "13-inch", "14-inch" etc)
- Chip: "M1" / "M2" / "M3" / "M4" / "M1 Pro" / "M1 Max" etc (from "Apple M1", "Apple M2 Pro" etc)

From lookup key, extract:
- Family: "MacBook Pro" / "MacBook Air"  
- Size: "13" / "14" / "15" / "16"
- Chip: "M1" / "M2" / "M3" / "M4" etc
- Model number: "A2337" / "A2338" etc (bonus info, not in BM titles)

Match on: Family + Size + Chip. That should cover ~90% of cases.

### Edge cases
- "MacBook Pro 13 M1 A2338" vs "MacBook Pro 13 M2 A2338": different chips, same model number. The A2338 is used for both M1 and M2. Match on chip, not model number.
- Intel models: BM title says "Core i5" / "Core i7", lookup says "Intel". Match on "Intel" as chip family.
- Pro/Max variants: BM title says "Apple M1 Pro 10-core" or similar. Lookup says "M1 Pro/Max A2442". Match on "M1 Pro" level.

### Grade matching
The listing's grade from BM API (`listing.grade`) maps to the lookup grade:
- `1` / `FAIR` → FAIR
- `9` / `GOOD` → GOOD  
- `10` / `VERY_GOOD` → VERY_GOOD

## Testing
Run: `node buy-box-check.js --auto-bump --dry-run`
Check how many listings now match to profitability data. Target: >80% coverage.

## File locations
- Buy box check: `backmarket/scripts/buy-box-check.js`
- Profitability lookup: `/home/ricky/builds/data/buyback-profitability-lookup.json`
- `matchProfitability()` function: ~line 62 in buy-box-check.js

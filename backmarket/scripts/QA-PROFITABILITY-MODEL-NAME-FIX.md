# Fix: Model Names + Match Rate in Profitability Builder

## Problem 1: Model names show "BM XXXX" instead of actual device

The script uses `item.name` from BM Devices Board as the model (e.g. "BM 1175"). This is just the Monday item name, not the device model.

### Fix

In Step 2 (Monday matching), when querying BM Devices Board (3892194968), add these columns to the query:

| Data | Column ID | Type | Fragment |
|------|-----------|------|----------|
| Device name | `lookup` | mirror | `... on MirrorValue { display_value }` — **THIS IS THE MODEL. Use this.** |
| RAM | `status__1` | status | `... on StatusValue { text }` |
| SSD | `color2` | status | `... on StatusValue { text }` |
| CPU | `status7__1` | status | `... on StatusValue { text }` |
| GPU | `status8__1` | status | `... on StatusValue { text }` |
| Colour | `mirror` | mirror | `... on MirrorValue { display_value }` |

**Use `lookup` (Device mirror) as the model name.** It returns values like:
- "MacBook Pro 14 M1 Pro/Max A2442"
- "MacBook Air 13 A2179"
- "MacBook Pro 13 M2 A2338"

Fall back to item.name ("BM XXXX") if `lookup` is empty.

### Lookup key format

Currently: `BM 1175|UNKNOWN`
Change to: `MacBook Air 13 M1 A2337|FAIR` (device name + BM grade)

The grade should come from the BM order data (already available in Step 1). Map BM grade values:
- `1` or `STALLONE` → NFC (Not Fully Checked)
- `2` or `BRONZE` → NFU (Not Fully Used)  
- `3` or `FAIR` → FC (Fair Condition)
- `9` or `GOOD` → GOOD
- `10` or `VERY_GOOD` → VERY_GOOD
- `11` or `EXCELLENT` → EXCELLENT

Actually, for the profitability lookup, use the grade as-is from the BM order (`orderlines[].grade`). The values are: FAIR, GOOD, VERY_GOOD. These match what SOP 06 uses for listing.

### Verified sample data (BM Devices Board):
```
BM 847  → "MacBook Pro 14 M1 Pro/Max A2442" | 16GB | 1TB | 10-Core CPU | 16-Core GPU | Space Grey
BM 995  → "MacBook Air 13 A2179" | 8GB | 256GB | Intel | Intel | Rose Gold  
BM 1041 → "MacBook Pro 13 M2 A2338" | 8GB | 256GB | Space Grey
BM 1050 → "MacBook Pro 13 4TB 3 A2251" | 16GB | 512GB | Intel | Space Grey
```

## Problem 2: 20% Monday match rate (101/496 listing IDs)

Only 101 out of 496 unique listing IDs from BM orders matched items on the BM Devices Board. The other 395 are older listings that pre-date the BM Devices Board.

### Fix

This is a data coverage issue, not a bug. For unmatched listings:
- Still include them in the lookup with whatever data we have from the BM order itself (sell price, purchase price, grade)
- Mark parts/labour as "unknown" (not £0, which implies zero cost)
- Use the BM order's `product` field for the model name if available

Check what the BM order response contains for model info:
```
GET /ws/orders?state=9
```
Each orderline should have `product` or `title` or `listing` fields that identify the device.

### Match rate improvement

The script currently searches BM Devices Board by `text_mkyd4bx3` (BM Listing ID). Some items may have the listing ID stored differently (with/without spaces, as number vs string). Log a few unmatched listing IDs and manually check if they exist on Monday under a different format.

## Priority

1. Model names (Problem 1) — high priority, makes the lookup usable
2. Match rate (Problem 2) — medium priority, improves accuracy but 101 matched items is enough to start

## Testing

After fix, run: `node buyback-profitability-builder.js --compare`

Expected output should show:
```
MacBook Air 13 M1 A2337 | FAIR    75  £383  £37  £28  £181  47.1%
```
Instead of:
```
BM 1175 | UNKNOWN                 75  £383  £0   £0   £181  47.1%
```

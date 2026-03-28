# Handoff: OpenClaw Listing Agent

**Date:** 28 Mar 2026
**From:** Code (orchestrator)
**For:** OpenClaw BM agent
**Priority:** CRITICAL — BM has zero live stock. 20 devices waiting to list.

---

## Context

The listing script has been rebuilt to clean-create only (Path B). No old listings are reused. Every listing is fresh with a verified SKU, correct grade, and safe pricing.

There are 20 devices in "To List" on Monday. Process them **one at a time** following SOP 06.

---

## What Changed

### Script location
```
/home/ricky/builds/backmarket/scripts/list-device.js
```

### Key changes from previous version
1. **Path A/A2 removed** — no more reactivating old dirty listings
2. **Always Path B** — fresh CSV create for every listing
3. **Draft first** — listings created at state=3 (offline) with safe placeholder price
4. **Price after creation** — backbox API called after listing exists, then publish with real price
5. **Catalog resolver** — uses `backmarket/data/bm-catalog.json` as single product source

### How to run
```bash
# Dry-run all To List items
cd /home/ricky/builds/backmarket
node scripts/list-device.js --dry-run

# Dry-run single item
node scripts/list-device.js --dry-run --item <mainBoardItemId>

# Live single item (one at a time only)
node scripts/list-device.js --live --item <mainBoardItemId>

# Override minimum margin (e.g. for low-margin devices Ricky approved)
node scripts/list-device.js --live --item <mainBoardItemId> --min-margin 0
```

---

## How to List Each Device (Follow SOP 06)

For each device, do this in order. Do NOT batch. One device at a time.

### 1. Dry-run first
```bash
node scripts/list-device.js --dry-run --item <id>
```

Review the output. Confirm:
- Catalog resolution is `verified` or `historical_verified`
- Product_id looks correct for the device
- Grade is correct (FAIR/GOOD/VERY_GOOD)
- SKU is clean and matches the device specs
- P&L makes sense (costs, fees, margins)

### 2. Check the grade ladder
The dry-run shows market prices per grade from the catalog. Verify:
- Fair < Good < Excellent (normal)
- If inverted: flag but don't block. Market anomaly, not our problem.
- If two grades within £10: flag (buyers will upgrade)

### 3. Check adjacent specs
Look at the dry-run pricing. Does the price make sense for this spec?
- A 16GB should cost more than an 8GB of the same model
- A 512GB should cost more than a 256GB
- If something looks wrong, stop and flag

### 4. Confirm P&L minimum
- Minimum £50 net profit for this run
- If below £50: flag for Ricky, do not list
- Use `--min-margin 0` when Ricky has approved a low-margin device

### 5. Go live
```bash
node scripts/list-device.js --live --item <id>
```

The script will:
1. Create draft listing via Path B (CSV)
2. Poll BM task until complete
3. Verify draft listing (grade, title, spec)
4. Get backbox price
5. Calculate final price (backbox → catalog → floor×1.5 fallback)
6. Publish with real price
7. Verify published listing
8. Update Monday

### 6. Verify on BM
After the script completes, check the listing on Back Market:
- Correct title/spec
- Correct grade
- Reasonable price
- Status: live

### 7. If something goes wrong
- Script verification fails → listing stays as draft, Monday NOT updated
- Backbox returns no data → uses catalog price or conservative placeholder
- Creation fails → no listing created, no Monday changes
- Any concern → leave it and flag for Ricky

---

## Devices Where Catalog Has No Exact Match

Some devices are blocked because the catalog doesn't have their exact colour or spec. For these:

### The family-member product_id approach

BM auto-resolves the correct catalog entry from ANY product_id in the same model family. This is proven (tested March 21, confirmed in n8n flow).

For a blocked device:
1. Look at why it's blocked (the dry-run shows the reason)
2. If the block is `needs_review` or `ambiguous` with candidates listed:
   - Check the candidates — do any match the device's actual spec?
   - If one candidate is clearly correct, note its product_id
3. If the block is `no catalog match`:
   - Check the catalog's `model_index` for the same model family
   - Any verified product_id from that family can be used as a reference

To list using a family-member product_id:
- This requires a manual approach since the script's auto-resolver won't pick it
- Run the dry-run to get the device specs
- Find a reference product_id from the catalog for that model family
- Create the listing manually using the BM API or ask Code to add a `--product-id` override flag

**Important:** After creating with a family-member product_id, the verification step MUST confirm BM assigned the correct title. If the title doesn't match the device specs, take it offline immediately.

---

## The 20 Devices

### Ready to list (catalog verified, net >= £50):
| # | Item ID | Device | Spec | Est. Net |
|---|---------|--------|------|----------|
| 1 | 11040565814 | BM 611 | MBP 16" M3Pro 18/512 Space Black Fair | £452 |
| 2 | 11127258151 | BM 1353 | MBP 13" i5 8/1TB Space Grey Fair | £115 |
| 3 | 11212780396 | BM 1400 | MBP 13" M1 16/2TB Space Grey Fair | £176 |
| 4 | 11081136614 | BM 1126 | MBP 13" M1 16/256 Space Grey Fair | £64 |
| 5 | 11322635134 | BM 1465 | MBP 13" M1 16/2TB Space Grey Fair | £120 |
| 6 | 11336799031 | BM 1482 | MBA 13" i5 8/512 Gold Fair | £153 |
| 7 | 11255069423 | BM 1422 | MBP 14" M3 16/512 Silver Good | £147 |
| 8 | 11486700952 | BM 1540 | MBP 14" M1Pro 16/512 Silver Excellent | £173 |
| 9 | 11380699456 | BM 1498 | MBP 13" M1 8/256 Silver Fair | £131 |
| 10 | 11419132229 | BM 1521 | MBA 13" M2 8/256 Silver Fair | £129 |
| 11 | 11497251610 | BM 1544 | MBA 13" M1 8/256 Space Grey Good | £75 |
| 12 | 11115903879 | BM 1349 | MBP 13" M1 8/512 Space Grey Fair | £54 |

### Below £50 net — flag for Ricky:
| # | Item ID | Device | Spec | Est. Net | Reason |
|---|---------|--------|------|----------|--------|
| 13 | 11281075018 | BM 1435 | MBA 13" M1 8/256 Space Grey Fair | £36 | Low margin |

### Blocked — needs manual resolution:
| # | Item ID | Device | Spec | Block Reason |
|---|---------|--------|------|-------------|
| 14 | 11347681287 | BM 1486 | MBA 13" i5 8/512 Space Grey Fair | Ambiguous catalog match (2 variants) |
| 15 | 11243991125 | BM 1418 | MBA 13" M2 8/512 Space Grey Excellent | No colour match (2 candidates) |
| 16 | 11336790508 | BM 1483 | MBP 16" M3Pro 36/1TB Space Black Excellent | Not in catalog at all |
| 17 | 11515569240 | BM 1409 | MBP 14" M3Pro 18/512 Silver Good | No colour match (1 candidate) |
| 18 | 11255056194 | BM 1429 | MBA 13" M2 8/256 Midnight Fair | No colour match (5 candidates) |
| 19 | 11195860904 | BM 1231 | MBA 13" i3 8/256 Space Grey Fair | Ambiguous catalog match (3 variants) |
| 20 | 11568991248 | BM 1533 | Unknown | No BM Device link on Monday |

### Suggested order
Start with the highest-value, highest-confidence devices:
1. BM 611 (exact_verified, £452 net, M3 Pro)
2. BM 1422 (exact_verified, £147 net, M3)
3. BM 1521 (exact_verified, £129 net, M2)
4. BM 1544 (exact_verified, £75 net, M1)
5. Then the rest in any order

---

## Pricing Rules (CRITICAL — Read This)

1. **The script creates listings as DRAFT first.** The placeholder price (floor × 2) never goes live.
2. **After creation, the script gets the real backbox price.** This is the buy box price — what we need to charge to win the listing.
3. **If backbox has no data** (new listing, no competitors yet), the script uses catalog grade prices or floor × 1.5 as a conservative placeholder.
4. **Never manually set a price from an old listing.** Old prices are stale.
5. **If a price looks wrong** (way too low for the spec), leave the listing as draft and flag it.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/list-device.js` | The listing script (run this) |
| `data/bm-catalog.json` | Canonical product catalog (309 variants) |
| `sops/06-listing.md` | SOP reference (Step 4 will be updated to reflect catalog resolver) |
| `docs/SPEC-LISTING-REBUILD-CLEAN-CREATE-2026-03-27.md` | Full rebuild spec |
| `docs/FIX-CATALOG-COLOUR-RESOLUTION-2026-03-27.md` | Colour enrichment details |

---

## Environment

```
Env: /home/ricky/config/api-keys/.env (or /home/ricky/config/.env)
Working dir: /home/ricky/builds/backmarket
Node: v22
```

---

## What NOT to Do

- Do NOT reactivate old listings (Path A is removed from the script)
- Do NOT batch multiple devices in one run
- Do NOT use old listing prices
- Do NOT skip the dry-run before going live
- Do NOT update Monday before verification passes
- Do NOT publish a listing if the price looks wrong
- Do NOT use `bm-scripts/` (deleted — `backmarket/scripts/` is the only copy)

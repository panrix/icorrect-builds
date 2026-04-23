# Back Market Pricing Architecture (Sold-Price Lookup)

Status: verified
Last verified: 2026-04-22
Verification method: live BM API queries, empirical condition-code derivation, end-to-end gate verification
Evidence sources:
- Session transcript 2026-04-22: scraper-grade-noise discovery + sold-lookup build (3 Codex iterations)
- Branch `fix/sold-price-lookup` worktree at `/home/ricky/builds-fix-sold-price-lookup`
- Live BM completed orders (state=9) 90-day window, 220 orderlines analysed

Purpose: document how pricing decisions are actually made after 2026-04-22. Supersedes implicit assumption that scraper grade-level prices are reliable market truth.

---

## TL;DR

- **The scraper (`/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`) is a single placeholder-price reference per model. It has NO reliable grade signal and NO RAM/SSD/CPU variant signal.** Do not trust `models[key].grades.Fair/Good/Excellent` — those three fields all point to the same product UUID with session-noisy pricing.
- **Real market truth lives in `data/sold-prices-latest.json`** — generated from 90 days of completed BM orders (state=9), aggregated per A-number × grade.
- **Default to Fair grade** when SKU-specific lookup fails. Most unit economics assume Fair-floor pricing because the majority of our sales clear at Fair.
- **Real margin formula** includes BM buy fee (10% of buy price), BM sell fee (10% of sell price), parts, labour (2hr × £24), shipping (£15), and VAT margin scheme (16.67% of gross). Easy to understate by omitting any of these.

---

## The scraper is noise (what we discovered)

On 2026-04-22 a spot-check on the Pro 14" 2021 M1 Pro price revealed:

```
Fair: £775  Good: £714  Excellent: £749
```

Excellent cheaper than Fair is impossible for real grade-stratified pricing. Further dump showed five of thirteen models had grade-order violations:

| Model | Fair | Good | Excellent | Observation |
|---|---|---|---|---|
| Air 13" 2025 M4 | £919 | £917 | £820 | Excellent < Good < Fair |
| Air 15" 2023 M2 | £681 | £626 | £783 | Good < Fair |
| Pro 14" 2021 M1 Pro | £775 | £714 | £749 | Good < Excellent < Fair |
| Pro 14" 2023 M3 | £958 | £1005 | £942 | Excellent < Good |
| Pro 16" 2021 M1 Pro | £795 | £747 | £815 | Good < Fair |

Root cause: the scraper reads the default-config product page for each model. All three "grades" resolve to the same `productId` (same UUID per grade). The recorded numbers are three session-noisy reads of one placeholder, not three grade-isolated samples.

### Implications for the pre-2026-04-22 gate

`buy_box_monitor.py:132-138` mapped BM trade-in grades (STALLONE/BRONZE/SILVER/GOLD/PLATINUM/DIAMOND) to scraper Fair/Good/Excellent. Every margin calc the acquisition gate ran since Phase 0.1 landed (2026-04-17) was against noise. Similarly `bm-grade-check/index.js` (port 8011) predicted a final grade then looked up that grade's price in the scraper — same failure mode.

**Do not rebuild anything on the assumption that scraper grade-level fields are reliable.** They are not, and will not be, unless the scraper itself is rebuilt to actually sample grade-specific listings (not currently scheduled).

---

## Sold-price lookup (the replacement)

Built 2026-04-22 over three Codex iterations on branch `fix/sold-price-lookup`.

### Data pipeline

`scripts/build-sold-price-lookup.js` — daily script:

1. Pulls completed BM orders (state=9) from last 90 days via `https://www.backmarket.co.uk/ws/orders?state=9`.
2. Flattens `orderlines[*]` into individual sale records with: `sku`, `price`, `condition`, `product`, `product_id`, `date`.
3. Derives condition-code → grade mapping empirically from the data (verified 2026-04-22): `10=Excellent, 11=Good, 12=Fair`. Mapping is profiled every run from the actual sample and halts if it doesn't converge.
4. Aggregates per **A-number × grade** (extracted from SKU or looked up via `A_NUMBER_MAP.json`). Collapses fragmented SKU formats like `MBP.A2338`, `MBP.M1A2338`, `MBP13.A2338M1`, `MBP13.A2338M2`, `MBP13.M1A2338` into a single `A2338` bucket.
5. Outputs `backmarket/data/sold-prices-latest.json`:

```json
{
  "generated_at": "2026-04-22T...",
  "lookback_days": 90,
  "condition_code_map": {"10": "Excellent", "11": "Good", "12": "Fair"},
  "by_sku": { "MBA.A2681.8GB.256GB.Midnight.Fair": {"grade":"Fair","count":6,"avg_price":529, ...} },
  "by_model": {
    "A2681": {
      "form_factor": "MBA13", "chip": "M2", "year": 2022,
      "grades": {
        "Fair": {"count":14,"avg_price":525,"median_price":518,"min":489,"max":599},
        "Good": {"count":7, ...}
      }
    }
  }
}
```

### Lookup chain (in `resolve_sell_price_from_sold_lookup`)

Order of preference:

1. `by_sku[full_sku]` — if `count >= 2`
2. `by_model[A_number]["grades"][grade]` — if `count >= 3`
3. **`by_model[A_number]["grades"]["Fair"]`** — if `count >= 3` (Fair-default fallback)
4. `by_model[A_number]["grades"][<highest-count grade>]` × 0.9 — penalised proxy when Fair has no samples
5. Return `None` → caller falls back to scraper (as a last resort)

### Consumer integration

Two consumers read the lookup:

- **`buyback-monitor/buy_box_monitor.py`** — buy-side acquisition gate. Calls `resolve_sell_price_from_sold_lookup(sku, grade)` before the scraper fallback.
- **`backmarket/services/bm-grade-check/index.js`** — sell-side profitability webhook (port 8011). Calls `resolveSellPriceFromSoldLookup(sku, grade)` before the scraper fallback.

Both respect `BM_PRICING_SOURCE` env flag: `sold_first` (default) or `scraper_only` (instant rollback).

### Trade-in SKU resolver (buy-side edge case)

BM trade-in SKUs do NOT contain A-numbers. Example: `MBP14.2021.M1PRO.APPLECORE.16GB.512GB.NONFUNC.CRACK`. Without the resolver the gate can't find a sold-lookup match for incoming bids.

Resolver extracts form (MBA13/MBP14/etc) + year + chip from the trade-in SKU, then inverts `A_NUMBER_MAP.json` to find the A-number. Falls back to parsing the listing title if SKU parse fails. Returns `None` if neither succeeds.

---

## The real margin formula

Easy to get wrong — I got it wrong twice this session. The full formula (in `buy_box_monitor.py:calc_profit`):

```
bm_buy_fee  = buy_price × 0.10       # BM charges 10% on trade-in purchase
bm_sell_fee = sell_price × 0.10      # BM charges 10% on resale
labour      = labour_hrs × £24       # default 2hr
shipping    = £15
gross       = sell_price - buy_price
tax         = gross × 0.1667         # UK VAT margin scheme (20/120)

net = sell_price - buy_price - bm_buy_fee - bm_sell_fee - parts_cost - labour - shipping - tax
```

**Common omissions:**
- Dropping `bm_buy_fee` (we pay 10% on the acquisition side, not just the sell side)
- Dropping VAT entirely, or computing it wrong (it's 20/120 of the gross, not 20% of the net)
- Assuming labour is always 2hr (real workshop jobs routinely go 3-4hr when extra parts surface; variance is a real risk)

### Fair-floor reality check

On 2026-04-22 five recent trade-ins were analysed at full formula:

| Order | Device | Paid | Fair Sell | Net | Margin |
|---|---|---|---|---|---|
| GB-26165-STCSE | MBP 14 M1 Max STALLONE | £120 | £722 | £184 | 28% |
| GB-26147-RPHON | MBA 2022 M2 BRONZE | £146 | £525 | £136 | 29% |
| GB-26146-ILGXA | MBA 2022 M2 SILVER | £196 | £525 | **£19** | **4%** |
| GB-26142-XLLNL | MBA 2022 M2 BRONZE | £172 | £525 | £111 | 24% |
| GB-26144-RBBPX | MBA 2020 M1 BRONZE | £97 | £385 | £79 | 23% |

Observations:
- None hit the 30% margin/£200 net "clean pass" threshold in `buy_box_monitor.py`. Current acquisition is running at a slim 20-30% margin, passing the hard floor not the target.
- The SILVER bid (£196) is essentially break-even once the full formula is applied. Your gut that Silver MBA 2022 is a structurally bad bid is confirmed — the grade premium we pay exceeds the Fair-floor sell uplift.
- STALLONE on high-value MBPs (M1 Max) remains the healthiest pattern.

---

## Cost-basis source of truth (Monday columns)

On BM Devices board, **use `numeric_mm1mgcgn`** (total cost all-in) — NOT Main Board `numeric` which only records purchase price (often £0 for trade-ins).

Post-refurb, BM Devices `numeric_mm1mgcgn` is authoritative because it aggregates purchase + parts + labour + shipping into one number. Main Board has per-line breakdown:

- `numeric` — raw purchase price (£0 for BM trade-ins)
- `lookup_mkx1xzd7` — parts cost (CSV, sum the values)
- `formula_mkx1bjqr` — labour cost (£-value)
- `formula__1` — labour hours (for fallback at £24/hr)

Populated by the workshop post-refurb. **If `numeric_mm1mgcgn` is empty on a BM Devices item, the device hasn't been costed yet — skip it in any profitability analysis** (saw 9 of 11 TO_LIST items in this state on 2026-04-22, data blind).

---

## Open known issues

1. **Phase 5.2 in PLAN.md is obsolete.** It proposes a per-SKU cost lookup keyed on scraper pricing. Needs re-scoping after the sold-lookup replaces that input entirely.
2. **Phase 2.1 scraper-diff alerting** is still unbuilt. Without it, a scraper data quality regression (e.g. another grade-order violation) will silently skew the fallback path.
3. **Cron for `build-sold-price-lookup.js` is NOT installed.** Proposed line: `15 2 * * * cd /home/ricky/builds/backmarket && /usr/bin/node scripts/build-sold-price-lookup.js --live >> /home/ricky/logs/backmarket/sold-price-lookup.log 2>&1`
4. **Branch `fix/sold-price-lookup` not merged** to master. Everything in this doc describes the branch state, not live production state.
5. **SKU taxonomy drift** (`MBP.A2338` vs `MBP.M1A2338` vs `MBP13.A2338M1`) is collapsed at lookup time, but the underlying Monday board still has inconsistent SKU formats. Cleanup is deferred — not blocking.

---

## For future-me

- Don't default to "run the scraper gate on this bid" — use sold-lookup. The scraper is a fallback, not the source of truth.
- If a question involves Fair sell price for a specific model, read `sold-prices-latest.json` by A-number. If the file is stale (check `generated_at`), re-run `build-sold-price-lookup.js --live` first.
- If a bid doesn't resolve via the trade-in SKU resolver, don't silently let scraper answer — log it as a miss so we can improve the resolver.
- The real failure mode to watch for is scraper drift dragging the gate in the wrong direction when sold-lookup returns null. Any analysis where the answer comes from the scraper fallback deserves a disclaimer.

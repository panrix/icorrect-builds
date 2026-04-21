# Brief: SOP 6 & SOP 7 Pricing Intelligence Upgrades
*Date: 2026-03-29*

---

## Context

Two related improvements to how SOP 6 and SOP 7 surface pricing data. They share a scraping mechanism but serve different purposes:

- **SOP 6** is a **proposal**. Before a device goes live, we want to know: is this the right price? What does the market look like right now? What have we sold this model for before?
- **SOP 7** is a **live status check**. The device is already listed. Are we winning the buy box? If not, what does it cost to win, and can our P&L survive it?

The card format in each SOP should reflect that intent.

---

## Change 1: Grade Ladder Scrape (SOP 7)

### Problem
SOP 7 currently uses only the BackBox API (`GET /ws/backbox/v1/competitors/{uuid}`). This returns `price_to_win` for our own grade only. It does not show what Fair, Good, or Excellent are selling for, nor adjacent spec prices. The QA notes in SOP 7 flag this as a known gap ("grade check still uses approximate V7 data").

### Solution
For each active listing in SOP 7, scrape the BM product page to fetch the full grade and spec price ladder from `__NUXT_DATA__`. Same V7 scraper infrastructure already used in SOP 6.

### Implementation

1. After Step 2 (variant integrity check), resolve the product page URL from `bm-catalog.json`.
2. Call V7 scraper on that URL. Extract:
   - Fair / Good / Excellent lowest prices for that model + spec + colour
   - Adjacent storage tier prices (e.g. if we're selling 256, also pull 512 pricing)
3. Deduplicate: one scrape per unique `product_id`. Multiple listings may share a product page.
4. Attach extracted ladder to the listing's working object for use in Steps 5, 9, and 11.
5. Step 5 (not winning): use the ladder to enrich Telegram alerts (see card format below).
6. Step 9 (grade ladder integrity check): replace approximate scraper matching with this spec-accurate scrape. This closes the known QA gap.

### Constraints
- Scrape failures are non-blocking. If scrape fails, proceed with BackBox data only. Log the failure. Output grade ladder fields as `N/A` in the card.
- Add `--no-scrape` flag to skip all product page scrapes (for fast runs / debugging).
- Delay 200-300ms between scrape calls.
- Reuse V7 scraper logic from `backmarket/scripts/`. Do not duplicate it.

---

## Change 2: Historical Sales Lookup (SOP 6)

### Problem
All listings are now clean-creates (new listing slots, no history). SOP 6 has no prior sales data to inform whether the proposed price is sensible. The current card only shows the market scrape and P&L at the proposed price.

### Solution
Before publishing, query the BM orders API for our own sales history for the same model + grade over the last 90 days. Surface this alongside the market data in the SOP 6 proposal card.

### Implementation

1. New function: `fetchSalesHistory(productId, grade, days = 90)`.
2. Call `GET /ws/orders` paginated, filtering to completed states (state=4 delivered, state=9 complete). Pull all orders in the last 90 days.
3. Match orders to the target `product_id` + grade via `orderlines[].listing_id` → lookup listing's product_id and grade.
4. Compute per-model-grade:
   - Units sold (count)
   - Average sale price
   - Median sale price
   - Fastest / slowest / average days to sell (date_listed to date_sold, if available)
5. Cache results in memory during the run (avoid re-querying for the same product_id+grade).
6. If no history found (new model, never sold before): output `No sales history (new model)` — do not block.

### Note on data availability
The BM orders API returns completed orders. Date-listed is on Monday (`date_mkq385pa`). Days-to-sell requires cross-referencing Monday for the listing date. If Monday lookup fails, omit days-to-sell, do not block.

---

## Change 3: Card Formats

### Card Spec Rule (both SOPs)
> The Telegram message format defined in each step is the **minimum required output**. Scripts must not omit fields. If data is unavailable, output the field as `N/A` — do not silently drop the line.

---

### SOP 6 — Step 13 Proposal Card

```
✅ Listing proposal: MacBook Air M2 8/256 Midnight Good
BM#: 1234567 | Path: B
Proposed price: £499 | Min: £484
Net@min: £167 (34.5%) | Cost basis: £316
  └ Purchase £280 + Parts £20 + Labour £0 + Ship £16

Market now:  Fair £389 | Good £479 | Excellent £549
Our history: 4 sold @ avg £492 | avg 8 days to sell

Monday: #BM-1491 updated ✓
```

This is a **proposal**. It is surfaced before publishing so pricing can be verified. The "Market now" and "Our history" lines are the context Ricky needs to validate the price is sensible.

---

### SOP 7 — Per-Listing Alert Cards

**Not winning — bump eligible:**
```
⚠️ Not winning: MacBook Air M1 8/256 Space Grey Good
BM#: 1234567 | Listed: 12 days
Our price: £449 | Buy box: £419

Market:  Fair £369 | Good £419 | Excellent £499
Net@win: £121 (28.8%) | Net@current: £141 (31.4%)

Action: Bump eligible (15-30% tier) — flagged for review
```

**Not winning — cannot win profitably:**
```
🚫 Cannot win profitably: MacBook Pro 14 M3 Pro 18/512 Space Black Good
BM#: 7654321 | Listed: 9 days
Our price: £1,299 | Buy box: £1,149

Market:  Fair £999 | Good £1,149 | Excellent £1,349
Net@win: £84 (7.3%) — below 15% floor
Break-even price: £1,198

Action: No change. Monitor.
```

**Winning:**
```
✅ Winning: MacBook Air M2 8/256 Midnight Good
BM#: 1234567 | Price: £499 | Net: £167 (34.5%)
Market:  Fair £389 | Good £479 | Excellent £549
```

The SOP 7 cards are **live status**. Primary question is always: winning or not? Secondary: what does winning cost, and is it viable?

---

## SOP Updates Required

After implementation:

1. **SOP 6 Step 13**: Replace current 3-line card with the proposal card format above. Add "Historical sales lookup" as a new step before Step 13.
2. **SOP 7 Step 5 / Step 11**: Replace inline format references with the cards above. Retire the QA note about approximate grade ladder data.
3. **SOP 7 API table**: Add product page scrape as a step in the flow (after Step 2, before Step 3).

---

## Files

| File | Role |
|------|------|
| `backmarket/scripts/buy-box-check.js` | SOP 7 implementation |
| `backmarket/scripts/list-device.js` | SOP 6 implementation |
| `backmarket/scripts/scrape_bm_product.py` (or JS equivalent) | V7 scraper — reuse, don't duplicate |
| `backmarket/data/bm-catalog.json` | Product URL resolution |
| `backmarket/sops/06-listing.md` | SOP to update post-implementation |
| `backmarket/sops/07-buy-box-management.md` | SOP to update post-implementation |

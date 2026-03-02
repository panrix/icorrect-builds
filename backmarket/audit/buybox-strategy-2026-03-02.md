# Buybox Strategy & Price Increase Analysis

**Date:** 2 March 2026
**Data sources:** 715 crossref orders (Apr 2025 - Feb 2026), BM listings CSV (26 Feb), live API (4,919 listings)
**Scripts:** `api/bm-bid-bump.py` (new), `api/bm-listing-optimizer.py`, `api/bm-reprice.py`
**Audit data:** `audit/buybox-audit-2026-03-01.json`, `audit/bid-bump-plan-2026-03-02.json`

---

## Executive Summary

We already win 88% of buyboxes (44 of 50 survivor SKUs). Blind bid bumping would increase costs without gaining orders. The November 2025 price increase drove +63% more orders and +23% more total profit, but FUNC.CRACK and NONFUNC.CRACK margins got squeezed (-30% and -45% per order). NONFUNC.USED is the only grade where margins improved (+10%) after the price increase.

**Action needed:** Fresh BM listings CSV export to get current buybox positions (the Feb 26 data is pre-repricing). Upload to `builds/backmarket/docs/`.

---

## 1. November Price Increase — Did It Work?

Around November 2025, bid prices were increased across the board on BM's advice ("higher prices = more send-ins").

### Monthly order volume

| Month | Orders | Avg Purchase | Avg Net | Monthly Net |
|-------|--------|-------------|---------|-------------|
| Jul 2025 | 73 | £98 | £155 | £11,295 |
| Aug 2025 | 62 | £89 | £193 | £11,976 |
| Sep 2025 | 63 | £92 | £185 | £11,676 |
| Oct 2025 | 57 | £103 | £175 | £9,949 |
| **Nov 2025** | **84** | **£115** | **£133** | **£11,174** |
| Dec 2025 | 98 | £130 | £167 | £16,407 |
| Jan 2026 | 129 | £134 | £108 | £13,903 |
| Feb 2026 | 47* | £117 | £39 | £1,839 |

*Feb data is partial (1-19 Feb only). Feb net is low because many devices haven't sold yet.

### Pre vs post summary

| Period | Orders/month | Avg Purchase | Avg Net | Monthly Net |
|--------|-------------|-------------|---------|-------------|
| **Pre (Jul-Oct)** | 64 | £95 | £176 | £11,224 |
| **Post (Nov-Jan)** | 104 | £128 | £133 | £13,828 |
| **Change** | **+63%** | **+£33 (+35%)** | **-£43 (-24%)** | **+£2,604 (+23%)** |

**Verdict:** BM was right at the aggregate level. More volume, more total profit. But per-order margins dropped significantly.

---

## 2. Grade-Level Impact

### Orders and margins by BM grade

| Grade | Pre Orders (4m) | Post Orders (3m) | Change | Pre Net/Order | Post Net/Order | Net Change |
|-------|----------------|-----------------|--------|--------------|---------------|------------|
| **NONFUNC.USED** | 95 | 90 | -5% | **£194** | **£213** | **+10%** |
| FUNC.CRACK | 123 | 139 | +13% | £164 | £115 | **-30%** |
| NONFUNC.CRACK | 34 | 44 | +29% | £178 | £98 | **-45%** |
| OTHER* | 3 | 38 | +1167% | £71 | £53 | -25% |

*OTHER = 42 orders with no matching listing SKU (data quality issue — orders couldn't be matched to trade-in data)

**Key finding:** NONFUNC.USED is the only grade where the price increase improved per-order margins. The higher purchase price was offset by higher-quality devices (higher sale prices). FUNC.CRACK and NONFUNC.CRACK margins got compressed — we're paying more but not selling for proportionally more.

### NONFUNC.USED — top SKU detail

| SKU | Pre# | Pre Purch | Pre Net | Post# | Post Purch | Post Net |
|-----|------|----------|---------|-------|-----------|---------|
| MBA M1 7C 8/256 NFU | 4 | £40 | £222 | 19 | £80 | £120 |
| MBA I3 8/256 NFU | 13 | £63 | £132 | 1 | £58 | £239 |
| MBP13 I5 8/256 NFU | 9 | £63 | £169 | 3 | £69 | £154 |
| MBA M2 8/256 NFU | 8 | £82 | £307 | 4 | £101 | £300 |
| MBP13 M1 8/256 NFU | 4 | £81 | £245 | 6 | £86 | £203 |

MBA M1 8/256 NFU went from 4 to 19 orders — purchase doubled (£40→£80) but total net went from £888 to £2,280 (+157%). This SKU alone validates the price increase for NFU.

### FUNC.CRACK — top SKU detail

| SKU | Pre# | Pre Purch | Pre Net | Post# | Post Purch | Post Net |
|-----|------|----------|---------|-------|-----------|---------|
| MBA M1 7C 8/256 FC | 33 | £102 | £128 | 51 | £111 | £79 |
| MBP13 M1 8/256 FC | 14 | £117 | £169 | 11 | £135 | £127 |
| MBA I3 8/256 FC | 16 | £102 | £112 | 5 | £85 | £62 |
| MBP14 M1Pro 16/512 FC | 7 | £211 | £284 | 8 | £219 | £243 |
| MBA M2 8/256 FC | 3 | £146 | £208 | 11 | £166 | £120 |

MBA M1 8/256 FC is the biggest FC volume SKU: +55% more orders but total net was flat (£4,224 → £4,029). More orders, same profit. MBA M2 8/256 FC tripled in volume but net/order dropped from £208 → £120.

---

## 3. Ricky's Flagged SKUs

### MBP14 M1Pro 16/512 FC — bid £273, PTW £211, overpay £62

| Month | Orders | Avg Purchase | Avg Net |
|-------|--------|-------------|---------|
| Jul | 2 | £206 | £296 |
| Aug | 2 | £206 | £319 |
| Sep | 1 | £206 | £307 |
| Oct | 2 | £223 | £227 |
| **Nov** | **3** | **£185** | **£223** |
| Dec | 2 | £226 | £307 |
| Jan | 3 | £248 | £220 |

**Verdict:** Steady 1-3 orders/month before AND after the price increase. No volume boost from higher bids. The £62 overpay above the 2nd bidder (PTW £211) is not driving more orders — it's just costing £62 × ~16 orders/quarter = ~£331/quarter wasted. Could reduce bid closer to £220 and keep the buybox.

### MBP13 M1 16/512 FC — bid £174, PTW £157, overpay £17

| Month | Orders | Avg Purchase | Avg Net |
|-------|--------|-------------|---------|
| Jul | 1 | £154 | £218 |
| Sep | 1 | £154 | £221 |
| Nov | 1 | £140 | £307 |
| Dec | 2 | £158 | £250 |
| Jan | 1 | £158 | £151 |

**Verdict:** Steady 1-2/month, purchase price flat. £17 overpay is minor. This one is fine.

---

## 4. Buybox Positions (Feb 26 CSV — pre-repricing)

### Survivors: 44 winning, 5 losing, 1 unknown

**We already own 88% of buyboxes.** The 5 losers:

| SKU | Our Bid | PTW | Gap | Dem | Can Afford? |
|-----|---------|-----|-----|-----|------------|
| MBP13 M2 8/256 NFU | £124 | £127 | +£3 | 9 | **YES** (max £148) |
| MBA I5 8/256 FC | £2 | £60 | +£58 | 8 | NO (max £2) |
| MBA M2 24/512 NFU | £98 | £192 | +£94 | 1 | NO (max £98) |
| MBA I3 16/512 NFC | £16 | £69 | +£53 | 1 | NO (max £17) |
| MBA15 M2 8/256 NFU | £189 | £122 | ??? | 1 | Data inconsistent |

**Only 1 actionable loser:** MBP13 M2 8/256 NFU — bump +£3 to win 9 orders/quarter.

### Top overpayers (winning but bidding above 2nd place)

| SKU | Our Bid | 2nd Bidder | Waste | Demand | Wasted £/qtr |
|-----|---------|-----------|-------|--------|-------------|
| MBP14 M1Pro 16/512 FC | £273 | £211 | **£62** | 16 | **£331** |
| MBA M1 8/256 NFU | £111 | £85 | **£26** | 47 | **£406** |
| MBP13 M1 8/256 NFU | £100 | £85 | **£15** | 53 | **£265** |
| MBP13 M2 16/256 FC | £204 | £185 | **£19** | 1 | £6 |
| MBP16 M2Pro 16/1TB FC | £258 | £240 | **£18** | 1 | £6 |
| MBP13 M1 16/512 FC | £174 | £157 | **£17** | 11 | **£62** |
| MBP13 M1 8/256 NFU | £100 | £85 | **£15** | 53 | **£265** |
| MBP13 M1 16/512 NFU | £115 | £100 | **£15** | 5 | £25 |

**Estimated overpay on winning high-demand SKUs: ~£1,100+/quarter.**

### Fishing lines: ALL 19 winning buybox

All fishing line SKUs (M1+ DEAD with demand) are winning their buyboxes and getting orders. Top 5 by demand:

| SKU | Price | BB Price | Demand | Received | To Be Sent |
|-----|-------|---------|--------|----------|-----------|
| MBP13 M1 16/256 NFU | £109 | £109 | 8 | 2 | 6 |
| MBP16 M1Pro 16/512 FC | £213 | £211 | 6 | 0 | 6 |
| MBA M2 16/256 NFC | £100 | £100 | 5 | 1 | 4 |
| MBP14 M1Pro 16/512 NFC | £120 | £120 | 4 | 2 | 1 |
| MBA15 M2 8/256 FC | £219 | £175 | 4 | 0 | 3 |

These need P&L data (crossref refresh) to determine if they're profitable at current prices.

---

## 5. Revised Strategy

### What NOT to do
- ~~Blind £50 bumps across all SKUs~~ — we're already winning 88% of buyboxes
- ~~Bump FUNC.CRACK bids~~ — margins already compressed -30% since November

### What TO do (pending fresh CSV)

**Immediate (no CSV needed):**
1. **Win MBP13 M2 8/256 NFU** — bump £124 → £128 (+£4). Wins 9 orders/quarter.

**With fresh CSV export:**
2. **Reduce overpay on high-demand winners** — save ~£1,100/quarter by dropping bids closer to PTW+£10:
   - MBP14 M1Pro 16/512 FC: £273 → ~£225 (saves £48/device × 16/qtr = £256)
   - MBA M1 8/256 NFU: £111 → ~£95 (saves £16/device × 47/qtr = £250)
   - MBP13 M1 8/256 NFU: £100 → ~£90 (saves £10/device × 53/qtr = £177)
3. **Verify all buybox positions post-repricing** — our March 1 repricing changed 365 prices, buybox landscape may have shifted
4. **Get P&L for fishing line SKUs** — refresh crossref, calculate max offers for the 19 winning fishing lines

**Strategic:**
5. **Push NONFUNC.USED volume** — only grade where higher prices improved margins. Increase bids here where we have headroom AND aren't winning.
6. **Hold or reduce FUNC.CRACK bids** — volume grew but margins compressed. Don't pay more for the same total profit.

---

## 6. Scripts Available

| Script | Purpose | Command |
|--------|---------|---------|
| `bm-bid-bump.py` | Incremental bid bumping with configurable strategy | `python3 api/bm-bid-bump.py --audit audit/buybox-audit-2026-03-01.json` |
| `bm-listing-optimizer.py` | Phase 1 decisions (KEEP/REPRICE/DELIST/DEAD) | `python3 api/bm-listing-optimizer.py` |
| `bm-reprice.py` | Phase 3 execution (reprice/zero) | `python3 api/bm-reprice.py --decisions <file> --execute` |
| `bm-crossref.py` | Refresh crossref data (orders + Monday match) | Needs updated CSV exports |

### Bid bump script flags
```bash
--audit PATH       # Buybox audit JSON (required)
--increment N      # Max bump per SKU in £ (default: 50)
--min-bump N       # Minimum bump to bother with (default: 15)
--buffer N         # Headroom buffer above net floor (default: 5)
--grade GRADE      # Only bump this grade (NONFUNC.USED, FUNC.CRACK, etc.)
--execute          # Actually update prices (default: dry-run)
--limit N          # Process first N changes only
```

---

## 7. What the Next Code Session Needs

### From Ricky
1. **Fresh BM listings CSV export** — upload to `builds/backmarket/docs/`. Must contain `buybox_price`, `is_buybox`, `price_to_win` columns.
2. **Decision on MBP14 M1Pro FC** — reduce bid from £273 to ~£225? Data shows overpay isn't driving more orders.
3. **Decision on MBP13 M2 8/256 NFU** — bump +£4 to win buybox? 9 orders/quarter at stake.

### For Code to do
1. **Re-run buybox analysis with fresh CSV** — map all survivor + fishing line buybox positions post-repricing
2. **Build overpay reduction plan** — identify all SKUs where we're bidding significantly above PTW on high-demand SKUs
3. **Calculate fishing line P&L** — if crossref data can be refreshed, calculate max offers for the 19 winning fishing lines
4. **Execute bid changes** — the `bm-bid-bump.py` script is ready, just needs updated buybox data to target correctly

### Remaining tasks from build-tasks.md
- **Task 16: Bid bumping** — strategy revised, pending fresh CSV
- **Task 17: Fishing line promotion** — 19 SKUs winning buybox, need P&L data
- **Task 20: Stuck device triage** — 24 devices 30+ days, £2,150 capital
- **Task 21: FUNC.CRACK returns** — 18 returned devices need return reason analysis

---

## COMPROMISES

- **Buybox data is from Feb 26** — 4 days before our March 1 repricing (365 changes). Competitive positions may have shifted. Fresh export needed before executing any changes.
- **Crossref only includes matched/received orders** — orders that were placed but never sent (cancelled, no-shows) are not in this data. True send-in rate can't be calculated from crossref alone.
- **42 "OTHER" orders post-Nov** — these had no matching listing SKU. They're real orders but we can't analyse their profitability by grade. Data quality issue.
- **Pre/post comparison isn't perfectly controlled** — seasonal effects (Nov-Jan includes Black Friday, Christmas) may inflate post-period volume independently of the price increase.
- **Overpay reduction carries risk** — reducing to PTW+£10 assumes competitors don't bump. If a competitor bumps above our new bid, we lose the buybox. The safe approach is small reductions, monitor, repeat.
- **Per-order net for recent months (Jan-Feb) is understated** — many devices haven't sold yet, so net shows £0 or low values. The per-order figures for Oct-Dec are more reliable.

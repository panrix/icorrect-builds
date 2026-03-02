# Buybox Strategy & Price Increase Analysis

**Date:** 2 March 2026 (updated with March 2 CSV + executed bumps)
**Data sources:** 715 crossref orders (Apr 2025 - Feb 2026), BM listings CSV (2 Mar), live API (4,919 listings)
**Scripts:** `api/bm-bid-bump.py` (new), `api/bm-listing-optimizer.py`, `api/bm-reprice.py`
**Audit data:** `audit/buybox-audit-2026-03-01.json`, `audit/buybox-bump-log-2026-03-02.json`

---

## Executive Summary

The March 1 repricing dropped us from 44 → 37 winning buyboxes. 7 losses were Intel zeroing (by design). 4 high-demand FUNC.CRACK SKUs lost buybox because repricing dropped prices too aggressively — but crossref data proved all 4 are profitable at PTW. We bumped all 4 back + won 1 new NFU buybox on March 2 (18 listings, all 202 OK).

The November 2025 price increase drove +63% more orders and +23% more total profit, but FUNC.CRACK and NONFUNC.CRACK margins got squeezed (-30% and -45% per order). NONFUNC.USED is the only grade where margins improved (+10%).

**Overpay eliminated:** The March 1 repricing cleaned up all significant overpay on winning SKUs (was ~£1,100/qtr waste).

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

## 5. Post-Repricing Buybox Recovery (March 2)

### What happened
The March 1 repricing dropped 365 prices. The optimizer calculated some FC SKUs couldn't make minimum margin at their old prices, so it dropped them aggressively. But the net calculations were based on the *repriced* bid, not on what we'd *actually pay* at PTW. Crossref showed all 4 lost FC SKUs are profitable at PTW.

### Executed bumps (18 listings, all 202 OK)

| SKU | Old Bid | New Bid | PTW | Projected Net | Demand |
|-----|---------|---------|-----|---------------|--------|
| MBP13 M1 8/256 FC | £34 | **£91** | £90 | £195 | 31/qtr |
| MBA M2 8/256 FC | £66 | **£100** | £99 | £227 | 24/qtr |
| MBP13 M1 8/512 FC | £53 | **£91** | £90 | £207 | 12/qtr |
| MBA M1 16/256 FC | £4 | **£91** | £90 | £183 | 8/qtr |
| MBP13 M2 8/256 NFU | £117 | **£123** | £122 | £250 | 9/qtr |

**Recovered: ~84 orders/quarter, ~£1,287/month projected profit**

### Remaining losses (can't win profitably)

| SKU | Our Bid | PTW | Gap | Reason |
|-----|---------|-----|-----|--------|
| MBA M2 24/512 NFU | £98 | £185 | +£87 | 1 demand, PTW too high |
| 7 Intel SKUs | £0 | £0 | - | Zeroed by design |

### Overpay status
Repricing eliminated all significant overpay on winning SKUs. Previously ~£1,100/qtr waste.

---

## 6. Revised Strategy (updated)

### What NOT to do
- ~~Blind £50 bumps across all SKUs~~ — we're already winning most buyboxes
- ~~Trust optimizer net figures blindly~~ — they use current bid, not historical purchase price. Crossref is the source of truth.

### What TO do next
1. **Monitor recovered FC buyboxes** — confirm we're winning again in next CSV export
2. **Get P&L for fishing line SKUs** — refresh crossref, calculate max offers for 19 winning fishing lines
3. **Push NONFUNC.USED volume** — only grade where higher prices improved margins
4. **Watch for competitor responses** — if competitors bump above our new bids, reassess

---

## 7. Scripts Available

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

## 8. What's Next

### Done this session
- Fresh CSV uploaded (March 2) and analysed
- 5 buybox recoveries executed (18 listings, all 202 OK)
- Overpay confirmed eliminated by March 1 repricing

### Remaining tasks
- **Task 17: Fishing line promotion** — 19 SKUs winning buybox, need P&L data (crossref refresh)
- **Task 20: Stuck device triage** — 24 devices 30+ days, £2,150 capital
- **Task 21: FUNC.CRACK returns** — 18 returned devices need return reason analysis
- **Monitor:** Next CSV export should confirm recovered buyboxes are winning

---

## COMPROMISES

- **Projected net at PTW uses historical crossref averages** — actual net per device varies. The £195/£227/£207/£183 figures are averages across 6-33 orders. Individual devices may be higher or lower.
- **Crossref only includes matched/received orders** — orders that were placed but never sent (cancelled, no-shows) are not in this data. True send-in rate can't be calculated from crossref alone.
- **42 "OTHER" orders post-Nov** — these had no matching listing SKU. They're real orders but we can't analyse their profitability by grade. Data quality issue.
- **Pre/post comparison isn't perfectly controlled** — seasonal effects (Nov-Jan includes Black Friday, Christmas) may inflate post-period volume independently of the price increase.
- **Competitor response risk** — we're now bidding £1 above PTW on recovered SKUs. If competitors bump, we lose again. Monitor in next CSV export.
- **Per-order net for recent months (Jan-Feb) is understated** — many devices haven't sold yet, so net shows £0 or low values. The per-order figures for Oct-Dec are more reliable.
- **Optimizer net vs crossref net discrepancy** — the listing optimizer's net calculation gave different figures from crossref averages for the same SKUs. Crossref (actual order data) was used as source of truth for bump decisions. The optimizer's methodology should be reviewed.

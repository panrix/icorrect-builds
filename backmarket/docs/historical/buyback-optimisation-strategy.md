# BackMarket Buyback Optimisation Strategy

**Date:** 27 Feb 2026
**Status:** Active
**Goal:** Repair less, make more money.

---

## Why We're Optimising

We're capped at 6 new trade-in orders per day (180/month). At a ~40% customer send rate, that's ~72-80 devices arriving per month. Every device slot needs to count.

Right now we bid on everything — profitable and unprofitable SKUs alike. With a volume cap, every loss-maker we accept is taking a slot from a profitable device.

**The numbers (Apr 2025 - Feb 2026, 582 sold items):**
- Revenue: £275,560
- Net Profit: £103,691 (37.6% margin)
- 12 loss-makers, 570 profitable
- 133 unsold devices with £13,079 tied up

**The opportunity:** If we cut the losers and focus the 180 monthly order slots on our best-performing SKUs, we can increase net profit per device while repairing fewer units.

---

## What We Bid On (and What Arrives)

We only actively bid on 3 condition tiers:

| We Bid On | Customer Selects | BM Grades As | What It Means |
|-----------|-----------------|--------------|---------------|
| FUNC.CRACK | Functional - Cracked | SILVER | Works but has physical damage (screen/casing) |
| NONFUNC.USED | Not functional - Broken with scratches | BRONZE | Doesn't work, cosmetic wear |
| NONFUNC.CRACK | Not functional - Broken with cracks | STALLONE | Doesn't work, physical damage |

The customer self-selects their condition. We set the offer price per tier. BM assigns a grade after submission (the mapping is 1:1 — FUNC.CRACK always = SILVER, etc).

---

## Performance by Bid Grade

| Bid Grade | Sold | Loss % | Avg Net | Total Net | Verdict |
|-----------|------|--------|---------|-----------|---------|
| **NONFUNC.USED** | 177 | **0%** | **£251** | **£44,454** | Best performer. Zero losses. Keep and grow. |
| NONFUNC.CRACK | 71 | 1% | £174 | £12,388 | Solid. 1 loss in 71 items. Keep. |
| FUNC.CRACK | 287 | 2% | £150 | £43,159 | Highest volume but lowest avg net. Optimise pricing. |
| UNKNOWN (no SKU) | 47 | **11%** | £79 | £3,691 | Worst performer. Higher-grade bids losing money. Review or cut. |

---

## The Problem SKUs

### Loss-makers are concentrated in:
1. **M1 MacBook Air 13" (A2337) 8GB 256GB** — highest volume SKU, but FUNC.CRACK bids at SILVER grade are marginal. Sale price declining (£378 to £341, -9.8%), purchase price rising. After parts (~£90-130) and labour, many are breakeven or loss-making.

2. **GOLD/DIAMOND/PLATINUM grade bids** — 11% loss rate. These are higher-condition devices with higher purchase prices but similar repair costs. The margin doesn't justify the price.

3. **Any device where purchase price > 40% of expected sale price** — consistently unprofitable after costs.

### Specific action: MBA M1 8GB 256GB FUNC.CRACK
- Current offer: ~£129-176 depending on variant
- Avg sale price: £368 (declining)
- Avg parts: £90-130 (LCD replacements)
- Breakeven offer: ~£85-100
- **Recommendation:** Drop offer price to £100 max, or delist FUNC.CRACK for this SKU entirely

---

## Order Conversion Rates

Not every order turns into a device. Historical send rates:

| Period | Orders | Sent | Rate |
|--------|--------|------|------|
| All-time avg | 1845 | 755 | **40.9%** |
| Best month (Sep 25) | 132 | 63 | 47.7% |
| Worst month (Feb 26*) | 230 | 74 | 32.2% |

*Feb still in progress — 152 orders still TO_SEND.

**With the 180 order/month cap:** 180 x 40% = ~72 new devices/month. Plus the current backlog of ~102 devices in the BM trade-ins group.

---

## The Optimisation Plan

### Phase 1: Cut the Losers (Immediate)
- [ ] Delist or reprice UNKNOWN/higher-grade listings that have 11% loss rate
- [ ] Drop FUNC.CRACK offer price on MBA M1 8GB 256GB to £100 or below
- [ ] Review all listings where our offer exceeds 40% of expected sale price
- [ ] Flag any SKU where avg parts cost > £100 for FUNC.CRACK grade

### Phase 2: Focus on Winners (This Month)
- [ ] Increase offer prices on NONFUNC.USED listings for high-value devices (MBP 14" M1 Pro, M2 MBA) to win more buybox
- [ ] Ensure we have buybox on our top 10 devices by total net profit
- [ ] Review the 4,919 active listings — how many are we actually getting orders on? Cut dead listings.

### Phase 3: Automate Monitoring (Next Month)
- [ ] Weekly profit report by SKU and bid grade (automated script)
- [ ] Alert when a SKU's sale price drops below profitability threshold
- [ ] Track customer send rate by SKU — are some SKUs attracting more cancellations?

---

## Key Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Net margin | 37.6% | 45%+ |
| Loss-maker rate | 2% | 0% |
| Avg net per device | £178 | £220+ |
| Devices processed/month | ~80 | ~72-80 (quality over quantity) |
| Capital tied up (unsold) | £13,079 | < £8,000 |

---

## Reference Documents

| Document | Location |
|----------|----------|
| Full cross-reference report | audit/buyback-crossref-2026-02-27.md |
| SKU performance audit | audit/sales-audit-2026-02-26.md |
| Buyback audit plan | docs/buyback-audit-plan.md |
| Cross-reference data (JSON) | api/bm-crossref-data.json |
| Cross-reference script | api/bm-crossref.py |
| Full chain script | api/bm-full-chain.py |
| Listings CSV (4,919) | Downloaded 26 Feb |
| Orders CSV (1,845) | Downloaded 26 Feb |

# Buyback Profitability Findings

**Date:** 15 March 2026
**Data source:** 799 devices with confirmed trade-in grades, Nancy's current LCD prices, live BM sell price scrapes

## The Problem We Solved

The buy box monitor was making bump/leave decisions based on three flat cost estimates:
- FUNC_CRACK: £120
- NONFUNC_USED: £50
- NONFUNC_CRACK: £170

These were wrong in every direction. The real numbers change how we bid on every single listing.

## What We Found

### FUNC_CRACK: costs more than we thought (+£64/unit avg)

The flat £120 assumed all screens cost the same. They don't.

| Model | Screen Cost | Extra Repair Rate | Avg Extra Cost | Real Total | vs £120 Flat |
|-------|-----------|-------------------|---------------|-----------|-------------|
| A2337 (MBA13 M1) | £98 | 46% | £10 | £103 | -£17 cheaper |
| A2338 (MBP13 M1/M2) | £154 | 44% | £20 | £163 | +£43 more |
| A2442 (MBP14 Pro) | £206 | 23% | £30 | £213 | +£93 more |
| A2485 (MBP16 Pro) | £199 | 40% | £5 | £201 | +£81 more |
| A2681 (MBA13 M2) | £90 | 44% | £13 | £96 | -£24 cheaper |

**What this means:** We were overbidding on MBP13 and MBP14 FUNC_CRACK because we underestimated screen costs. The A2338 screen is £154, not £100. Every MBP13 FC buyback was £43 less profitable than we thought. Every MBP14 FC was £93 less profitable.

On the flip side, MBA13 M1 and M2 FC are cheaper to repair than the flat estimate. We should be more aggressive on those.

### NONFUNC_USED: costs less than we thought (-£16/unit avg)

This is our strategic advantage. No screen needed; just diagnostics and board-level repair.

| Model | Avg Parts | Avg Parts Cost | Avg RR&D Hours | % Logic Board | Real Cost | vs £50 Flat |
|-------|----------|---------------|----------------|--------------|----------|-------------|
| A2337 (MBA13 M1) | 1.7 | £21 | 1.7h | 29% | £21 | -£29 cheaper |
| A2338 (MBP13 M1/M2) | 2.3 | £31 | 2.3h | 48% | £31 | -£19 cheaper |
| A2681 (MBA13 M2) | 1.9 | £22 | 2.3h | 21% | £22 | -£28 cheaper |
| A2442 (MBP14 Pro) | 1.9 | £50 | 2.4h | 62% | £50 | same |
| A2179 (MBA13 2020) | 1.3 | £21 | 1.2h | 31% | £21 | -£29 cheaper |

**What this means:** For our highest volume model (A2337), real NFU parts cost is £21, not £50. That's £29 extra profit per device we weren't accounting for. At ~78 A2337 NFU devices in our history, that's £2,262 of unrecognised profit just on that one model.

NFU is where our edge is sharpest. Low parts cost, moderate labour, and competitors assume it's harder than it is. We should be bidding aggressively on every NFU listing.

### NONFUNC_CRACK: massively less than we thought (-£100/unit avg)

This is the biggest surprise. The £170 flat assumed every NFC device needs screen + board work. Reality: only about half need a screen.

| Model | Total | % Needed Screen | Avg Cost (w/screen) | Avg Cost (no screen) | Weighted Real Cost | vs £170 Flat |
|-------|-------|----------------|--------------------|--------------------|-------------------|-------------|
| A2337 (MBA13 M1) | 32 | 45% | ~£120 | ~£25 | £51 | -£119 cheaper |
| A2338 (MBP13) | 23 | 48% | ~£180 | ~£30 | £74 | -£96 cheaper |
| A2681 (MBA13 M2) | 12 | 42% | ~£110 | ~£20 | £44 | -£126 cheaper |
| A2442 (MBP14 Pro) | 3 | 67% | ~£230 | ~£30 | £104 | -£66 cheaper |

**What this means:** A "non-functional cracked" MacBook often has a cracked screen that's cosmetic damage only. The device is dead because of a board issue, not the screen. Once the board is fixed, the screen still works despite the crack (or the crack is minor enough to sell as Fair).

The £170 estimate was treating every NFC as screen + board. In reality, 50% are board-only repairs costing £25-50 in parts. This changes NFC from a marginally profitable grade to a highly profitable one.

## Net Impact Across All 2,606 Listings

| Grade | Listings | Avg Cost Change | Direction | Total Impact |
|-------|---------|----------------|-----------|-------------|
| FUNC_CRACK | 819 | +£64/unit | Costs more | +£52,241 |
| NONFUNC_USED | 826 | -£16/unit | Costs less | -£13,098 |
| NONFUNC_CRACK | 823 | -£100/unit | Costs less | -£81,939 |
| **NET** | **2,468** | **-£17/unit** | **More profitable** | **-£42,796** |

**The catalogue is £42,796 more profitable than flat estimates suggested.** The NFC and NFU savings more than offset the FC cost increase.

## Strategic Implications

### 1. Double down on NONFUNC_USED
- Lowest parts cost (£21-50)
- Our diagnostic skills are the moat
- Competitors don't have our board repair capability, so they bid lower or don't bid at all
- Every £1 we increase our NFU bid costs us £1 but could win us a device worth £100-500 in profit

### 2. NONFUNC_CRACK is undervalued
- Industry assumes NFC = screen + board = expensive
- Reality: 50% don't need a screen
- We should treat NFC bids more like NFU bids (with a risk premium for the 50% that do need screens)
- This is potentially the biggest untapped profit pool

### 3. Be more selective on FUNC_CRACK
- MBP13/14/16 FC costs more than assumed (£163-213 in parts alone)
- MBA13 FC is fine (£96-103, well within margins)
- Don't chase MBP14 FC buy boxes as aggressively unless sell price supports it
- The £100 bump cap on the monitor should factor in real screen costs

### 4. Model-level bidding strategy
Best profit/unit opportunity (parts cost vs typical sell price):
- **A2337 NFU**: £21 parts, sells ~£375 Fair. Massive margin.
- **A2681 NFU**: £22 parts, sells ~£579 Fair. Even better.
- **A2337 NFC**: £51 parts, sells ~£375 Fair. Great margin if we don't need the screen.
- **A2681 FC**: £96 parts, sells ~£579 Fair. Solid.

Worst profit/unit (be careful):
- **A2442 FC**: £213 parts, sells ~£715 Fair. Thin after fees + labour.
- **A2338 FC**: £163 parts, sells ~£459 Fair. Tight margin.
- **A2485 FC**: £201 parts, sells ~£703 Fair. Acceptable but watch it.

### 5. Conversion rate signal
22% of accepted trade-in orders are still "TO_SEND" (never shipped). Another ~36% cancel. Only 39% of orders convert to received devices. By grade:
- If a specific model/grade has a high non-send rate, our bid might be too low for people to bother
- Worth analysing: which models have the lowest conversion rate? Those are candidates for bid increases.

## Data Sources

- **Parts costs**: Monday.com (BM Devices → Main Board → Parts board). 799 devices with confirmed grades.
- **Screen costs**: Nancy's latest pricing (March 2026). Updated in `/home/ricky/builds/buyback-monitor/build_cost_matrix.py`
- **Sell prices**: BM product page scraper. 47 URLs scraped daily. Google Sheet: `1LyC3UpuVzT_OEbA1yPNqFPMzP73q5H5DGBtfrUWQyJc`
- **Buy box data**: BM buyback competitor API. 2,606 listings scanned daily.
- **Trade-in orders**: BM orders API → Google Sheet `1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g`

## What's Now Automated

| System | Frequency | What it does |
|--------|-----------|-------------|
| Sell price scraper | Daily 05:00 UTC | Scrapes BM product pages for real sell prices |
| Buy box monitor | Daily 05:00 UTC | Scans all listings, auto-bumps profitable losers |
| Google Sheet sync | Daily 05:00 UTC | Updates sell price tracking sheet |
| Parts cost lookup | On-demand | Regenerate when Nancy updates screen prices |
| Trade-in orders sync | On-demand | Pull latest orders from BM API to Google Sheet |

## Current State (March 15, 2026)

### Order Volume Collapse
- End of Feb: BM capped orders to 6/day for ~5 days
- At same time, Ricky pulled back FC bids and eliminated Intel chipsets
- Cap lifted after 5 days but volume never recovered
- Current: ~25 orders placed/week (down from 50+), ~10 completing
- March: only 3 completed out of 66 placed (most still in TO_SEND)

### Historical Averages
- Avg net profit per device: **£112**
- Avg net margin: **23.1%**
- 88% profitable, 12% loss-making
- Only 16% of devices hit £200+ profit
- Overall conversion (placed → completed): **39%**

### By Grade Performance
- **NFU: £222 avg profit** (43.9% margin) - already hits £200 target. 194 devices.
- **NFC: £137 avg profit** (32.5% margin) - close to target. 82 devices.
- **FC: £67 avg profit** (14.3% margin) - well below £200. 316 devices (highest volume).
- FC was 37% of devices but only 22% of total profit
- NFU was 23% of devices but 45% of total profit

### Monthly Volume History
- Apr 2025: 16 placed, 8 completed (ramp-up)
- Jul 2025: 181 placed, 76 completed (peak early)
- Nov 2025: 215 placed, 83 completed
- Jan 2026: 336 placed, 131 completed (PEAK: 30/week)
- Feb 2026: 247 placed, 95 completed (BM cap hit end of month)
- Mar 2026: 66 placed, 3 completed (collapsed)

### Ricky's Target
- **£200 minimum net profit per device**
- Fewer orders but each one makes double previous average
- Trade volume for margin

### Max Bid Prices at £200 Min Profit
- **NFU models are wide open**: A2442 up to £239, A2485 up to £295, A2780 up to £646
- **NFC also viable**: A2681 up to £129, A2442 up to £171, A2780 up to £624
- **FC only on premium models**: A2681 up to £97, A2941 up to £204, A2780 up to £433
- **Dead at £200 target**: A2337 FC, A2337 NFC, A2338 FC (sell price too low vs screen cost)

### The Lever: Conversion Rate
- Getting 25 orders placed/week. People accept prices.
- But only ~39% actually send. 61% cancel or never ship.
- A £20-30 bid increase on NFU/NFC won't dent £200+ margins but could push conversion up
- Every 1% conversion improvement = ~1 more device/month

### NFU Is The Strategy

Every NFU model is profitable. This is the entire play:

| Model | Device | Vol | Avg Buy | Avg Sell | Avg Net | Hit £200 |
|-------|--------|-----|---------|----------|---------|----------|
| A2681 | MBA13 M2 | 17 | £96 | £634 | **£311** | 17/17 (100%) |
| A2442 | MBP14 M1Pro | 12 | £117 | £787 | **£376** | 12/12 (100%) |
| A2338 | MBP13 M1/M2 | 39 | £85 | £521 | **£230** | 26/39 (67%) |
| A2251 | MBP13 Intel | 6 | £82 | £439 | **£197** | 2/6 |
| A2141 | MBP16 2019 | 6 | £70 | £435 | **£196** | 3/6 |
| A2337 | MBA13 M1 | 40 | £75 | £408 | **£166** | 8/40 |
| A2289 | MBP13 Intel | 20 | £76 | £383 | **£151** | 2/20 |
| A2179 | MBA13 2020 | 26 | £65 | £346 | **£130** | 0/26 |

Total NFU profit from 166 devices: **£38,172** (£230 avg)

To hit £15K/month from NFU alone: need 65 NFU devices/month (~15/week).
Historical NFU rate: ~15-20/month. Need 3-4x increase.

The lever: bid more aggressively on NFU. Even a £25 bid increase (£75 → £100 avg) only reduces profit by £25 per device but could significantly increase order volume and conversion.

### The Throughput Problem

196 devices stuck across BM Trade-Ins (118) and Rejected/iC Locked (78). £18,366 cash tied up.

**This undermines the NFU profit story.** The £222 avg NFU profit is real for devices that sell. But 30-40% of NFU intake is stuck in the pipeline:

| Model | NFU Sold | NFU Stuck | Total | % Stuck |
|-------|----------|-----------|-------|---------|
| A2289 | 20 | 18 | 38 | **47%** |
| A2179 | 26 | 19 | 45 | **42%** |
| A2337 | 40 | 19 | 59 | **32%** |
| A2338 | 39 | 14 | 53 | **26%** |
| A2442 | 12 | 3 | 15 | 20% |
| A2681 | 17 | 3 | 20 | 15% |

**84 NFU devices stuck = ~£9,130 in unrealised profit.**

Effective NFU profit per ORDER (not per sale) is closer to £140-155 when you factor in the stuck rate.

**Action plan for 196 stuck devices:**

**Priority 1 - Repair & Sell (114 devices, £19,385 expected profit):**
Top earners sitting idle:
- BM 1422 A2918 NFU: £380 expected profit
- BM 1294 A3240 NFU: £360 profit (bought for £1)
- BM 1504 A2941 NFC: £356 profit
- BM 1493 A2485 NFC: £354 profit
- 5x A2681 NFC: £236 each
- 3x A2442 NFU: £296-319 each

**Priority 2 - Low Margin (49 devices, ~£2,500 profit):**
Mostly A2337 FC at £25-64 profit each. Not exciting but positive. Clear to free cash.

**Priority 3 - Loss Makers (9 devices, -£569 total):**
- BM 1368 A2338 FC: paid £333, expected -£175 loss (massively overpaid)
- BM 1131 A2338 FU: paid £338, expected -£109
- BM 1535 A2337 FC: paid £223, expected -£74

Decision needed: sell at whatever price to recover cash, or write off.

**24 Unknown devices** (no order ID). Need manual identification.

**The sequence matters:**
1. Clear the 114 profitable stuck devices FIRST. That's £19K profit from devices already paid for.
2. Fix the pipeline so new devices don't pile up (throughput > intake).
3. THEN increase NFU/NFC bids to drive more volume.

No point winning more buy boxes if the workshop can't process what's already there.

**Full stuck inventory data:** `/home/ricky/.openclaw/agents/main/workspace/data/buyback/stuck-inventory.json`

### NOTE: This analysis was done before (Feb 2026) but wasn't documented and was lost. This document exists so it doesn't happen again.

## Next Steps

1. **Let it run for a week** with real data. Compare daily reports. Watch win rate and bump effectiveness.
2. **Bump effectiveness tracking**: after bumping, re-check 24h later. Did we win? Did it lead to orders?
3. **Conversion rate analysis**: which SKUs have the lowest send rate? Those need higher bids.
4. **Grade strategy optimisation**: shift bump budget toward NFU and NFC, be more selective on FC.
5. **Seasonal monitoring**: sell price trends will show when to pull back (new Apple launches) or push harder.

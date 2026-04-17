# Profit Calculator Spec

**Status:** Draft
**Date:** 10 March 2026
**Origin:** Team meeting 9 March (Safan's idea) + Ricky/Ferrari follow-up

---

## The Problem

We're repairing devices without knowing if the repair is profitable. Two scenarios:

1. **BM trade-ins:** We buy a device, spend parts + labour repairing it, then sell it. Sometimes the sell price doesn't cover costs. We should know this before we start the repair.
2. **Client repairs:** A customer brings a device in. We charge them for the repair, but sometimes our parts + labour cost nearly equals what we charge. Not worth doing at 6% margin.

Both decisions need to happen at intake, not after the repair is done.

---

## Version 1: BM Trade-in P&L

### When it triggers
When a BM trade-in device completes diagnostic (Roni grades it and identifies required repairs).

### Data inputs

| Input | Source | Notes |
|-------|--------|-------|
| Purchase price | Monday BM Board (what we paid) | Already captured |
| Device model + spec | Monday (serial lookup / manual) | RAM, storage, chip |
| Pre-grade: screen condition | Roni's diagnostic | Excellent / Good / Fair |
| Pre-grade: casing condition | Roni's diagnostic | Excellent / Good / Fair |
| Overall grade | Calculated | Fair if any part is Fair. Good if both Good+. Excellent only if both Excellent. |
| Required repairs | Roni's diagnostic | List of parts needed |
| Parts cost (our cost) | Parts board / supplier pricing | What we pay, not what we charge |
| Labour time estimate | Products & Pricing board ("Required Minutes") | Per repair type |
| Labour hourly rate | Fixed config | TBD: ~£15-18/hr loaded cost |
| Projected sell price | Monthly BM price scrape | Grade + spec lookup. Fair grade, lowest spec for trade-in. |
| Shipping cost | Fixed per device type | Royal Mail rates |
| VAT on sale | 20% | Standard |

### Calculation

```
Total Cost = Purchase Price
           + Sum(Parts Cost for each required repair)
           + Sum(Labour Minutes x Hourly Rate / 60)
           + Shipping Cost

Projected Revenue = Scraped Sell Price (grade + spec)
VAT on Revenue = Revenue x 0.2 (if VAT registered sale)
Net Revenue = Revenue - VAT

Net Profit = Net Revenue - Total Cost
Margin % = Net Profit / Net Revenue x 100
```

### Decision output

| Margin | Recommendation |
|--------|---------------|
| > 30% | Repair and sell |
| 15-30% | Repair, but flag for review |
| 0-15% | Consider alternatives: sell logic board only, sell as parts, offload in batch |
| < 0% | Do not repair. Strip for parts or offload as-is. |

### Where this lives
New column group on the BM Board, or a dedicated "BM P&L" board linked to the main BM board.

### Data we need to build

1. **Monthly price scrape board:** Every model x spec x grade combination with current BM sell price. BM agent already scrapes; needs to be structured into a reference board.
2. **Parts cost column:** On the parts/stock board, what we pay per part (not sell price). Roni may need to populate this.
3. **Labour time:** Already partially on Products & Pricing board. Needs completing for all repair types.

---

## Version 2: Client Repair P&L

### When it triggers
When quoting a client for a repair (walk-in, phone call, or online enquiry).

### Data inputs

| Input | Source | Notes |
|-------|--------|-------|
| Repair type | Customer request | Screen, battery, etc. |
| Device model | Customer / serial lookup | |
| Customer price | Products & Pricing board | What we charge inc VAT |
| Parts cost (our cost) | Parts board / supplier pricing | What we pay for the part |
| Labour time | Products & Pricing board ("Required Minutes") | |
| Labour hourly rate | Fixed config | Same as Version 1 |

### Calculation

```
Our Cost = Parts Cost + (Labour Minutes x Hourly Rate / 60)
Customer Pays = Price inc VAT (from Products & Pricing)
Revenue ex VAT = Customer Pays / 1.2
Net Profit = Revenue ex VAT - Our Cost
Margin % = Net Profit / Revenue ex VAT x 100
```

### Decision output

| Margin | Action |
|--------|--------|
| > 40% | Good repair, proceed |
| 25-40% | Acceptable, proceed |
| 15-25% | Marginal, flag for review |
| < 15% | Not worth it. Consider: decline, increase price, or advise customer to go to Apple |

### Where this lives
Could be a formula on the Products & Pricing board itself. Each repair item shows: Price, Cost, Margin %. Makes pricing decisions instant.

### The Ferrari problem
iPhone 17 Pro Max screen: if we're sourcing the screen for £X, labour is Y minutes, and we charge £Z, the margin column immediately shows if it's worth doing. No more guessing.

---

## Shared Dependencies

### 1. Parts cost data
We need a "Cost Price" column on the parts/stock system. This is the single biggest gap.
- Who populates: Roni (he knows supplier prices)
- Where: Either on the existing Parts board or a new reference table
- Update frequency: When supplier prices change

### 2. Labour rate
Need to agree a loaded hourly rate. Suggestion: take annual salary + NI + pension + overhead, divide by annual working hours.
- Tech salary ~£28k = ~£14/hr base
- With NI, pension, overheads: ~£18/hr loaded
- **Proposed: £18/hr** (review quarterly)

### 3. Labour time per repair
Products & Pricing board has "Required Minutes" but many are empty.
- Safan and Misha can estimate times for repairs they do regularly
- Default fallback: use "Mins Fallback" column (already exists on the board)

### 4. Monthly BM price scrape (Version 1 only)
- BM agent already scrapes prices
- Need: structured reference board with Model x Spec x Grade = Price
- Scrape on 1st of each month, store as reference data
- Two price points: Fair/lowest (for trade-in comparison), Acceptable/mid (for repair pricing context)

---

## Build Phases

### Phase 1: Version 2 (Client Repair Margins) - This week
- Add "Parts Cost" column to Products & Pricing board
- Add "Margin %" formula column
- Populate parts costs for top 20 repairs (MacBook screens, batteries, keyboards)
- Flag any repairs under 15% margin

### Phase 2: Version 1 (BM Trade-in P&L) - Next week
- Structure the monthly price scrape into a reference board
- Build the P&L calculation on the BM Board
- Link parts costs + labour times
- Test with 10 recent trade-ins to validate

### Phase 3: Integration - Following week
- Intake form triggers P&L calculation automatically
- Agent posts recommendation in Slack thread at diagnostic stage
- Dashboard view: all current trade-ins with P&L status

---

## Open Questions

1. What's the right labour hourly rate? (Proposed £18/hr)
2. Do we have parts cost data anywhere already, or does Roni need to build this from scratch?
3. For BM scrape: which specs do we track per model? (e.g., for MacBook Air M2: 8/256, 8/512, 16/256, 16/512?)
4. Threshold for "don't repair" on BM: is 15% margin the right cutoff, or should it be higher given the risk of warranty returns?

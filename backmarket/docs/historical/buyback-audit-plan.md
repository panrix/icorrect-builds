# BackMarket Buyback Audit — What We're Building

**Date:** 26 Feb 2026
**Status:** In progress

---

## The Problem

We're buying trade-ins through BackMarket without enough visibility into which ones make money and which ones don't. Some SKUs are consistently loss-making after parts and labour, but we keep buying them because there's no system flagging them. If we can't cut the losers, we're working for free.

---

## What We're Auditing

### 1. Prices We Paid vs What We Should Have Paid

- BM offer price (what we actually pay) vs Monday purchase price (ex VAT) — confirmed these differ by ÷1.1
- Are we overpaying for certain SKUs relative to what they sell for?
- Which purchase price thresholds make a SKU profitable vs loss-making?

### 2. What Clients Said vs What We Actually Received

BM has a customer self-assessment (FUNCTIONAL_CRACKED, FUNCTIONAL_USED, etc.) and then assigns a grade (SILVER, BRONZE, etc.). We then diagnose the device ourselves:

- Reported Battery vs Actual Battery
- Reported Screen vs Actual Screen
- Reported Casing vs Actual Casing
- Reported Functionality vs Actual Functionality
- Liquid Damage

**Key question:** How often do customers overstate condition? When they do, what's the cost impact? Are certain grades consistently worse than reported?

### 3. Most Profitable Trade-Ins

By SKU, by grade, by device — which combinations reliably make money? These are the ones we want to keep buying and potentially increase volume on.

### 4. Loss-Making Trade-Ins

Which SKU + grade combos consistently lose money after parts and labour? These need to either:
- Be rejected outright (stop offering on those listings)
- Have the offer price cut to absorb repair costs
- Be counter-offered at a lower price when the device arrives in worse condition than reported

---

## The Data Sources

| Source | What It Gives Us | Endpoint / Board |
|--------|------------------|------------------|
| BM Buyback API — Orders | Customer name, offer price, grade (DIAMOND→STALLONE), listing SKU, dates, counter-offer reasons, suspend reasons | `ws/buyback/v1/orders/{GB-xxxxx-xxxxx}` |
| BM Buyback API — Listings | Our current offer prices per device per condition grade, active markets | `ws/buyback/v1/listings` |
| Monday.com — BM Devices (3892194968) | Purchase price, sale price, BM fee, reported vs actual condition, parts used, final grading, order ID | GraphQL API |
| Monday.com — Main Board (349212843) | Parts cost (subitems), RR&D time tracking, repair tech, shipping dates | GraphQL API |

---

## What We've Done So Far

| Done | What |
|------|------|
| ✓ | Pulled all 735 sold items — SKU performance, price trends, monthly margin |
| ✓ | Identified declining SKUs (MBA M1 Grey Fair down 9.8%) |
| ✓ | Built full chain script: Trade-in → Repair → Sale → Profit |
| ✓ | Mapped 42 shipped items (18-24 Feb) with BM Buyback API data |
| ✓ | Found grade correlation: SILVER = 42% loss rate, BRONZE = 0% |
| ✓ | Confirmed purchase price = BM offer ÷ 1.1 (VAT) |
| ✓ | Mapped the three grade systems (customer-facing / BM internal / sales) |
| ✓ | Documented complete flow: customer self-assessment → BM grade → iCorrect diagnosis → repair → sale |
| ✓ | Pulled all 1000 buyback listings (334 products) with current offer prices |

---

## What's Left To Do

### Phase 1: Complete the Audit Data

- [ ] Pull ALL historical buyback orders (not just 18-24 Feb) and match to Monday data
- [ ] Cross-reference reported vs actual condition across all orders — quantify how often customers lie and the cost
- [ ] Calculate true net profit per SKU using actual BM offer price (not Monday ex-VAT figure)
- [ ] Identify every SKU that has made a net loss more than once

### Phase 2: Build the Decision Rules

- [ ] For each active buyback listing SKU: max purchase price threshold that keeps us profitable
- [ ] Flag SKUs where avg sale price minus avg repair cost leaves no margin — recommend delisting
- [ ] Grade-based rules: which BM grades (SILVER/BRONZE/STALLONE) are profitable for which SKUs
- [ ] Identify SKUs where customer condition reports are unreliable (high reported-vs-actual mismatch)

### Phase 3: Action

- [ ] Update buyback listing prices to reflect real profitability (cut or delist losers)
- [ ] Set up automated monitoring: flag any new trade-in where purchase price exceeds threshold
- [ ] Weekly/monthly profit report by SKU and grade (automated script)

---

## The Goal

**Only buy trade-ins that make money.** Every listing price should be set based on:

```
Max offer = Expected sale price
          - Expected parts cost (by grade)
          - Expected labour
          - BM fee (10%)
          - Tax
          - Shipping (£15)
          - Target margin (£X minimum)
```

If the number comes out negative or below minimum margin, we don't buy it.

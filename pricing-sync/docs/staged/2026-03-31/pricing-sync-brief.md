# Pricing Sync: Problem Brief

**Written:** 2026-03-16
**Status:** DRAFT; awaiting Ricky review

---

## The Problem

iCorrect has repair pricing in three systems that don't talk to each other:

- **Shopify** (website): what customers see and book online
- **Monday.com** (operations board): what the team quotes from and what drives the repair pipeline
- **SumUp** (POS): what gets charged at the till

All three have different prices for the same repairs. Nobody knows which is correct. When a customer books online at one price and the team quotes a different price from Monday, we either eat the difference or have an awkward conversation. When SumUp charges a third price, the accounts don't reconcile.

### How bad is it?

From our March 10 audit:
- **289 price mismatches** between Shopify and Monday
- **154 Shopify products** have no Monday equivalent at all
- **1,258 products** exist in one system but not the others
- Only **41.7% match rate** across all three systems
- SumUp has **696 items**, Monday has **442**, Shopify has **168**; the overlap is thin

The matching itself is unreliable. The audit used fuzzy title matching, which means an Apple Watch Series 10 gets matched to an Apple Watch SE because the names are similar. Real mismatches are likely worse than reported.

### Why it matters

- **Customer trust**: online price ≠ in-store quote ≠ receipt amount
- **Revenue leakage**: if Monday quote is lower than Shopify, we're undercharging walk-ins
- **Team confusion**: techs and Ferrari don't know which price to trust
- **Profitability blind spot**: can't calculate repair margins without knowing the actual price charged
- **Accounting pain**: SumUp payments don't reconcile cleanly to Monday records

---

## The Goal

**One source of truth for pricing: Shopify.**

Shopify is the most up-to-date, customer-facing system. Prices should flow:

```
Shopify (source of truth)
   ↓
Monday.com (operations: quotes, pipeline)
   ↓
SumUp (POS: payment collection)
```

### End state

1. Every repair in Shopify has a matching item in Monday and SumUp
2. Prices match across all three systems
3. When a price changes in Shopify, it propagates to Monday and SumUp automatically (or via a scheduled sync)
4. New products added to Shopify get created in Monday and SumUp
5. Products that exist in Monday/SumUp but NOT in Shopify get flagged for review (are they legacy? should they be added to the website?)

---

## What Exists Already

All paths relative to Jarvis workspace (`~/.openclaw/agents/main/workspace/`).

### Scripts

| Script | Location | Notes |
|--------|----------|-------|
| Shopify ↔ Monday matcher | `data/match_shopify_monday.py` | Fuzzy title matching; poor quality, needs rewrite |
| Pricing audit script | not saved | Was run inline during Mar 10 session; needs extracting from session logs or rewriting |

### Data Dumps (all from Mar 10)

| Data | Location | Size | Notes |
|------|----------|------|-------|
| Shopify products | `data/shopify-products.json` | 1.1MB | Full product catalogue from Shopify API |
| Monday products | `data/monday-products.json` | 549K | Full product/repair items from Main Board |
| SumUp items | `data/sumup-items-export.csv` | 97K (845 items) | CSV export; parent/variation structure |

### Reports

| Report | Location | Notes |
|--------|----------|-------|
| Shopify ↔ Monday match report | `data/shopify-monday-match-report.md` | 289 mismatches, 154 Shopify items missing from Monday |
| Full 3-system audit | `data/pricing-audit-report.md` | 14 confirmed mismatches, 1,258 missing products, 41.7% match rate |

### API Access

| System | Access | Notes |
|--------|--------|-------|
| Shopify | `SHOPIFY_ACCESS_TOKEN` in env | Read-only. Store: `i-correct-final.myshopify.com` |
| Monday | `MONDAY_APP_TOKEN` in env | Board 349212843 (Main Board) |
| SumUp | CSV export only (so far) | Has an API but not yet explored |

### Known issues with the current matching

- Fuzzy title matching is unreliable (wrong device models get paired)
- No model number (A####) based matching
- SumUp uses parent/variation structure (CSV); not parsed properly yet
- Monday board structure: repairs are grouped by device model, each item is a repair type with a price column
- Shopify products have the device + repair in the title; no clean structured fields

---

## Decisions Needed

1. **What to do with Monday/SumUp items that don't exist in Shopify?** Flag for review? Delete? Add to Shopify?
2. **Should the sync be one-shot or recurring?** (Recommendation: build as a script that can run on demand or cron)
3. **SumUp API or CSV?** SumUp has an API but we've only used CSV export so far. API would enable automated sync.
4. **Monday price column**: which column holds the customer-facing price? Need to confirm the column ID.

---

## Build Sequence

1. **Fix the matching**: model number + repair type based matching, not fuzzy titles
2. **Audit with accurate matching**: regenerate the mismatch report with reliable data
3. **Shopify → Monday sync**: update Monday prices to match Shopify
4. **Shopify → SumUp sync**: update SumUp prices to match Shopify
5. **Gap report**: items in one system but not others, for manual review
6. **Ongoing sync**: cron or webhook to keep them aligned

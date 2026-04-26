# QA Issue — Reconciled Back Market Scrape Target Required

Date: `2026-04-26`
Status: `OPEN`
Severity: `High`
Area: `SOP 06 listing cards / market scrape / product matching`

## Summary

Ricky identified a critical QA issue while reviewing **BM 1527**: the listing card/device identity says the unit is **512GB**, but scraper/matching evidence appeared to be using or mixing **256GB** product/page data.

This exposed a broader design flaw: current listing-card generation can trust registry/catalog product identity while accepting scraped market prices without proving the live scraped page and price ladder are reconciled to the exact candidate spec.

## Why This Matters

Back Market listing decisions depend on current market pricing. If the scraper accepts prices from an adjacent variant, a card can show apparently valid pricing for the wrong product spec.

Potential impact:

- wrong approval recommendation
- wrong listing price/min price
- listing a device against a mismatched product/market ladder
- hidden margin distortion
- false confidence in product ID/slot safety

This is not just a BM 1527 issue. It is a class of QA risk in SOP 06.

## Trigger Case

Candidate:

- BM item: `BM 1527 / Precious Uhwache`
- Main item: `11440582288`
- BM Devices item: `11440594268`
- Candidate SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Claimed slot: `5035146`
- Claimed UUID product ID: `9ef00207-1136-45f4-99c3-ade923986e43`
- Claimed numeric BM product: `545417`

Observed concern:

- Candidate is **512GB**.
- Scraper/matching appeared to reference or price against **256GB** sibling data.
- The BM 1527 card is now considered **suspect** and paused until root cause is confirmed.

## Current System Weakness

The current pipeline effectively does this:

1. Build/validate canonical SKU from Monday/QC fields.
2. Resolve product/listing through registry/catalog.
3. Scrape Back Market market prices.
4. Use returned grade ladder in product card/P&L.

Missing QA gate:

- The scraper does not yet require a fully reconciled live scrape target proving:
  - model matches
  - chip/CPU/GPU matches
  - RAM matches
  - SSD matches
  - colour matches
  - keyboard/layout matches where relevant
  - grade/condition price belongs to the same selected variant

## Required Long-Term Fix

Fix the scraper/matching system **upstream** so the normal path generates the correct Back Market scrape target in the first place.

The goal is not to rely on a downstream hard-fail as the solution. A hard-fail is only a temporary safety net while the upstream matching is being corrected.

The durable fix should make the canonical candidate spec drive the scrape target deterministically:

- canonical candidate spec from Monday/QC SKU
- resolved BM catalog product/listing target
- generated scrape URL/product ID
- live page selected picker state
- live page product ID after redirects/picker resolution
- selected SSD/RAM/colour/CPU-GPU/layout all match candidate
- grade-specific price extraction is scoped to the reconciled product variant

Desired steady state:

- the browser agent captures the canonical public frontend URL for each seller listing from the seller portal GB market flag/link when available
- the scraper opens the captured public URL as the preferred target instead of guessing a placeholder/product URL
- canonical SKU/spec still verifies that the public page matches model/spec/grade before pricing is trusted
- adjacent variants such as 256GB vs 512GB are never used as substitute market evidence
- pricing data is generated from the reconciled target, not corrected after the fact
- fallback/fail states become rare exception handling, not the operating model

If reconciliation fails during development or because Back Market changes the page:

- pause the card as a safety measure
- report the exact mismatch layer
- fix the resolver/scrape-target generation upstream before trusting that product family again

## Acceptance Criteria

A fix is not complete until:

- BM 1527 regression case proves a 512GB candidate resolves directly to the correct 512GB scrape target.
- The generated scrape URL/target is derived from the canonical SKU/spec, not from fuzzy sibling lineage.
- The card output includes a scrape reconciliation block showing expected vs observed spec as evidence, not as the primary fix.
- `list-device.js` dry-run/card generation gets correct pricing from the reconciled target for BM 1527.
- Regression tests/fixtures cover at least:
  - correct 512GB target generation
  - 512GB candidate must not use a 256GB scrape/page
  - sibling variant/product ID separation
  - grade ladder extracted from the selected reconciled variant
- SOP 06 documentation says pricing is valid only when generated from the reconciled target.

## Current Actions

Active read-only investigations:

- `vivid-gulf`: BM 1527 immediate 256GB/512GB mismatch root-cause investigation.
- `sharp-dune`: reconciled scrape URL verification design/implementation task.

Rules while open:

- Do not list BM 1527.
- Treat BM 1527 card as invalid/suspect until investigation completes.
- Do not trust future listing-card pricing unless the product/card explicitly proves scrape target reconciliation.

## Owner / Follow-up

Owner: Back Market listing pipeline / SOP 06 automation.

Follow-up files likely to change after root cause is confirmed:

- `scripts/list-device.js`
- `scripts/lib/v7-scraper.js`
- `data/listings-registry.json` or generated registry inputs if mapping is corrupt
- SOP 06 documentation
- listing-card report template
- regression tests

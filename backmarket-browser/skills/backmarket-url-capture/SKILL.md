---
name: backmarket-url-capture
description: Capture Back Market UK seller-portal active listing public frontend URLs for scraper target selection, using the bo-seller active listings SKU filter, GB public product links, and SKU/spec reconciliation guardrails.
---

# Back Market URL Capture

Use this skill when Back Market listings need public UK product URLs for scraper targets, SKU mismatch triage, or `listing_id/SKU -> frontend_url` map generation.

## Scope

- Portal URL: `https://www.backmarket.co.uk/bo-seller/listings/active?orderBy=-quantity&pageSize=10`
- Customer-care URLs are out of scope for this skill.
- Capture is read-only: no Save, Archive, stock, price, publication, customer-care, return, refund, or warranty actions.
- Captured URLs are trusted only when the public page and portal row reconcile to the candidate SKU/spec.

## Local Commands

Run from `/Users/icorrect/VPS/builds/backmarket-browser` locally, or the equivalent project path on VPS.

```bash
npm test
npm run frontend-url:build-input
npm run frontend-url:capture:plan
npm run frontend-url:capture
npm run frontend-url:export-map
```

For the preferred CSV-first flow:

```bash
npm test
npm run frontend-url:export-map:csv
```

Primary files:

- Input: `data/exports/gb-frontend-url-capture-input.json`
- Raw capture: `data/exports/gb-frontend-url-captures.json`
- Active listings CSV: `/Users/icorrect/VPS/builds/backmarket/data/backmarket-active-listings-2026-04-26.csv`
- Exported scraper map: `/Users/icorrect/VPS/builds/backmarket/data/listing-frontend-url-map.json`
- Runner: `scripts/run-gb-frontend-url-capture.js`
- Exporter: `scripts/export-frontend-url-map.js`
- CSV parser: `lib/active-listings-csv.js`

## Browser Prerequisite

The runner attaches to an already-authenticated local Chrome CDP endpoint, defaulting to:

```bash
http://127.0.0.1:9333
```

If the portal is not logged in, stop and complete login manually or through an approved login-only flow. Do not write credentials into repo files.

## Capture Workflow

For each candidate:

1. Open the active listings URL.
2. Fill only the visible `SKU` filter.
3. Click `Apply filters`.
4. Require a row/card containing the exact SKU.
5. Find the row-scoped `a[href*="/en-gb/p/"]` GB public product link.
6. Open the public URL in a separate tab/page.
7. Record final public URL plus public title/H1/visible spec text and portal row text.
8. Compare SKU tokens against captured evidence:
   - chip
   - GPU core count when present
   - RAM
   - storage
   - colour
   - grade
9. Write local capture records only.

## Trust Rules

- `captured_spec_match`: eligible for export into the scraper frontend URL map.
- `captured_spec_mismatch`: keep as evidence for SKU/listing triage, but do not feed to scraper map.
- `sku_row_not_found`: current active listings search returned no active listing for that SKU; check archived/on-hold/export data before assuming the listing exists.
- Ambiguous results must fail closed.

Important trap: do not count the SKU text itself as proof of matching spec. The verifier must compare against portal row title/spec and public page evidence after removing the raw SKU from the portal row.

## Full Listings Export

If Back Market provides an active listings export, prefer importing it before large runs. A full export lets the agent build an offline `listing_id -> SKU -> frontend_url/product UUID` map and separate:

- listings needing SKU correction
- listings needing URL capture
- archived/on-hold/missing listings
- scraper-safe URL targets

CSV trust rules:

- Import only GB rows.
- Convert old `/second-hand-.../<id>.html` offer links into `/en-gb/p/<slug>/<product_uuid>?l=12` targets.
- Use numeric `Listing no.` as the scraper-facing `listing_id`; preserve portal UUID `Listing ID` in `spec_snapshot`.
- Trust only rows marked `captured_spec_match`.
- Treat `captured_spec_mismatch` and `capture_failed` as triage evidence, not scraper targets.
- Colour is only checked offline when the export title or offer link exposes colour evidence; otherwise browser/public-page verification must confirm colour.

## SKU Changes

This skill does not authorize SKU mutation. For SKU edits, use the SKU portal canary runbook and require exact approval naming:

- listing/BM item identifiers
- current portal SKU
- target canonical SKU
- explicit permission to edit only SKU
- explicit permission to click Save

A Save click alone is never proof. After any approved save, return to Listings, re-filter, reopen, and verify SKU plus unchanged product, appearance, quantity, publication state, and title/spec.

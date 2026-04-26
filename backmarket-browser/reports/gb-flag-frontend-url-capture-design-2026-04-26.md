# GB Flag Frontend URL Capture Design

Date: `2026-04-26`  
Status: `DESIGN / READ-ONLY SCAFFOLD ONLY`  
Live authenticated seller-portal run: `NOT PERFORMED`

## Scope

This design defines the safe browser-agent flow to capture the canonical public Back Market UK frontend URL for a seller listing by using the GB market flag/link in the seller portal listing detail.

This task did **not** perform:

- seller-portal login
- password entry
- email-code retrieval
- listing edits
- Save clicks
- inventory, publication, customer care, return, refund, or warranty actions

The design assumes Ricky's observed UI behavior is correct: from seller-portal Inventory/listing detail, the GB flag opens the public `backmarket.co.uk` listing page for that exact listing.

## Current codebase placement

### Browser side: `backmarket-browser`

This belongs beside the existing listing verification flow, not inside customer-care or login bootstrap code.

Relevant current browser-side anchors:

- `lib/fix-sku-contract.js`
  - existing listing-detail verification contract
- `scripts/run-fix-sku.js`
  - dry-run listing workflow pattern
- `config/selectors/portal.json`
  - selector manifest for listings and listing detail
- `RUNBOOK-SKU-PORTAL-CANARY-2026-04-26.md`
  - current read-only listing-detail runbook

Recommended new browser-side operation boundary:

- operation name: `capture-gb-frontend-url`
- lifecycle:
  1. resolve listing in seller portal
  2. open listing detail
  3. capture canonical GB frontend URL from the portal link
  4. emit a local mapping record only

This should be treated as a **read-only listing metadata capture** operation, parallel to `fix-sku`, not as part of a mutation path.

### Scraper side: sibling `backmarket` repo

The captured URL must feed the scrape-target selection used by SOP 06 pricing.

Relevant current scraper-side anchors:

- `/home/ricky/builds/backmarket/scripts/lib/v7-scraper.js`
  - today constructs placeholder URLs as:
    - ``https://www.backmarket.co.uk/en-gb/p/placeholder/${productId}?l=10``
- `/home/ricky/builds/backmarket/scripts/list-device.js`
  - today builds scrape verification from catalog/product_id and passes that into `buildReconciledScrapeTarget(...)`
- `/home/ricky/builds/backmarket/reports/qa-issue-reconciled-scrape-target-2026-04-26.md`
  - documents the upstream scrape-target QA problem

Recommended ownership split:

- `backmarket-browser` captures and stores the canonical frontend URL evidence.
- `backmarket` imports that mapping and uses it as the preferred scrape target.

That split respects the current repo boundary documented in this repo's `README.md`: browser ops may read helpers from `backmarket`, but the reverse import should not depend directly on browser repo internals.

## Recommended pipeline position

Put GB-flag capture immediately after a listing has a stable seller-portal identity and before scrape/pricing trust is granted.

Recommended logical order:

1. QC/SOP 05 generates canonical SKU.
2. Listing pipeline has listing identity: `listing_id`, `SKU`, `product_id` if visible.
3. Browser read-only capture records the GB public URL from seller portal.
4. Scraper uses captured frontend URL as the preferred target.
5. Scraper still reconciles live title/spec/picker evidence against SKU/spec before trusting pricing.

This changes the current model from:

- guess public URL from `product_id`

to:

- prefer seller-portal-provided public URL
- fall back to `product_id` placeholder URL only when no captured URL exists

## Data contract

One record per listing-market capture.

Suggested storage shape:

- browser capture artifact:
  - `backmarket-browser/data/exports/gb-frontend-url-captures.json`
- imported scraper-side cache:
  - `backmarket/data/listing-frontend-url-map.json`

Suggested JSON record:

```json
{
  "listing_id": "6709047",
  "sku": "MBP.A2338.M1.16GB.256GB.Grey.Fair",
  "product_id": "7408af3f-40ad-4e74-aff8-d2acca799683",
  "seller_portal_url": "https://www.backmarket.co.uk/en-gb/dashboard/seller/listings/6709047",
  "frontend_url": "https://www.backmarket.co.uk/en-gb/p/macbook-pro-13-inch-2020-m1-16gb-256gb-space-grey/7408af3f-40ad-4e74-aff8-d2acca799683?l=10",
  "captured_at": "2026-04-26T07:00:00.000Z",
  "spec_snapshot": {
    "page_title": "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 16GB RAM - SSD 256GB - QWERTY - English",
    "ram": "16GB",
    "ssd": "256GB",
    "colour": "Space Gray",
    "grade": "Fair"
  },
  "verification_status": "captured_spec_match"
}
```

### Field definitions

| Field | Required | Notes |
|---|---|---|
| `listing_id` | yes | Seller listing numeric id or stable portal id as string. |
| `sku` | yes | Canonical BM SKU used for reconciliation. |
| `product_id` | no | Include when visible in portal detail or known from pipeline. |
| `seller_portal_url` | yes | Exact source page used to capture the link. |
| `frontend_url` | yes | Final public UK URL after redirects settle. |
| `captured_at` | yes | ISO-8601 UTC timestamp. |
| `spec_snapshot` | no | Safe public evidence only: title and visible public picker/spec text. |
| `verification_status` | yes | Outcome of title/spec reconciliation. |

### Verification status enum

Recommended allowed values:

- `captured_unchecked`
- `captured_title_match`
- `captured_spec_match`
- `captured_spec_mismatch`
- `missing_gb_flag`
- `public_page_unreachable`
- `capture_failed`

## Safe browser-agent steps

These steps are intentionally read-only.

1. Open seller portal listings page.
2. Filter to a single listing using:
   - `listing_id` first
   - exact `SKU` second
   - `product_id` only as supporting evidence, not as the primary portal lookup unless the UI clearly supports it
3. Require exactly one listing result.
4. Open listing detail.
5. Record the source `seller_portal_url`.
6. Locate the GB market flag/button/link for the United Kingdom market.
7. Open the GB link in a new tab or popup-safe read-only way.
   - preferred: modified click or explicit `href` open
   - avoid any action that focuses edit fields or changes listing state
8. Wait for redirects to settle on the public page.
9. Capture:
   - final `frontend_url`
   - `document.title` / visible `h1`
   - safe visible spec text or picker labels needed for reconciliation
10. Compare public page title/spec evidence against canonical SKU/spec.
11. Write the local capture record.
12. Close the public tab.
13. Return focus to seller portal tab.
14. Leave the listing untouched.

## Guardrails

Non-negotiable read-only limits:

- no `Save` clicks
- no listing edits
- no quantity/inventory changes
- no price changes
- no publication/archive changes
- no customer care actions
- no return/refund/warranty actions
- no creation/duplication/archive flows
- no mutation-capable modal confirmations

Hard-stop conditions:

- login/password/code approval is absent
- selector ambiguity or multiple matching listings
- GB flag is missing or unclear
- the click path appears to require entering edit mode
- unexpected modal, error banner, captcha, or account mismatch appears
- public page does not resolve to `backmarket.co.uk`

## Spec snapshot policy

Capture only safe public evidence:

- page title
- visible `h1`
- visible RAM / SSD / colour / keyboard / grade labels where exposed
- final public URL

Do **not** capture:

- any customer data
- internal notes/comments
- hidden portal metadata beyond listing identifiers already in scope
- anything requiring interaction beyond read-only page load

## Connection to scraper fix

### Required behavior change

In `backmarket`, scrape target selection should become:

1. If a captured `frontend_url` exists for the listing, use it.
2. Else fall back to the current placeholder URL derived from `product_id`.
3. In both cases, require reconciliation of live page evidence against the candidate SKU/spec before trusting price output.

### Why this matters

Current `v7-scraper.js` behavior starts from placeholder URLs built from `product_id`. That is useful as a fallback, but Ricky's observed seller-portal GB link is a stronger canonical source because it comes from the seller listing itself.

This reduces risk of:

- guessed sibling-variant landing pages
- wrong slug/variant routing
- silent 256GB vs 512GB adjacency mistakes
- downstream hard-fails becoming the normal operating model

### Required scraper-side follow-up

Recommended `backmarket` follow-up changes after this design:

- add a small lookup loader for imported `listing_id -> frontend_url`
- update `scripts/lib/v7-scraper.js` to accept either:
  - `frontendUrl`
  - `productId`
- prefer direct navigation to the captured frontend URL when present
- keep `buildReconciledScrapeTarget(...)` as the trust gate
- include the source of the scrape target in card/report output:
  - `captured_frontend_url`
  - `product_id_fallback`

## Safe scaffolding added in this repo

This task added contract-level scaffolding only:

- `lib/frontend-url-capture-contract.js`
  - validates the proposed capture record and encodes the read-only plan
- `scripts/plan-gb-flag-frontend-url-capture.js`
  - plan-only CLI for candidate rows
- `test/unit/frontend-url-capture-contract.test.js`
  - unit coverage for the record contract and plan builder
- `package.json`
  - adds the new unit test and `frontend-url:plan` command

No authenticated automation was added.

## Recommended next implementation pass

When authenticated portal access is explicitly approved:

1. Extend `config/selectors/portal.json` with observed GB-link selectors from a real signed-off fixture.
2. Add a read-only browser script:
   - `scripts/run-gb-flag-frontend-url-capture.js`
3. Emit capture artifacts under:
   - `data/runs/gb-frontend-url-capture/<run-id>.json`
   - `data/screenshots/gb-frontend-url-capture/<run-id>/`
4. Add a scraper-side import/sync step into sibling `backmarket`.
5. Update SOP 06/reporting so scrape-target provenance is visible.

## Verification run performed

Local only:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
node scripts/plan-gb-flag-frontend-url-capture.js
```

No live portal session was run.

## Jarvis paste-ready summary

Read-only design is ready for a seller-portal GB-link capture path. The browser-side flow should sit beside the existing listing verification path in `backmarket-browser`: open Listings, filter to one listing, open listing detail, use the GB market flag/link to open the exact public `backmarket.co.uk` page in a new tab, capture the final public URL after redirects plus safe public title/spec text, then close the tab and return without touching the listing. Guardrails are strict: no Save, no edits, no inventory/price/publication changes, no customer/return/refund/warranty actions.

This directly fixes the upstream scrape-target problem documented in BM 1527. In the sibling `backmarket` repo, the scraper should prefer the captured frontend URL as the canonical scrape target when present, and only fall back to the current `product_id` placeholder URL when no captured URL exists. Even with a captured URL, pricing remains untrusted until the live public page title/spec/picker evidence reconciles to the canonical SKU/spec. I added safe scaffolding only in `backmarket-browser`: a capture-record contract, a plan-only CLI, and a unit test. No authenticated portal automation was run.

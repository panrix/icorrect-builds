TASK: Design browser-agent flow to capture canonical Back Market frontend URL from seller portal GB flag per listing.

Context:
- Ricky observed in the seller portal UI that each listing has a GB market flag/button in the Inventory section. Clicking the GB flag opens the listing's public frontend URL on backmarket.co.uk.
- This should be used as the canonical URL source for scraping/verification instead of guessing/fuzzy generating URLs from product_id alone.
- This relates to the Back Market scraper/matching QA issue: we need upstream correct scrape targets, not just downstream hard-fails.
- Current browser status: DataImpulse residential proxy reaches seller auth, enters jarvis@icorrect.co.uk, then stops at password prompt. No authenticated portal run is approved yet.

Goal:
- Produce a read-only implementation/design for a browser agent workflow that, once authenticated, can record the correct frontend URL for each listing by clicking/opening the GB flag/link in seller portal.
- Do NOT require a live authenticated run now. Build safe scaffolding/runbook if auth is unavailable.

Required output/design:
1. Identify where this belongs in backmarket-browser/backmarket listing pipeline.
2. Define data contract for captured URL mapping:
   - listing_id
   - SKU
   - product_id if available
   - seller portal URL/source page
   - frontend URL opened from GB flag
   - captured_at
   - page title/spec snapshot if safe
   - verification status
3. Define safe browser steps:
   - open seller portal listing page
   - locate GB flag/button/link for United Kingdom market
   - click/open in new tab without editing listing
   - capture final public URL after redirects
   - capture public title/spec text for reconciliation
   - close public tab and return
4. Define guardrails:
   - no Save clicks
   - no listing edits
   - no inventory/unit changes
   - no customer/return/refund actions
   - read-only only
5. Connect to scraper fix:
   - use captured frontend URL as preferred scrape target when present
   - fall back to product_id URL only if no captured URL exists
   - still verify page spec against SKU
6. If small and safe, add scaffolding code/tests, but do not run authenticated portal automation unless credentials/session are present and explicitly approved.

Outputs:
- Write report: /home/ricky/builds/backmarket-browser/reports/gb-flag-frontend-url-capture-design-2026-04-26.md
- If code is added, include changed files and tests.
- Include Jarvis paste-ready summary.

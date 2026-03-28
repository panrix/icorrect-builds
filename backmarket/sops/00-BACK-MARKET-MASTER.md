# Back Market Master Reference — iCorrect

**Status:** SKELETON — section headings and structure only. Content to be written after all SOPs and scripts are complete.

---

## 1. How Back Market Works (Our Context)

### 1.1 Two Sides of BM
- Buyback (trade-in): we BID to buy devices from customers
- Selling (resale): we LIST refurbished devices for sale
<!-- Content: explain the full cycle, how money flows, what we control -->

### 1.2 Account & API Access
- Account details
- API base URL: `https://www.backmarket.co.uk`
- Auth headers (Authorization, Accept-Language, User-Agent)
- Environment variables
<!-- Content: full auth setup, env var names, where stored -->

### 1.3 SLAs & Timelines
- Shipping deadlines after sale
- Trade-in payout timelines
- Counter-offer windows
- Tuesday cutoff protocol
<!-- Content: exact SLA hours, penalties, consequences -->

### 1.4 Grade Mapping
- BM sell grades: FAIR, GOOD, VERY_GOOD (Excellent)
- BM buyback grades: STALLONE (NFC), BRONZE (NFU), SILVER (FC), GOLD (FU), PLATINUM (FG), DIAMOND (FE)
- Our Final Grade: Fair, Good, Excellent
- How grades map between systems
<!-- Content: full mapping table, edge cases -->

---

## 2. Product Catalogue

### 2.1 Product IDs — How They Work
- Every unique spec combination has its own product_id (UUID)
- product_id determines: title, backmarket_id, product page
- product_id does NOT determine: grade, price, SKU
<!-- Content: full explanation with examples, reference knowledge/bm-product-ids.md -->

### 2.2 backmarket_id vs product_id vs listing_id
- product_id: UUID for a spec combination (what we submit)
- backmarket_id: BM's internal catalogue entry (assigned by BM)
- listing_id: our specific listing on that catalogue entry (numeric)
- UUID (id): listing UUID used for backbox API
<!-- Content: how they relate, which to use where -->

### 2.3 How Titles Are Determined
- Title is set by product_id, not by seller
- Seller cannot override title
- Title always shows one spec combo per product page
<!-- Content: examples of title resolution, common gotchas -->

### 2.4 Product ID Lookup Table
- Built from our existing 832+ listings
- Location: `/home/ricky/builds/bm-scripts/data/product-id-lookup.json`
- How to search it, how to maintain it
- Rebuild process
<!-- Content: lookup table structure, search logic, update frequency -->

### 2.5 Sold-Out Specs
- Sold-out = no sellers, not no product
- product_id unavailable for sold-out picker options
- Cannot create listings for specs we've never listed and no one else has
- Options when stuck
<!-- Content: what we've tried, what works, what doesn't -->

### 2.6 SKU Format Standard
- Format: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`
- Current state: 832 listings with inconsistent legacy SKUs
- Migration plan: create new listings with correct SKUs, archive old
<!-- Content: full format spec, examples, migration approach -->

---

## 3. API Reference

### 3.1 Endpoints We Use
- Listings: GET/POST `/ws/listings`, `/ws/listings/{id}`
- Orders: GET `/ws/orders`
- Backbox: GET `/ws/backbox/v1/competitors/{uuid}`
- Tasks: GET `/ws/tasks/{task_id}`
- Buyback orders: GET `/ws/buyback/v1/orders`
- Buyback messages: GET/POST `/ws/buyback/v1/orders/{id}/messages`
<!-- Content: full endpoint reference with request/response examples -->

### 3.2 Auth Headers (All 3 Required)
- Authorization: `$BACKMARKET_API_AUTH`
- Accept-Language: `en-gb` (mandatory, affects currency + pub_state)
- User-Agent: `$BACKMARKET_API_UA`
<!-- Content: what happens when each is missing -->

### 3.3 Gotchas
- POST not PATCH (PATCH returns 405)
- Grade must be in CSV column for Path B (defaults to GOOD otherwise)
- `publication_state` not `pub_state` in responses
- Backbox API needs UUID, not numeric listing_id
- Backbox returns array, not object
- Multipart form-data silently fails; use JSON body with CSV in catalog field
- `Accept-Language: en-gb` missing → EUR prices, wrong pub_state
<!-- Content: each gotcha with example of what goes wrong -->

### 3.4 Rate Limits & Error Handling
- HTML response = rate limited (wait 30s, retry)
- 502 = Cloudflare block (retry once)
- Pagination: 10 items per page for listings
- Backbox API: ~2s between calls recommended
<!-- Content: retry logic, backoff strategy -->

---

## 4. Buyback (Trade-in Side)

### 4.1 How Bidding Works
- We set buy prices per model/grade on BM
- Customers choose us based on price
- Device ships to us, we inspect, we payout or counter-offer
<!-- Content: full flow from customer perspective -->

### 4.2 Grade Tiers
- STALLONE = NFC (Non-Functional Cracked)
- BRONZE = NFU (Non-Functional Used)
- SILVER = FC (Functional Cracked)
- GOLD = FU (Functional Used)
- PLATINUM = FG (Functional Good)
- DIAMOND = FE (Functional Excellent)
<!-- Content: what each grade means physically, our repair approach per grade -->

### 4.3 Profitability Formula for Bids
- Hugo's buy box monitor calculates bid profitability
- Inputs: buy price, estimated sell price, estimated parts, estimated labour
- Audit status and findings
<!-- Content: formula breakdown, audit results, reference to buybox-audit.md -->

### 4.4 Hugo's Buybox Monitor
- Script: `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`
- What it does, how it runs, audit findings
<!-- Content: script reference, cron schedule, known issues -->

### 4.5 Related SOPs
- SOP 01: Trade-in order SENT → Monday
- SOP 02: Intake/receiving
- SOP 03: Diagnostic
- SOP 03b: Trade-in payout

---

## 5. Selling (Resale Side)

### 5.1 Listing Creation
- Path A: reactivate existing listing (qty=0 → qty=1)
- Path B: create new listing via JSON body with CSV
- Product_id lookup order: our listings → V7 scraper → Intel table
- Grade must be in CSV column
<!-- Content: full flow, decision tree, examples -->

### 5.2 Post-Listing Verification (MANDATORY)
- Verify grade matches expected
- Verify title contains correct RAM and SSD
- Auto-take offline on any mismatch
- Never skip this step
<!-- Content: verification checklist, what happens on failure -->

### 5.3 Buy Box Management
- Daily check via backbox API
- Full profitability analysis per listing
- Age-based escalation
- Grade ladder integrity
<!-- Content: reference SOP 07, script path -->

### 5.4 Profitability Formula
- Costs: purchase + parts + labour + shipping + buy fee
- Fees: sell fee (10%), VAT (16.67% on margin)
- B/E formula: `(fixed - purchase × 0.1667) / (1 - 0.10 - 0.1667)`
- Net@min: calculated at 3% floor price
<!-- Content: full formula with worked example -->

### 5.5 Related SOPs
- SOP 06: Listing
- SOP 07: Buy box management
- SOP 08: Sale detection
- SOP 09: Shipping
- SOP 10: Payment reconciliation

---

## 6. Costs & Profitability

### 6.1 Cost Components
- Purchase price (ex VAT, from Monday `numeric`)
- Parts cost (from Monday `lookup_mkx1xzd7` — mirror column, comma-separated, sum values)
- Labour (hours × £24/hr, from Monday `formula__1`)
- Shipping: £15 flat
- BM buy fee: purchase × 10%
- BM sell fee: sell × 10%
- VAT (margin scheme): (sell - purchase) × 16.67%
<!-- Content: source column for each, edge cases -->

### 6.2 Break-Even Formula
```
total_fixed = purchase + parts + labour + shipping + bm_buy_fee
break_even = ceil((total_fixed - purchase × 0.1667) / (1 - 0.10 - 0.1667))
```
- Purchase VAT portion REDUCES B/E (not increases)
- Incident: was wrong until Mar 21 fix
<!-- Content: derivation, common mistakes -->

### 6.3 Margin Thresholds
- ≥30% + ≥£100 net: auto-list (currently disabled)
- 15-30%: propose to Ricky
- <15%: flag as low margin
- <0%: flag as loss maker (can still be approved to clear stock)
<!-- Content: threshold rationale, when to override -->

### 6.4 Labour Rate
- £24/hr loaded rate (£18 base Misha + £6 overhead)
- Source: Ricky, Mar 15
<!-- Content: how rate was derived, when to revisit -->

---

## 7. Monday Integration

### 7.1 Board IDs
- Main Board: 349212843
- BM Devices Board: 3892194968
- Parts Board: 985177480
<!-- Content: full board list with purposes -->

### 7.2 Column Reference — Main Board
<!-- Content: full column ID table with types and purposes -->

### 7.3 Column Reference — BM Devices Board
<!-- Content: full column ID table -->

### 7.4 Status Values (status24)
- Index 7: Listed
- Index 8: To List
- Index 10: Sold
- Index 104: Unlisted
<!-- Content: full index reference -->

### 7.5 What Gets Written When
- At listing: status24, listing_id, date_listed, total_fixed_cost
- At sale: status → Sold, sale price
- At shipping: status → Shipped
<!-- Content: full mapping of SOP step → Monday write -->

---

## 8. Scripts Reference

| Script | SOP | Purpose | Status |
|--------|-----|---------|--------|
| sent-orders.js | 01 | Trade-in SENT orders → Monday | ✅ QA'd |
| trade-in-payout.js | 03b | Trade-in payout processing | ✅ QA'd |
| list-device.js | 06 | Listing creation / reactivation | ✅ QA'd |
| reconcile-listings.js | 06.5 | Monday↔BM listings reconciliation | ✅ QA'd |
| buy-box-check.js | 07 | Sell-side buy box management | ✅ QA'd |
| sale-detection.js | 08 | Sale detection from BM orders | ✅ QA'd |
| shipping.js | 09 | Shipping workflow | ✅ QA'd |
| listings-audit.js | — | Listings health check / audit | ✅ QA'd |
| buyback-profitability-builder.js | — | Build profitability lookup from Monday data | ✅ QA'd |
| buy_box_monitor.py | Buyback | Trade-in bidding (Hugo's) | Daily 05:00 |
| sell_price_scraper_v7.js | — | V7 sell prices scraper | Daily 05:00 |

---

## 9. Lessons & Incidents

### 9.1 Grade Mismatch Incident (Mar 21)
- Path B CSV without grade column → BM defaults to GOOD
- Stored listing IDs not spec-verified → wrong product sold
- Fix: grade in CSV, spec+grade verification gate, title verification
<!-- Content: full incident timeline, root causes, fixes -->

### 9.2 Product_id = Exact Spec
- One product_id per RAM/SSD/colour/CPU combo
- Using wrong product_id = wrong product shown to buyer
- V7 scraper gives base model product_id only
- Lookup table from our listings is the reliable source
<!-- Content: full explanation, examples -->

### 9.3 Never Trust, Always Verify
- Verify grade after every listing creation
- Verify title contains correct RAM + SSD
- Verify stored listing IDs match device specs before reuse
- Auto-take offline on any mismatch
<!-- Content: verification rules, what we check -->

---

## 10. SOPs Index

| SOP | Title | Script | Status |
|-----|-------|--------|--------|
| 01 | Trade-in order SENT | sent-orders.js | ✅ Script QA'd |
| 02 | Intake/receiving | — | SOP written, manual process |
| 03 | Diagnostic | — | SOP written, manual process |
| 03b | Trade-in payout | trade-in-payout.js | ✅ Script QA'd |
| 04 | Repair/refurb | — | SOP written, manual process |
| 05 | QC/Final grade | — | SOP written, manual process |
| 06 | Listing | list-device.js | ✅ Script QA'd |
| 06.5 | Listings reconciliation | reconcile-listings.js | ✅ Script QA'd |
| 07 | Buy box management | buy-box-check.js | ✅ Script QA'd |
| 08 | Sale detection | sale-detection.js | ✅ Script QA'd |
| 09 | Shipping | shipping.js | ✅ Script QA'd |
| 10 | Payment reconciliation | — | SOP written, script pending |
| 11 | Tuesday cutoff | — | SOP written, manual process |
| 12 | Returns/aftercare | — | PLACEHOLDER, needs discussion |

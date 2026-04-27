# BM seller-experience API — capabilities for iCorrect

60 endpoints, 124 schemas, base path `/api/seller-experience/`. This is your operations surface — listings, pricing, orders, drafts, finance, insights. Everything below is callable from the user's signed-in Chrome session via `fetch()` with `credentials: 'include'`.

## 1. Listings — read

### 🟢 Bulk-list with filters
**`GET /listings-new`** (preferred) and **`GET /listings`** (older shape)

The full power query. Supports filtering by:
- `publicationStates` — Online / Offline / Pending / etc.
- `markets` — GB / FR / DE / IT / ES / etc.
- `aestheticGrade` — Premium / Excellent / Good / Fair
- `categoryId` — phones / laptops / tablets / etc.
- `hasNewBattery`, `hasBattery9099` — battery-flag filters
- `hasBackbox`, `hasStock` — operational status
- `backboxPriceMinRange/MaxRange` — price-band filters
- `pricingStrategy` — manual / sales-maximizer
- `sku`, `title`, `productId` — text search
- `pageSize`, `cursorId`, `direction`, `orderBy` — paging/sort

**iCorrect use cases:**
- Replace the daily CSV export entirely — pull live inventory without going to the BM UI.
- Build a "stock-out alert" — query `hasStock=false AND publicationState=Online` for everything that's listed but unsellable.
- Find pricing outliers — `pricingStrategy=manual AND backboxPriceMaxRange<...` to spot listings priced way above competition.

### 🟢 Counts (cheap)
**`GET /listings/count`** + **`GET /listings/count-estimate`**

Same filters as above but returns just a number. Good for dashboards.

**iCorrect use cases:**
- Daily inventory health: count of Online vs Offline vs Pending. Send to Telegram.
- Per-grade breakdown across the board (how many Fair vs Good vs Excellent).

### 🟢 Read one listing
**`GET /listings/{listing_uuid}`**

Returns the full ListingDTO including:
- `sku`, `title`, `productId`, `legacyId`, `legacyProductId`, `categoryId`
- `quantity`, `aestheticGrade`, `dualSim`, `thumbnail`
- `markets.{MKT}.publicationState` — Online / Offline / etc.
- `markets.{MKT}.price` + `minimumPrice` + `priceWhenSoldNew`
- `markets.{MKT}.productPageLink.href` — **the canonical public URL** ⭐
- `markets.{MKT}.backboxPrice`, `pricingStrategy`, etc.

**iCorrect use cases:**
- This single call returns everything yesterday's browser scrape produced. **The whole 100-minute Phase 2A URL-capture run collapses to a 30-second loop.** Currently being validated by a sub-agent.

### 🟡 Listings alerts
**`GET /listings/{listing_uuid}/alerts`**

The "Alerts" tab content from the UI. Probably warnings about pricing, stock, compliance.

### 🟡 Search metadata
**`GET /listings/metadata/search`** + **`GET /listings/metadata/create/products/{product_id}`**

The dropdowns/filters/options the UI uses. Useful for understanding what enums BM expects.

### 🟡 Active deal campaigns
**`GET /listings/active-deal-campaigns`**

Currently-running deals. Useful for promo planning.

## 2. Listings — write

### 🟢 Update a listing
**`PATCH /listings/{listing_uuid}`** with body `ListingUpdateDTO`

**Only 3 fields are mutable:**
- `sku` (proven this week — SKU canary)
- `quantity` (integer)
- `markets` — per-market price object: `{GB: {price: {amount, currency}, minimumPrice: ...}, ...}`

**Everything else (title, grade, productId, dualSim, thumbnail) is server-controlled.** That's the constraint that reshapes Codex's "fix mismatched listings" plan — fixing a wrong product binding requires Archive + Create-Draft + Publish, not Update.

**iCorrect use cases:**
- Bulk SKU normalisation across the catalogue (the alignment work Codex was doing).
- Bulk price updates per market (e.g. "raise GB by 5%").
- Stock adjustments without going through the UI.

### 🟢 Lifecycle one-shots
**`POST /listings/{listing_uuid}/archive`** — take down a listing
**`POST /listings/{listing_uuid}/publish`** — re-publish an archived listing

No body needed. Inverse operations.

**iCorrect use cases:**
- Bulk archive aged stock (Offline + zero qty for >X days).
- Auto-republish when stock comes back in from a repair queue.

### 🟢 Pricing automation
**`POST /listings/{listing_uuid}/set-deal-price`** with `MarketDTO` body — set promotional price
**`POST /listings/{listing_uuid}/set-sales-maximizer-price`** — apply BM's automated repricing (per market)
**`POST /listings/{listing_uuid}/set-all-sales-maximizer-prices`** — apply across all markets at once

**iCorrect use cases:**
- Schedule Black Friday / Boxing Day / etc. deal pricing in advance.
- One-click "let BM auto-price everything" for periods where you're not actively monitoring.

### 🟡 BackBox visibility
**`GET /listings/backbox`** + **`POST /listings/{uuid}/get-backbox`** + **`POST /listings/{uuid}/get-all-backboxes`**

Read BackBox info — competing-listing data, price suggestions, grade breakdowns.

**iCorrect use cases:**
- Build a daily "where am I losing the BackBox?" report — for each listing, am I still the cheapest? By how much?
- Triage when to drop price vs let it ride.

### 🔴 Create new listing
**`POST /listings`** with `ListingCreationDTO` body

Required fields:
- `sku` (string)
- `aestheticGrade` (Premium/Shiny/Gold/Silver/Bronze/Stallone)
- `stock` (integer)
- `markets` — array of MarketInfo (which markets to publish to + per-market price)
- `productId` (UUID — the canonical BM product to attach to)

**iCorrect use cases:**
- Auto-create new listings from your repair-queue completion events. When a device finishes QC, the system POSTs a new listing.
- Most useful AFTER you've used `POST /drafts` to define the product itself (see "Products & catalog" below).

### 🔴 Export deals
**`POST /listings/export-deals`**

Probably triggers a CSV export of current/upcoming deals. Worth a probe.

## 3. Orders

### 🟢 Read order detail
**`GET /orders/{order_id}`** with optional `view` query param

The full order — items, customer, shipping, status, timestamps.

**iCorrect use cases:**
- Auto-pull order details into your repair-job-card system.
- Cross-check BM-reported orders against your own DB (the "missing orders triage" Codex was working on).

### 🟢 Cancel order items
**`POST /orders/{order_id}/items/cancel`** with `OrderItemCancelRequest` body (array of items)

Cancel specific items in an order — refund-without-return type flows.

**iCorrect use cases:**
- Auto-cancel when stock check at picking discovers the device is unsellable.
- Bulk-cancel for systemic issues (e.g. "we recalled all listings of model X").

## 4. Products & catalog

### 🟡 Read product spec
**`GET /products/{product_id}`**

The canonical product record — title, category, attributes, image set.

**iCorrect use cases:**
- Build your own catalogue lookup table independent of CSV exports.
- Validate that a SKU you're about to list matches the product's attributes.

### 🟡 Categories + attributes
**`GET /categories`** + **`GET /categories/{category_id}/attributes`**

The full taxonomy — categories you can list under, plus the attributes (RAM, storage, colour…) each category requires.

**iCorrect use cases:**
- Normalise your internal SKU scheme to BM's attribute space (chip / RAM / storage / grade / colour).

### 🔴 Create product draft
**`POST /drafts`** with `ProductDraftPayload` body

Create a new product variant when an existing BM product doesn't match what you're selling. Fields: `categoryId`, `images` (1-6), `aestheticGradeCode` (PREMIUM/SHINY/GOLD/SILVER/BRONZE/STALLONE), `specialOfferTypeCode` (NORMAL/NEW_BATTERY/BATTERY_90_99), `fields` (the category attributes).

**iCorrect use cases:**
- Rare. Most refurbished MacBooks/iPhones already have BM products. Useful when launching a new device line BM hasn't catalogued.

## 5. Sales metrics & finance

### 🟢 Sales metrics
**`GET /sales-metrics?timePeriod=...`** + **`GET /sales-metrics/metadata`**

The headline numbers — revenue, units, AOV per period.

**iCorrect use cases:**
- Daily / weekly summary report straight to Telegram.
- Feed your Mission Control dashboard.

### 🟢 Finance reports
**`GET /finance/report?timeframe=...&currency=...&page=...&page_size=...`** + **`GET /finance/report/metadata`**

Per-period seller payouts — what BM owes you, what's been paid.

**iCorrect use cases:**
- Auto-pull into Xero / your finance pipeline.
- Reconcile BM payout claims against your bank without going to the BM UI monthly.

### 🟡 Insights (Tableau)
**`GET /insights`** + **`GET /insights/embedded?project=...&view=...`**

Lists available Tableau dashboards and returns embed tickets for them. The dashboards themselves are Tableau-hosted.

**iCorrect use cases:**
- Embed the BM-curated metrics into your own dashboards.
- Less interesting than `/sales-metrics` for raw data because Tableau views are pre-shaped.

## 6. Pricing rules

### 🟡 Pricing-rule CRUD
**`GET /pricing-rules`** — list current rules
**`POST /pricing-rules`** with `PricingRuleCreationDTO` (`{multiplier, offset, targetMarket, category?}`) — create
**`DELETE /pricing-rules/{id}`** — delete
**`POST /pricing-rules/{id}/apply`** — apply to listings
**`GET /pricing-rules/metadata`** — supported options

### 🟡 Reference market + seller config
**`PATCH /pricing-rules/reference-market`** with `ReferenceMarketDTO` — change which market is the price baseline (e.g. "GB is my reference, others derive from it")
**`GET/PATCH /pricing-rules/seller-configurations`** — bulk seller-level pricing config

**iCorrect use cases:**
- Define a rule like "DE = GB × 1.15 + £5" once, apply across the catalogue.
- Instead of manually pricing each market per listing, set rules once and let BM derive.

## 7. Mailbook (saved contacts)

### 🟡 Contact CRUD
**`GET /mailbook`** — list all
**`POST /mailbook`** with `{emailAddress, contactType}` — add
**`DELETE /mailbook/{contact_id}`** — remove
**`PUT /mailbook/{contact_id}/types`** — change what notifications a contact receives
**`GET /mailbook/metadata`** — what contact types exist

**iCorrect use cases:**
- Auto-add new team-member emails when staff change.
- Audit who receives what BM notifications (compliance / accounting / ops).

## 8. Seller profile

### 🟢 Seller info & features
**`GET /seller/information`** — your seller account record
**`GET /seller/features`** — what BM features your account has access to

**iCorrect use cases:**
- Detect when BM enables / disables a feature for you (sales-maximizer, BackBox, new markets) so you can react.

### 🟡 Terms & conditions
**`GET /seller/terms-and-conditions`** + `/document/{version}` + `/sign` + `/signed`

Read T&Cs status. The `/sign` flow is initiation; `/signed` is the post-sign callback. Probably DocuSign or similar under the hood.

**iCorrect use cases:**
- Track when BM ships new T&Cs. Auto-flag for your legal review.

## 9. Onboarding & legal

### 🔴 Onboarding flow
**`GET /onboarding/self-onboarding`** + **`GET /onboarding/v2/self-onboarding`** — get steps + status
**`POST /onboarding/webhook/qualification-form`** — Typeform-style submission webhook

One-time setup. Not relevant once your account is live.

### 🟡 DSA contact details
**`POST/GET /legal-details/dsa/contact-details`** + **`POST /legal-details/dsa/contact-details/bulk/import`**

EU Digital Services Act requires sellers to publish contact details for each product category. BM exposes get/save/bulk-import.

**iCorrect use cases:**
- Set or update DSA compliance contact in one call across the whole catalogue.
- One-time bulk import when DSA went live.

## 10. Inventory opportunities

### 🟡 Browse opportunities
**`GET /opportunities/inventory`** with filters (`productTitle`, `categoryId`, `backboxGrade`, `currency`, `competitionLevel`, `page`, `pageSize`)
**`GET /opportunities/inventory/metadata`**

BM's "what should you list more of" recommendations.

**iCorrect use cases:**
- Auto-pull weekly into a "buying recommendations" dashboard for the parts/buyback team.
- Cross-reference with Backbox to identify high-margin opportunities.

## 11. Internal / staff endpoints

**`GET /staff/seller/{seller_id}`** — Get seller details (probably for BM staff support; check if it works for non-staff)
**`GET /v1/hello`** (in payout-experience) — health-check

## What's NOT here

Notable gaps from what you might expect:
- **No customer-message endpoints** in seller-experience. Customer-facing chat is presumably under a different service prefix not surfaced today.
- **No returns/refunds endpoints** beyond `cancel-items`. Return-merchandise-authorisation flow is presumably elsewhere.
- **No warranty or claim endpoints.**
- **No inventory-history / audit-log endpoints** for tracking changes over time.

Some of these may live in services we haven't probed yet. The bundle-grep surfaced `/api/v1/{products,quotes,sourcing-opportunities,tasks}` and `/api/tableau-2` without OpenAPIs — worth a 30-min Network-capture sweep when you next have the seller portal open.

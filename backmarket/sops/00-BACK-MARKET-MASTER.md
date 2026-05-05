# Back Market Master Reference — iCorrect

**Version:** 2.0
**Date:** 30 Mar 2026
**Status:** Complete reference document

---

## 1. How Back Market Works (Our Context)

### 1.1 Two Sides of BM

**Buyback (trade-in):** Customers sell MacBooks to iCorrect via BM's buyback platform. Customer describes condition → BM matches to our bid → customer ships device → we receive, inspect, payout → we repair/refurb → we resell.

**Selling (resale):** We list refurbished devices on BM. Buyers purchase → we ship → BM pays us (minus 10% commission). Revenue split: ~60% of iCorrect total (~£31k/mo).

**Money flow:**
```
Customer → BM → iCorrect (purchase price minus 10% BM buy fee)
                   ↓
              Repair/refurb
                   ↓
           iCorrect → BM → Buyer (sale price minus 10% BM sell fee)
```

BM takes 10% on both sides (buy + sell).

### 1.2 Account & API Access

| Detail | Value |
|--------|-------|
| API base URL | `https://www.backmarket.co.uk` |
| Auth env var | `BACKMARKET_API_AUTH` / `BM_AUTH` (Basic auth) |
| Language env var | `BACKMARKET_API_LANG` (`en-gb`) |
| User agent env var | `BACKMARKET_API_UA` |
| Monday token | `MONDAY_APP_TOKEN` |
| Telegram | `TELEGRAM_BOT_TOKEN` + `BM_TELEGRAM_CHAT` |
| Env file | `/home/ricky/config/.env` (or `/home/ricky/config/api-keys/.env`) |

**All 3 BM headers required on EVERY call:**
```
Authorization: {BACKMARKET_API_AUTH}
Accept-Language: en-gb
User-Agent: {BACKMARKET_API_UA}
```

Missing `Accept-Language: en-gb` → EUR prices and wrong `pub_state`.

### 1.3 SLAs & Timelines

| SLA | Timeline | Consequence |
|-----|----------|-------------|
| Order acceptance | ASAP after state=1 (auto-accept via SOP 08) | Delayed acceptance = lost sale |
| Shipping after acceptance | 2-3 business days | Overdue flag on BM, potential penalty |
| Trade-in payout | 48h from `receivalDate` | Customer complaint, BM intervention |
| Counter-offer response | 7 days (customer has 7 days to accept/reject) | Auto-accepted if no response |
| Payout cycle | Wednesday to Tuesday | Tuesday EOD UK = cutoff for weekly payout |

### 1.4 Grade Mapping

**Sell-side grades (what we list as):**

| Our Grade | BM API Value | Usage |
|-----------|-------------|-------|
| Fair | FAIR | Cosmetic wear, fully functional |
| Good | GOOD | Minor wear |
| Excellent | VERY_GOOD | Near-perfect condition |

**Buy-side grades (what customers declare):**

| BM Grade | Monday Label | Condition |
|----------|-------------|-----------|
| STALLONE | NONFUNC_CRACKED | Non-functional + cracked |
| BRONZE | NONFUNC_USED | Non-functional + used |
| SILVER | FUNC_CRACKED | Functional + cracked |
| GOLD | FUNC_USED | Functional + used |
| PLATINUM | FUNC_GOOD | Functional + good |
| DIAMOND | FUNC_EXCELLENT | Functional + excellent |

---

## 2. Product Catalogue

### 2.1 Product IDs — How They Work

Every unique spec combination on BM has its own `product_id` (UUID). This is NOT one per model. It's one per exact combination of: model + CPU/GPU + RAM + SSD + colour.

Example for MacBook Pro 13" M1 (A2338):
- 8GB/256GB/Grey → `8948b82c`
- 8GB/256GB/Silver → `0dfd2e16`
- 16GB/512GB/Grey → `2e0861d0`

### 2.2 backmarket_id vs product_id vs listing_id

| ID | Type | What | Who sets |
|----|------|------|----------|
| `product_id` | UUID | One spec combination in BM's catalog | BM (we submit it) |
| `backmarket_id` | Numeric | BM's internal catalog entry for that spec | BM (assigned on creation) |
| `listing_id` | Numeric | Our specific listing on that catalog entry | BM (returned after creation) |
| `id` (UUID) | UUID | Listing UUID used for backbox API | BM |

### 2.3 How Titles Are Determined

Title is set by `product_id`, not by seller. BM auto-generates the title from the catalog entry. We cannot override it. Using the wrong `product_id` = buyer sees the wrong spec.

### 2.4 Canonical Data Files

| File | What | Entries |
|------|------|--------|
| `data/bm-catalog.json` | Single product resolver (merged from 3 sources) | 309 variants |
| `data/listings-registry.json` | Pre-built verified listing slots | 261 slots |
| `data/product-id-lookup.json` | Historical product_id lookup from our listings | 279 entries |
| `data/order-history-product-ids.json` | Product_ids from completed orders | 234 entries |
| `data/listings-colour-map.json` | Colour extracted from listing SKUs | 157 entries |

The catalog (`bm-catalog.json`) is the single product resolver. Every other file is an input to the catalog merge.

### 2.5 Sold-Out Specs

Sold-out = no sellers, not no product. BM doesn't expose `product_id` for picker options with zero sellers. We can only get product_ids for:
- Specs currently for sale (scraper)
- Specs we've listed before (lookup table)
- Specs we've sold before (order history)

For genuinely new specs nobody has listed, we cannot get the `product_id` via automated means. Park the device for manual review.

### 2.6 SKU Format Standard

Format: `{Type}.{Model}.{Chip}.{GPU?}.{RAM}.{Storage}.{Colour}.{Grade}`

| Part | Values |
|------|--------|
| Type | `MBA` (Air), `MBP` (Pro) |
| Model | A-number (e.g. A2337, A2338) |
| Chip | M1, M2, M3, M1PRO, M2PRO, M3PRO, M1MAX, I3, I5, I7 |
| GPU | Core count only when variants exist (e.g. 7C, 8C for Air M1) |
| RAM | 8GB, 16GB, etc. |
| Storage | 256GB, 512GB, 1TB, 2TB |
| Colour | Grey, Silver, Gold, Midnight, Starlight, Space Black |
| Grade | Fair, Good, Excellent (or FAIR, GOOD, VERY_GOOD in registry) |

Example: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`

---

## 3. API Reference

### 3.1 Endpoints

| Endpoint | Method | Purpose | SOP |
|----------|--------|---------|-----|
| `/ws/listings` | POST | Create new listing (CSV body) | 06 |
| `/ws/listings/{id}` | GET | Read listing details | 06, 07 |
| `/ws/listings/{id}` | POST | Update listing (qty, price, pub_state) | 06, 07 |
| `/ws/tasks/{id}` | GET | Poll creation task status | 06 |
| `/ws/backbox/v1/competitors/{uuid}` | GET | Buy box price (uses UUID, NOT listing_id) | 06, 07 |
| `/ws/orders?state=1` | GET | New sales orders | 08 |
| `/ws/orders/{id}` | POST | Accept order | 08 |
| `/ws/orders?state=9` | GET | Completed orders | 10 |
| `/ws/buyback/v1/orders?status=SENT` | GET | Shipped trade-in orders | 01 |
| `/ws/buyback/v1/orders/{id}` | GET | Trade-in order detail | 01 |
| `/ws/buyback/v1/orders/{id}/validate` | PUT | Payout (IRREVERSIBLE) | 03b |
| `/ws/buyback/v1/orders/{id}/suspend` | PUT | Suspend order (iCloud lock) | 02 |
| `/ws/buyback/v1/orders/{id}/messages` | GET/POST | Customer messaging | 02 |

### 3.2 Critical API Rules

- **POST not PATCH** for listing updates (PATCH returns 405)
- **Grade must be in CSV** for Path B creation (BM defaults to GOOD without it)
- **`pub_state: 2`** must be explicit on every activation
- **`currency: "GBP"`** required in every listing POST
- **Backbox uses UUID** (`listing.id`), NOT numeric `listing_id`
- **Backbox returns array**, not object — handle `[0]`
- **Multipart form-data silently fails** for listing creation — use JSON body with CSV in `catalog` field
- **Pagination:** 10 items per page for listings (regardless of `limit` param)

### 3.3 Rate Limits & Error Handling

| Response | Meaning | Action |
|----------|---------|--------|
| HTML response | Rate limited | Wait 30s, retry up to 3 times |
| 502 | Cloudflare block | Retry once after delay |
| 4xx | Client error | Do NOT retry (check payload) |
| 5xx | Server error | Retry once after 30s |

---

## 4. Buyback (Trade-in Side)

### 4.1 Pipeline

```
Customer lists on BM → BM sends SENT order → SOP 01 creates Monday items
→ Device arrives → SOP 02 intake (iCloud + spec check)
→ SOP 03 diagnostic (grades, parts, profitability)
→ SOP 03b payout (IRREVERSIBLE)
→ SOP 04 repair/refurb
→ QC → Final Grade assigned
→ SOP 06 listing
```

### 4.2 Grade Tiers & Repair Approach

| BM Grade | Monday Label | Physical Condition | Typical Approach |
|----------|-------------|-------------------|-----------------|
| STALLONE | NONFUNC_CRACKED | Non-functional + cracked screen | Major repair + screen replacement |
| BRONZE | NONFUNC_USED | Non-functional + cosmetic wear | Board/component repair |
| SILVER | FUNC_CRACKED | Working + cracked screen | Screen replacement |
| GOLD | FUNC_USED | Working + wear | Cosmetic refurb |
| PLATINUM | FUNC_GOOD | Working + minor wear | Light refurb |
| DIAMOND | FUNC_EXCELLENT | Working + near-perfect | Clean and list |

### 4.3 Acquisition Policy (confirmed 12 Mar 2026)

- STOP bidding on GOLD/PLATINUM/DIAMOND: 76% arrive damaged
- SILVER only with screen cost factored in
- BRONZE, STALLONE acceptable if priced right

### 4.4 Related SOPs

| SOP | What |
|-----|------|
| 01 | SENT orders → Monday (BM numbering, assessments, device matching) |
| 02 | Intake: iCloud check + Apple spec lookup + spec comparison |
| 03 | Diagnostic: pre-grades, ammeter, profitability prediction |
| 03b | Payout: validate via BM API (irreversible) |
| 04 | Repair & refurb: parts consumption, labour tracking |

---

## 5. Selling (Resale Side)

### 5.1 Listing Creation (SOP 06)

**Registry first.** 261 pre-built verified listing slots in `listings-registry.json`. Look up SKU → get `listing_id` → bump qty + set price. No creation needed.

**Path B fallback.** For specs not in the registry, create fresh via CSV body to `POST /ws/listings`. Always create at qty=0 state=3 (draft). Never reactivate old listings.

**Live scrape before P&L.** Single-page scrape of the device's BM product page for live grade prices and adjacent spec pricing. Backbox for competitive price after activation.

### 5.2 Post-Listing Verification (MANDATORY)

Every listing, every time. Verify:
- `product_id` matches expected
- `grade` matches (FAIR/GOOD/VERY_GOOD)
- Title contains correct RAM and SSD
- Colour verified by catalog or title
- `publication_state` and `quantity` correct

Mismatch → qty=0 immediately. Monday NOT updated. Telegram alert.

### 5.3 Pricing

**Pricing cascade:**
1. Backbox `price_to_win` (if available and ≥ floor)
2. Floor price (if backbox below floor)
3. Live scrape grade price (if no backbox)
4. Floor × 1.5 (if no scrape and no backbox)

**Never use old listing prices.** They are stale.

### 5.4 Related SOPs

| SOP | What |
|-----|------|
| 06 | Listing: registry lookup, live scrape, clean-create, backbox pricing |
| 06.5 | Reconciliation: Monday vs BM cross-check |
| 07 | Buy box: price monitoring and auto-bump |
| 08 | Sale detection: auto-accept, Monday updates |
| 09 | Label buying |
| 09.5 | Shipment confirmation to BM |
| 10 | Payment reconciliation (manual) |
| 11 | Tuesday cutoff protocol |
| 12 | Returns and aftercare |

---

## 6. Costs & Profitability

### 6.1 Cost Components

| Cost | Source | Column |
|------|--------|--------|
| Purchase price (ex VAT) | BM Devices Board | `numeric` |
| Parts cost | Main Board (mirror, comma-separated, sum) | `lookup_mkx1xzd7` |
| Labour | Main Board (hours × £24/hr) | `formula__1` |
| Shipping | Flat | £15 |
| BM buy fee | purchase × 10% | Calculated |
| BM sell fee | sell × 10% | Calculated |
| VAT (margin scheme) | (sell - purchase) × 16.67% (if positive) | Calculated |

**Labour rate:** £24/hr (£18 base + £6 overhead). Source: Ricky, Mar 15.

### 6.2 Break-Even Formula

```
total_fixed = purchase + parts + labour + shipping + bm_buy_fee
break_even = ceil((total_fixed - purchase × 0.1667) / (1 - 0.10 - 0.1667))
```

Purchase VAT portion REDUCES break-even (VAT is only on margin above purchase price).

### 6.3 Profitability at min_price

```
min_price = ceil(proposed × 0.97)    # 3% floor
bm_sell_fee = min_price × 0.10
vat = max(0, (min_price - purchase) × 0.1667)
total_costs = purchase + parts + labour + shipping + bm_buy_fee + bm_sell_fee + vat
net = min_price - total_costs
margin = (net / min_price) × 100
```

`numeric_mm1mgcgn` stores only Total Fixed Cost (`purchase + parts + labour + shipping + bm_buy_fee`). `formula_mm0za8kh` is deprecated for automation because total cost depends on a sale/listing price and the Monday formula/mirror wiring can return null. Projected total costs are calculated during listing review; actual total costs are calculated by sale detection from the real BM order price.

### 6.4 Decision Gates

| Condition | Decision |
|-----------|----------|
| Net ≥ £50 and margin ≥ 15% | PROPOSE |
| Net ≥ £50 and margin < 15% | PROPOSE (flag low margin) |
| Net < £50 | BLOCK (unless `--min-margin 0` override) |
| Net < £0 | BLOCK (unless `--min-margin 0` override) |

**Buy box auto-bump gates (SOP 07):**

| Margin | Net | Action |
|--------|-----|--------|
| ≥ 30% | ≥ £50 | Auto-bump (silent) |
| 15-30% | ≥ £50 | Auto-bump + flag Telegram |
| < 15% | any | DO NOT bump |
| any | < £50 | DO NOT bump |

---

## 7. Monday Integration

### 7.1 Boards

| Board | ID | Purpose |
|-------|----|---------|
| Main Board | 349212843 | Primary repair/sales workflow |
| BM Devices Board | 3892194968 | BM-specific device data, listing linkage |
| Parts Board | 985177480 | Parts inventory and supply prices |

### 7.2 Key Main Board Columns

| Column ID | Title | Type |
|-----------|-------|------|
| `text_mky01vb4` | BM Trade-in ID | text |
| `text4` | IMEI/SN (serial) | text |
| `status4` | Status | status |
| `status24` | Repair Type / lifecycle | status |
| `status8` | Colour | status |
| `status_2_Mjj4GJNQ` | Final Grade | status |
| `lookup_mkx1xzd7` | Parts Cost (mirror) | mirror |
| `formula_mkx1bjqr` | Labour Cost £ | formula |
| `formula__1` | Labour Hours / RR&D Time | formula |
| `text53` | Outbound Tracking | text |
| `date_mkq385pa` | Date Listed (BM) | date |
| `date_mkq34t04` | Date Sold (BM) | date |
| `board_relation5` | Link to Devices/BM Devices candidate relation | board_relation |

### 7.3 Key BM Devices Board Columns

| Column ID | Title | Type |
|-----------|-------|------|
| `text_mkyd4bx3` | BM Listing ID | text |
| `text_mm1dt53s` | Product UUID | text |
| `text89` | SKU | text | Generated during SOP 05 QC handoff; validated during SOP 06 listing |
| `numeric` | Purchase Price (ex VAT) | numbers |
| `numeric_mm1mgcgn` | Total Fixed Cost | numbers |
| `numeric5` | Sale Price (ex VAT) | numbers |
| `text_mkye7p1c` | BM Sales Order ID | text |
| `text4` | Sold to (buyer) | text |
| `text8` | Seller (customer) | text |
| `status__1` | RAM | status |
| `color2` | SSD | status |
| `status7__1` | CPU | status |
| `status8__1` | GPU | status |
| `color_mm1fj7tb` | Trade-in Grade | status |
| `board_relation` | Link to Main Board | board_relation |
| `lookup_mm1vzeam` | BM Trade-in ID (mirror) | mirror |

### 7.4 Status Values (status24)

| Index | Value | Set By |
|-------|-------|--------|
| 3 | Counteroffer | icloud-checker (spec mismatch) |
| 6 | Purchased | bm-payout (after BM validate) |
| 7 | Listed | list-device.js (after verified listing) |
| 8 | To List | QC tech (after final grade and BM Devices SKU handoff) |
| 10 | Sold | sale-detection.js (after sale confirmed) |
| 12 | Pay-Out | Team (triggers payout webhook) |
| 104 | Unlisted | Manual |

### 7.5 Groups

| Group | ID | Board | Purpose |
|-------|----|-------|---------|
| Incoming Future | `new_group34198` | Main | Incoming trade-ins |
| Today's Repairs | `new_group70029` | Main | Active repair queue |
| iCloud Locked | `group_mktsw34v` | Main | Locked devices |
| BMs Awaiting Sale | `new_group88387__1` | Main | Devices ready to list/listed |
| BM Trade-Ins | `group_mkq3wkeq` | BM Devices | Active trade-in items |
| Shipped | `new_group269` | BM Devices | Shipped to buyer |
| BM Returns | `new_group_mkmybfgr` | BM Devices | Returned by buyer |

---

## 8. Services & Scripts

### 8.1 Live Webhook Services

| Service | Port | Route | SOP | systemd |
|---------|------|-------|-----|---------|
| icloud-checker | 8010 | `/webhook/icloud-check` | 02 | `icloud-checker.service` |
| bm-grade-check | 8011 | `/webhook/bm/grade-check` | 03 | `bm-grade-check.service` |
| bm-payout | 8012 | `/webhook/bm/payout` | 03b | `bm-payout.service` |
| bm-shipping | 8013 | `/webhook/bm/shipping-confirmed` | 09.5 | `bm-shipping.service` |

All behind nginx at `mc.icorrect.co.uk`. Port 8010 not exposed publicly.

### 8.2 Scripts

| Script | SOP | Purpose |
|--------|-----|---------|
| `sent-orders.js` | 01 | BM SENT orders → Monday (BM numbering, PDF assessments, device matching) |
| `list-device.js` | 06 | Listing: registry lookup, live scrape, clean-create, backbox pricing |
| `reconcile-listings.js` | 06.5 | Monday ↔ BM listings reconciliation |
| `buy-box-check.js` | 07 | Buy box monitoring and auto-bump |
| `sale-detection.js` | 08 | Sale detection and auto-accept |
| `build-listings-registry.js` | — | Pre-create and verify listing slots |

All scripts at `backmarket/scripts/`. Shared lib at `scripts/lib/`.

### 8.3 Scraper

**File:** `buyback-monitor/sell_price_scraper_v7.js`
**Schedule:** Weekly, Monday 05:00 UTC (`run-weekly.sh`)
**Coverage:** 16 MacBook models + 27 iPhone/iPad models (via `--all`)
**Output:** `buyback-monitor/data/sell-prices-latest.json`

### 8.4 Cron Jobs

| Schedule | Script | Status |
|----------|--------|--------|
| `0 5 * * 1` | `run-weekly.sh` (V7 scraper → Python `buy_box_monitor.py` → sheet sync) | Active |
| `0 6 * * *` | `sent-orders.js --live` | Active |
| `0 7-17 * * 1-5` and `0 8,12,16 * * 6,0` | `sale-detection.js` | Active |
| `0 7 * * 1-5` and `0 12 * * 1-5` | `dispatch.js` | Active |
| — | `reconcile-listings.js` | No live cron |
| — | `buy-box-check.js` | No live cron |

---

## 9. Lessons & Incidents

### 9.1 Grade Mismatch Incident (Mar 21)

Path B CSV without grade column → BM defaults to GOOD regardless of intent. Stored listing IDs not spec-verified → wrong product sold.

**Fixes:** Grade must be in CSV. Spec+grade verification gate. Title verification mandatory after every listing. Auto-take offline on mismatch.

### 9.2 Rogue Payout Incident (Mar 27)

Old Python payout watcher ran alongside new webhook service, causing duplicate payouts. Evidence preserved in `audit/payout-incident-evidence-2026-03-27/`.

**Fixes:** Old watcher killed. Payout service hardened with dedup (in-flight + recent-update scan). Crontab cleaned.

### 9.3 £626 M3 Pro Incident (Mar 27)

Script reactivated a dormant listing with a stale price. Backbox returned 404 (listing offline), so it fell back to the old listing price which was months out of date.

**Fixes:** Never reactivate old listings. Clean-create only. Draft first, price from backbox after creation. Safe placeholder (floor × 2) for draft. Registry of 261 verified slots eliminates on-demand creation.

### 9.4 Cost Column Bug (Mar 27-28)

`list-device.js` was reading `formula_mkx1bjqr` (Labour Cost £) as Parts Cost. The real Parts Cost is `lookup_mkx1xzd7` (mirror column, comma-separated, summed).

**Fix:** Corrected column read. Backfilled 7 active devices with correct Total Fixed Cost. Added `--recalc` flag to `buy-box-check.js` for live cost refresh.

---

## 10. SOPs Index

| SOP | Title | Script/Service | Status |
|-----|-------|---------------|--------|
| 01 | Trade-in Purchase | `sent-orders.js` | QA'd ✅ |
| 02 | Intake & Receiving | `icloud-checker` (8010) | QA'd ✅ |
| 03 | Diagnostic | `bm-grade-check` (8011) | QA'd ✅ |
| 03b | Trade-in Payout | `bm-payout` (8012) | QA'd ✅ |
| 04 | Repair & Refurb | Manual process | QA'd ✅ |
| 05 | QC & Final Grade | Not documented | Gap |
| 06 | Listing | `list-device.js` | QA'd ✅ v2.1 |
| 06.5 | Listings Reconciliation | `reconcile-listings.js` | QA'd ✅ (on-demand; no live cron) |
| 05 | QC & Final Grade | Manual process | Placeholder (see SOP 05) |
| 07 | Buy Box Management | `buy-box-check.js` | QA'd ✅ (on-demand; no live cron) |
| 08 | Sale Detection | `sale-detection.js` | QA'd ✅ + live cron |
| 09 | Label Buying | `dispatch.js` | QA'd ✅ + weekday dispatch cron |
| 09.5 | Shipment Confirmation | `bm-shipping` (8013) | QA'd ✅ + webhook-driven |
| 10 | Payment Reconciliation | Manual process | QA'd ✅ |
| 12 | Returns & Aftercare | Manual + counter-offer buttons; auto via Phase 4.9 (`backmarket-browser/operations/returns.js`) — in build | QA'd ✅ |

**SOP 11 removed 2026-04-17:** dropped from active scope per rebuild plan v2. Payout-cycle SLA enforcement handled via SOP 10 + `stuck-inventory-audit.js` (Phase 1).

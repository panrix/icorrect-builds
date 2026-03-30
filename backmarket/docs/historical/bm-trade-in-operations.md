# Back Market Trade-In Operations

> **Source:** Verified by Backmarket agent against live system — 23 Feb 2026  
> **Supersedes:** `raw-imports/backmarket-trade-in-operations.md`  
> **Status:** Current and verified

---

## Overview

Back Market trade-ins are iCorrect's primary revenue stream (~60% of total revenue). Customers sell their MacBooks to iCorrect via the Back Market platform. iCorrect receives the device, diagnoses it, refurbishes if needed, and resells on Back Market.

**Full pipeline:**  
Customer ships device → iCorrect receives & diagnoses → Spec validation → Payout to customer → Refurbish if needed → List on Back Market → Sell → Ship to buyer

---

## Revenue Model

| Metric | Typical Value |
|--------|--------------|
| Purchase price (paid to customer) | £85 – £300+ (depends on model/condition) |
| Sale price on Back Market | £350 – £1,300+ |
| Back Market sale fee | 10% of sale price |
| Profit margin | 50–72% on individual devices |
| Weekly BM payout target | £10,000+ minimum |
| Payout cycle | Wednesday to Tuesday (Tuesday is cutoff) |

---

## n8n Automation Flows

### Flow 0: Trade-In Orders → Monday Boards
| Field | Value |
|-------|-------|
| Workflow ID | `GJbVeldhpWU1KEG3` |
| Trigger | Schedule |
| What it does | Fetches SENT trade-in orders from BM API, extracts device details from PDF assessment, creates items on Main Board + BM Board, sends Slack notification |
| Boards | Main Board (349212843) + BM Board (3892194968) |
| Status | ✅ Active |

### Flow 2: Serial Check / iCloud Check
| Field | Value |
|-------|-------|
| Workflow ID | `gU8alMqvddNjebf6` |
| Trigger | Slack command: `/bm check [BM number] [serial]` |
| What it does | Checks device serial against expected spec, detects iCloud lock, updates Monday boards |
| Status | ✅ Active |
| Known issue | Currently auto-changes device model column on mismatch — should only flag, not auto-change. Fix pending as part of new intake system. |

### Flow 3: iCloud Recheck
| Field | Value |
|-------|-------|
| Workflow ID | `KRNukgA2aqIbuNNL` |
| Trigger | Slack command: `/bm recheck [BM number]` |
| What it does | Re-runs iCloud check after customer claims to have removed account. If unlocked → moves to Today's Repairs. If still locked → re-notifies customer. |
| Status | ✅ Active |

### Flow 4: Payout (Auto-Validate)
| Field | Value |
|-------|-------|
| Workflow ID | `lGiPEDaZBfUjuA7h` |
| Status | ⛔ DISABLED — team was triggering payouts incorrectly. All payouts are manual via BM API until process is confirmed. |

### Flow 5: BM Device Listing
| Field | Value |
|-------|-------|
| Status | ⛔ DISABLED — was under-selling devices with dumb pricing logic. All listings are created manually until a proper pricing-aware listing module is built. |
| Replacement | Manual listing via BM API with direct product UUID discovery (see Listing SOP) |

### Flow 6: Sales Alert v2
| Field | Value |
|-------|-------|
| Workflow ID | `HsDqOaIDwT5DEjCn` |
| Trigger | Cron: hourly 8–18 weekdays, 9/13/17 weekends |
| What it does | Detects new BM orders (state 1), matches to Monday BM board items via listing_id in UUID column, updates both boards with buyer name and order ID |
| Status | ✅ Active |
| Important | Does NOT auto-accept orders. Order acceptance is manual — Ricky reviews and approves each order. |
| Matching logic | Matches by numeric listing_id stored in `text_mkyd4bx3` column on BM board. UUID column must contain the numeric listing_id (not full UUID) for matching to work. |

### Flow 7: Ship Confirmation
| Field | Value |
|-------|-------|
| Workflow ID | `D4a5qbCtQmSCUIeT` |
| Trigger | Manual trigger |
| What it does | Confirms shipment to BM API (tracking + serial), moves items on BM board |
| Status | ✅ Active (fixed Feb 2026 — hardcoded group filter removed) |

---

## Monday.com Board Schema

### Main Board
**Board ID:** `349212843`

| Column ID | Column Name | Notes |
|-----------|-------------|-------|
| `status24` | Listing Status | 7=Listed, 8=To List, 10=Sold, 12=Pay-Out, 6=Purchased |
| `text_mkydhq9n` | Listing ID | Numeric BM listing_id |
| `text53` | Outbound Tracking | Tracking number for buyer shipment |
| `text4` | Serial | Device serial number |
| `text5` | Customer | Customer name |
| `text_mky01vb4` | Order ID | BM sale order ID |

**Key Groups:**
| Group Name | Group ID |
|------------|----------|
| BMs Awaiting Sale | `new_group88387__1` |
| Outbound Shipping | `new_group77650__1` |
| Quality Control | `group_mkwkapa6` |

### BM Board
**Board ID:** `3892194968`

| Column ID | Column Name | Notes |
|-----------|-------------|-------|
| `text_mkyd4bx3` | Listing UUID | Must contain **numeric listing_id** for Flow 6 matching |
| `text4` | Sold To | Buyer name — must be EMPTY for Flow 6 to assign |
| `text_mkye7p1c` | Sales Order ID | Real BM order ID only (not line item ID) |
| `text89` | SKU | Device SKU |
| `text_mkqy3576` | BM Order ID | Trade-in order public ID (e.g. GB-26081-WJLEO) |
| `status__1` | RAM | index 11 = 8GB, index 1 = 16GB |
| `status7__1` | CPU | 0=10-Core, 3=12-Core, 6=11-Core, 11=8-Core, 15=Intel |
| `status8__1` | GPU | GPU core count |
| `color2` | Storage | |
| `mirror` | Colour | Mirror — read only |
| `mirror_Mjj4H2hl` | Grade | Mirror — read only |
| `mirror3__1` | IC Status | IC ON / IC OFF |
| `mirror7__1` | Serial | Mirror from Main Board |
| `lookup_mkqg4gr8` | Overall Grade | Physical condition assessment |
| `lookup_mkqgb1te` | Battery Health | |
| `lookup_mkqgkkpg` | Damage | Damaged / None |
| `lookup_mkqg1q79` | Screen Grade | |
| `lookup_mkqgq791` | Casing Grade | |

**Key Groups:**
| Group Name | Group ID |
|------------|----------|
| BM To List / Listed / Sold | `new_group` |
| BM Trade-Ins | `group_mkq3wkeq` |
| BM Returns | `new_group_mkmybfgr` |

---

## Grading Criteria

### Back Market Grade Mapping
| BM Grade | Condition | Notes |
|----------|-----------|-------|
| Fair | Functional with visible cosmetic wear | Scratches, marks visible |
| Good | Minor cosmetic imperfections | Light wear only |
| Excellent | Near-new condition | No visible marks |

### Pre-Grade Assessment (at intake)
| Component | Excellent | Good | Fair |
|-----------|-----------|------|------|
| LCD | No visible marks | Minor marks, no display impact | Noticeable marks, possible backlight issues |
| Lid | No dents or scratches | Minor cosmetic wear | Noticeable dents or wear |
| Top Case | No wear, all keys working, trackpad perfect | Minor wear, fully functional | Visible wear, minor cosmetic issues |

---

## Spec Validation (New — Being Built)

> ⚠️ This is being implemented as part of the new intake system (week of 23 Feb 2026).

When serial number is entered at intake, the system checks device specs against:
- **Apple Self Service Repair** — primary source for M1 and above (returns Logic Board spec: CPU/GPU cores, RAM, storage)
- **Bookyard** — secondary source for Intel/T2 models

**Spec Validated column (new Monday column — pending creation):**
| Status | Meaning |
|--------|---------|
| Y - Apple | Confirmed via Apple Self Service Repair |
| Y - Bookyard | Confirmed via Bookyard |
| Y - Manual | Physically verified by tech (About This Mac) |
| Unconfirmed | Lookup not yet run |
| Mismatch | Returned spec does not match BM board data |

**On Mismatch:** Auto-suspend BM order → notify Ricky → feed into counter-offer flow.

**Device must be Spec Validated = Y before listing.**

---

## Operational Flow (End-to-End)

```
1. CUSTOMER LISTS ON BACK MARKET
   └→ Customer creates trade-in listing on BM platform

2. BACK MARKET SENDS ORDER TO ICORRECT (SENT status)
   └→ Flow 0 picks up the order
   └→ Creates item on Main Board + BM Board
   └→ Slack notification sent

3. CUSTOMER SHIPS DEVICE
   └→ Royal Mail label provided by BM
   └→ Tracking updates on Monday board

4. ICORRECT RECEIVES DEVICE
   └→ Team matches customer name to BM number
   └→ Serial entered in Monday BM Board
   └→ Flow 2 triggered: /bm check [BM number] [serial]
   └→ Spec validation runs (Apple Self Service Repair / Bookyard)
   └→ iCloud status checked
   └→ If iCloud locked → SOP-T3
   └→ If spec mismatch → SOP-T4 → counter-offer flow
   └→ If clear → proceeds to diagnostic

5. DIAGNOSTIC & GRADING
   └→ Ammeter check (battery health)
   └→ Screen grade, casing grade, keyboard check
   └→ Overall grade assigned (Fair / Good / Excellent)
   └→ All findings recorded on BM board

6. PAYOUT TO CUSTOMER
   └→ Team sets Trade-In Status = "Pay Out" on Monday
   └→ Agent verifies, Ricky confirms if >£200
   └→ Manual payout via BM API: PUT /ws/buyback/v1/orders/{id}/validate

7. REFURBISHMENT (if needed)
   └→ Screen repair, battery replacement, etc.
   └→ Parts consumed from Parts Board

8. LISTING
   └→ status24 = "To List" on Main Board → agent notified
   └→ Agent confirms spec, finds product UUID, checks pricing
   └→ Ricky approves price
   └→ Listing created via BM API: POST /ws/listings
   └→ Monday updated: UUID column = numeric listing_id
   └→ pub_state = 2 (LIVE) confirmed

9. SALE DETECTED
   └→ Flow 6 runs (hourly) — detects state=1 order
   └→ Matches order to BM board item via listing_id
   └→ Updates Monday boards (buyer name, order ID)
   └→ Ricky reviews and manually accepts order via BM API

10. SHIP TO BUYER
    └→ Team packages and ships
    └→ Tracking number entered in Monday
    └→ Agent confirms shipment to BM API with tracking + serial
    └→ Order state → 9 (complete)
    └→ Flow 7 updates BM board
```

---

## Back Market API

### Authentication
```
Authorization: {BACKMARKET_API_AUTH}   ← Basic auth, stored in /home/ricky/config/api-keys/.env
Accept-Language: en-gb                 ← Required for GBP prices
Base URL: https://www.backmarket.co.uk
```

### Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/orders?state=1` | GET | New orders (need accepting) |
| `/ws/orders?state=3` | GET | Accepted orders (need shipping) |
| `/ws/orders/{id}` | POST | Accept order (`new_state: 2`) or confirm shipment (`new_state: 3`) |
| `/ws/listings` | POST | Create new listing (JSON with CSV catalog) |
| `/ws/listings/{lid}` | POST | Update price / qty (not PATCH — returns 405) |
| `/ws/backbox/v1/competitors/{uuid}` | GET | BackBox competitor check |
| `/ws/buyback/v1/orders?status=SENT` | GET | Trade-in orders |
| `/ws/buyback/v1/orders/{id}/validate` | PUT | Payout / validate trade-in |
| `/ws/buyback/v2/orders/{id}/counter-offers` | PUT | Submit counter-offer (multipart/form-data) |

### BM Order States
| State | Meaning | Action needed |
|-------|---------|---------------|
| 1 | New — awaiting acceptance | Manual review + accept |
| 3 | Accepted — awaiting shipment | Get tracking, confirm shipment |
| 9 | Shipped / complete | None |

---

## Listing SKU Format

```
{Type}.{ModelNum}.{Chip}.{RAM}.{Storage}.{Color}.{Grade}
```

Examples:
- `MBA.A2337.M1.8GB.256GB.Grey.Fair`
- `MBP.A2338.M1.8GB.256GB.Grey.Excellent`
- `MBP.A2485.M1PRO.10C.16C.16GB.512GB.Grey.Fair`

**min_price rule (critical):** BM enforces `target_price ≤ min_price × 1.08`. Always set `min_price = floor(target / 1.08)` or BackBox will silently override the price.

---

## Key Operational Constraints

| Rule | Detail |
|------|--------|
| Counter-offer rate | Must stay below 18% |
| Tuesday cutoff | All orders shipped by Tuesday EOD for that week's payout |
| Price changes | Ricky must approve all price changes before applying |
| Cross-grade pricing | Excellent > Good > Fair always — never invert |
| Spec source of truth | BM board is definitive for device specs — not main board |
| SickW | For trade-in valuation only — never for listing spec lookup |
| ScrapingBee | Permanently removed. Use Massive/ClawPod for scraping. |

---

## Metrics to Track

| Metric | Current Status |
|--------|---------------|
| Weekly BM payout | Tracked via BM API + Monday. Target: £10k+/week. |
| Average margin per device | Tracked per sale on BM board |
| Counter-offer rate | Monitor — must stay <18% |
| Time from receive to list | Not yet tracked — target to implement |
| Time from list to sale | Not yet tracked — indicator of pricing accuracy |
| Defective return rate | Target <3% |
| Unlisted devices >7 days | QC cron flags daily |

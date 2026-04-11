# Back Market API — Consolidated Reference for v3 Agent

**Generated:** 2026-02-26
**Purpose:** Single reference doc for the v3 BackMarket agent. Consolidates existing API docs, migration notes, and script analysis.
**Source docs:** agents/backmarket/workspace/docs/bm-api-reference.md (primary), builds/backmarket/api/ (scripts + migration)

---

## TL;DR

- **44 endpoints** documented across 8 domains (Orders, Listings, BuyBack, Backbox, Backship, Care, TaskManager, Categories)
- **UK Base URL:** `https://www.backmarket.co.uk`
- **Auth:** Basic auth header + Accept-Language: en-gb + User-Agent
- **Credentials:** In `/home/ricky/config/api-keys/.env` as `BACKMARKET_API_AUTH`, `BACKMARKET_API_LANG`, `BACKMARKET_API_UA`
- **Rate limits vary:** Listings bulk = 2k SKUs/hr, BackBox = 2 req/sec (new) or 2/hr (old), Care = 500-750/day

---

## Authentication

```
Authorization: Basic <BACKMARKET_API_AUTH from env>
Accept: application/json
Accept-Language: en-gb
User-Agent: BM-iCorrect-n8n;ricky@icorrect.co.uk
Content-Type: application/json  (EXCEPT counter-offers → multipart/form-data)
```

Known issues:
- WAF/Cloudflare bot protection can return HTML instead of JSON — check `cf-ray` header
- Counter-offer endpoint MUST use `multipart/form-data`, not JSON

---

## Endpoint Map (44 total)

### Sales Orders (4 endpoints)

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/ws/orders` | GET | List orders by state/date/country | — |
| `/ws/orders/{order_id}` | GET | Get specific order | — |
| `/ws/orders/{order_id}` | POST | Accept (→state 2) or Ship (→state 3) | — |
| `/ws/orders/{order_id}/invoice` | POST | Upload invoice (multipart) | — |

**Order states:** 1=New, 2=Accepted, 3=Shipped, 4=Delivered, 6=Refunded, 9=Complete

### Orderlines (1 endpoint)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/orderlines/{orderline_id}` | PATCH | Update orderline |

**⚠️ orderline_id ≠ order_id** — BM dashboard shows both, easy to confuse.

### Listings (5 endpoints)

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/ws/listings` | GET | List all listings | — |
| `/ws/listings` | POST | Bulk create/update via CSV | 2k SKUs/hr |
| `/ws/listings/detail` | GET | Get listing by SKU | — |
| `/ws/listings/{listingId}` | GET | Get specific listing | — |
| `/ws/listings/{listingId}` | POST | Update price/qty | — |

**⚠️ SKU cannot be changed on existing listings** — must deactivate (qty=0) and recreate.

### BuyBack / Trade-Ins (10 endpoints) — iCorrect's PRIMARY revenue driver

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/ws/buyback/v1/orders` | GET | List trade-in orders | Filter by status: RECEIVED/VALIDATED/PAID/SUSPENDED |
| `/ws/buyback/v1/orders/pending-reply` | GET | Orders awaiting refurbisher response | — |
| `/ws/buyback/v1/orders/suspend-reasons` | GET | Valid suspend reason codes | — |
| `/ws/buyback/v1/orders/{id}` | GET | Get specific order | TESTED via bm-full-chain.py |
| `/ws/buyback/v1/orders/{id}/validate` | PUT | Approve payout | Empty JSON body |
| `/ws/buyback/v1/orders/{id}/suspend` | PUT | Suspend order | Requires reason codes |
| `/ws/buyback/v1/orders/{id}/counter-offers/reasons` | GET | Get counter-offer reason codes | TESTED — returns MacBook/iPhone specific codes |
| `/ws/buyback/v2/orders/{id}/counter-offers` | PUT | Submit counter-offer | **multipart/form-data ONLY**, requires photo evidence |
| `/ws/buyback/v1/orders/{id}/messages` | GET | Read message thread | — |
| `/ws/buyback/v1/orders/{id}/messages` | POST | Send message to customer | — |

**Trade-in grades:** GOLD (best) → SILVER → BRONZE → STALLONE (worst)
**Order ID format:** `GB-26074-VBDYL` (country-number-code)

### BuyBack Listings (3 endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/buyback/v1/listings` | GET | List trade-in product listings |
| `/ws/buyback/v1/listings/{id}` | GET | Get specific listing |
| `/ws/buyback/v1/listings/{id}` | PUT | Update trade-in price |

### Backbox / Pricing Intelligence (2 endpoints)

| Endpoint | Method | Rate Limit | Status |
|----------|--------|------------|--------|
| `/ws/backbox/v1/competitors/{listingId}` | GET | **2 req/sec** | NEW — use this |
| `/ws/listings_bi` | GET | 2 req/hr | **DEPRECATED March 2026** |

**Migration required:** Switch from `/ws/listings_bi` to `/ws/backbox/v1/competitors/{listingId}`. New endpoint is dramatically better (2/sec vs 2/hr). See `builds/backmarket/api/api-migration.md`.

### Backship / Shipping (4 endpoints — NOT USED by iCorrect)

iCorrect uses Royal Mail / own couriers. These endpoints are for BM's integrated shipping:
- `/ws/shipping/v1/deliveries` (GET)
- `/ws/shipping/v1/deliveries/{id}` (GET)
- `/ws/shipping/v1/returns` (GET)
- `/ws/shipping/v1/returns/{id}` (GET)

### Care / After-Sales (5 endpoints)

| Endpoint | Method | Rate Limit |
|----------|--------|------------|
| `/ws/sav` | GET | 520/min, 4k/day |
| `/ws/sav/{id}` | GET | 600/min, 40k/day |
| `/ws/sav/{id}/msg` | POST | 560/min, 40k/day |
| `/ws/sav/refund` | POST | 500/day |
| `/ws/sav/{id}/problem` | POST | 750/min, 1k/day |
| `/ws/sav/{id}/item-transfer` | POST | 292/min, 500/day |

**⚠️ Sales-side customer messaging NOT available via API** — BM seller dashboard only.

### Task Manager (1 endpoint)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/tasks/{taskId}` | GET | Check batch task status |

### Categories (2 endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws/category/tree` | GET | Full category tree |
| `/ws/category/tree/{categoryId}` | GET | Category branch |

### Recommendations (1 endpoint)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bm/recommendation/v2/recommendations` | GET | Product recommendations |

---

## Existing Scripts (builds/backmarket/api/)

| Script | Purpose | APIs Used | Status |
|--------|---------|-----------|--------|
| bm-full-chain.py | Maps trade-in → repair → sale lifecycle | Monday.com API + `/ws/buyback/v1/orders/{id}` | Working (Feb 26) |
| bm-profit-by-shipdate.py | Profit analysis by ship date | Monday.com API only | Working (Feb 26) |
| bm-profit-by-solddate.py | Profit analysis by sold date | Monday.com API only | Working (Feb 26) |
| bm-sku-audit.py | SKU consistency audit | Monday.com API only | Working (Feb 26) |

**⚠️ SECURITY ISSUE:** `bm-full-chain.py` has a **hardcoded Monday.com API key** on line 12. Should reference env file instead.

---

## What the v3 BM Agent Needs

### Read Operations (monitoring, reporting)
1. Check for new sales orders (state=1) — `/ws/orders?state=1`
2. Check for received trade-ins — `/ws/buyback/v1/orders?status=RECEIVED`
3. Check for pending-reply trade-ins — `/ws/buyback/v1/orders/pending-reply`
4. Monitor competitor pricing — `/ws/backbox/v1/competitors/{id}`
5. Check after-sales cases — `/ws/sav?state=0`
6. Read customer messages on trade-ins — `/ws/buyback/v1/orders/{id}/messages`

### Write Operations (actions)
1. Accept new orders → POST `/ws/orders/{id}` state=2
2. Confirm shipment → POST `/ws/orders/{id}` state=3
3. Update listing prices → POST `/ws/listings/{id}`
4. Validate trade-in payouts → PUT `/ws/buyback/v1/orders/{id}/validate`
5. Submit counter-offers → PUT `/ws/buyback/v2/orders/{id}/counter-offers`
6. Suspend trade-ins → PUT `/ws/buyback/v1/orders/{id}/suspend`
7. Send trade-in messages → POST `/ws/buyback/v1/orders/{id}/messages`
8. Reply to care cases → POST `/ws/sav/{id}/msg`

### Data Feed Crons (for v3 workspace)
These should be cron jobs that pull data into the agent's workspace:
1. **Every 15 min:** New orders (state=1), pending-reply trade-ins
2. **Every hour:** All active listings + BackBox data
3. **Daily:** Full order summary, trade-in pipeline, care cases

---

## Known Issues

1. **API migration deadline: March 2026** — `/ws/listings_bi` → `/ws/backbox/v1/competitors/{id}`
2. **WAF/Cloudflare** intermittently blocks API requests (returns HTML instead of JSON)
3. **Counter-offer requires multipart/form-data** — easy to get wrong with JSON Content-Type
4. **orderline_id vs order_id confusion** — BM UI shows both, easy to mix up
5. **No direct customer messaging on sales orders** — only via BM dashboard
6. **Hardcoded API key** in bm-full-chain.py (Monday.com key on line 12)

---

## Files Inventory

| File | Location | Purpose | Keep? |
|------|----------|---------|-------|
| bm-api-reference.md | agents/backmarket/workspace/docs/ | Full 44-endpoint reference | YES — source of truth |
| api-migration.md | builds/backmarket/api/ | Backbox endpoint migration | YES |
| bm-full-chain.py | builds/backmarket/api/ | Trade-in lifecycle analysis | YES (fix hardcoded key) |
| bm-full-chain-data.json | builds/backmarket/api/ | Output from full-chain script | TEMP — regenerate as needed |
| bm-profit-by-shipdate.py | builds/backmarket/api/ | Profit by ship date | YES |
| bm-profit-by-solddate.py | builds/backmarket/api/ | Profit by sold date | YES |
| bm-sku-audit.py | builds/backmarket/api/ | SKU consistency audit | YES |
| sales-audit-2026-02-26.md | builds/backmarket/audit/ | Sales audit results | YES |

---

*Consolidated by Claude Code — Phase 0, Session 2, Task R-B4*

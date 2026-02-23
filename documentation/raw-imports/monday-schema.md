# Monday.com Schema & Board Architecture

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** NEEDS VERIFICATION — Jarvis should pull live schemas via API to confirm column IDs, status values, and board relationships
> **Last updated:** 23 Feb 2026

---

## Overview

iCorrect operates on Monday.com as its central repair tracking and operations platform. The system spans 8+ core boards covering repair jobs, parts inventory, Back Market trade-ins, products & pricing, and team task management.

---

## Board Registry

| Board Name | Board ID | Purpose | Primary Users |
|-----------|----------|---------|---------------|
| iCorrect Main Board | 349212843 | All repair jobs (walk-in, mail-in, BM trade-ins) | Everyone |
| Parts Board | 985177480 | Inventory tracking for all parts (LCDs, batteries, keyboards, etc.) | Technicians, Ricky |
| BM Board | *(NEEDS VERIFICATION)* | Back Market trade-in tracking (sales pipeline) | Ferrari, Operations |
| Products & Pricing Board | 2477699024 | Repair products, pricing, Shopify product IDs | Ferrari, Ricky |
| Devices Board | *(NEEDS VERIFICATION — linked via board_relation5)* | Device catalogue | — |
| Ferrari Task Board | *(NEEDS VERIFICATION)* | Ferrari's daily/recurring tasks | Ferrari |
| *(Other boards TBC)* | — | There are 47+ boards total in the system — many may be legacy/unused | — |

---

## Board 1: iCorrect Main Board (349212843)

### Purpose
The central hub for all repair jobs. Every customer repair — whether walk-in, mail-in, or Back Market trade-in — lives here as an item. Status changes on this board trigger automations (Cloudflare Workers → n8n workflows) for parts deduction, customer notifications, and more.

### Groups
| Group | Group ID | Purpose |
|-------|----------|---------|
| New Orders | `new_group77101__1` | Shopify orders land here |
| Today's Repairs | *(NEEDS VERIFICATION)* | Active repairs being worked on today |
| *(Other groups TBC)* | — | Board likely has groups for completed, awaiting parts, etc. |

### Views
| View Name | Purpose |
|-----------|---------|
| BM Trade-In View | Side-panel view within an item for Back Market trade-in specific fields |
| Walk-In View | *(NEEDS VERIFICATION)* | Walk-in specific fields |
| *(Other views TBC)* | — |

### Column Schema

#### Core Identification
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 1 | Item Name | `name` | name | Customer name (or "Customer - #OrderNumber" for Shopify) | |
| 2 | Status | `status4` | status | Primary repair status | **AUTOMATION TRIGGER** — Cloudflare Worker routes changes |
| 3 | Service | `service` | status | How device arrives: Walk-In, Mail-In, Gophr Courier, Stuart, etc. | |
| 4 | Client | `status` | status | Client type: End User, Corporate, BM, Refurb, Warranty, etc. | Column ID is literally `status` — confusing |
| 5 | Priority | `priority` | status | Low / Medium / High / Critical | |
| 6 | Priority (text) | `text__1` | text | ⚠️ Possible duplicate of above — NEEDS AUDIT | |

#### Device Information
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 7 | Device | `board_relation5` | board_relation | Links to Devices board | Fetch linked item name for device model |
| 8 | IMEI/SN | `text4` | text | Serial number / IMEI | Triggers SickW serial number check automation |
| 9 | Colour | `status8` | status | Device colour (38 options) | Cleaned up: fixed "Titianium" typos, capitalised "Sky Blue", renamed duplicate "Green" to "Mint Green" |
| 10 | Device Colour | `color_mkzmx3w` | status | ⚠️ Possible duplicate of Colour — NEEDS AUDIT | |

#### Dates & Timestamps
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 11 | Received | `date4` | date | When job came in | |
| 12 | Deadline | `date36` | date | Target completion date | |
| 13 | Booking Time | `date6` | date | Walk-in appointment date/time | Populated from Shopify/Typeform |
| 14 | Created | `creation_log4` | creation_log | Auto timestamp | |
| 15 | Updated | `last_updated__1` | last_updated | Auto timestamp | |

#### Customer Contact
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 16 | Email | `text5` | text | Customer email | |
| 17 | Phone | `text00` | text | Customer phone | |
| 18 | Company | `text15` | text | Company name (if corporate) | |
| 19 | Street | `passcode` | text | Delivery/billing address | Column ID is "passcode" — legacy naming |
| 20 | Post Code | `text93` | text | Customer postcode | |

#### Status & Tracking
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 21 | Payment Status | `payment_status` | status | Confirmed, Pending, etc. | |
| 22 | Payment Method | `payment_method` | status | Shopify, Cash, Bank Transfer, etc. | |
| 23 | Notifications | `status_18` | status | ON / OFF / Unconfirmed | |
| 24 | Repair Type | `status24` | status | Diagnostic (index 2), other repairs (index 15), Trade-In, iCloud ON, Payout | |
| 25 | Parts Deducted | `color_mkzkats9` | status | Do Now! / Processing / Complete / Error | Triggers parts deduction automation |

#### Integration Links
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 26 | Ticket / Intercom Link | `link1` | link | Intercom conversation URL (display text: "Fin") | Previously used for Zendesk ticket URL |
| 27 | Gophr Tracking | `text_mkzmxq1d` | text | Gophr courier tracking link | |
| 28 | Outbound Tracking | `text53` | text | Royal Mail tracking number | |

#### Other
| # | Column Title | Column ID | Type | Purpose | Notes |
|---|-------------|-----------|------|---------|-------|
| 29 | Item ID | `item_id` | item_id | Monday internal item ID | |
| 30 | Subitems | `subitems6` | subtasks | ⚠️ Purpose unclear — NEEDS AUDIT | |

### Key Status Values (status4)
These are the values that drive automations:

| Status Value | What Happens |
|-------------|--------------|
| New Repair | Default for new items |
| Received | Triggers customer notification (walk-in vs remote variants) |
| Booking Confirmed | Triggers confirmation notification (warranty vs standard) |
| Courier Booked | Triggers courier notification (Gophr vs Mail-In, warranty vs standard) |
| Ready To Collect | Triggers parts deduction + customer notification |
| *(Others TBC)* | Full list needs extraction from board |

### Automations Triggered from Main Board
| Trigger | System | What It Does |
|---------|--------|-------------|
| status4 changes | Cloudflare Worker → n8n | Routes to notification webhooks based on status + service type + client type |
| status4 → "Ready To Collect" | Cloudflare Worker → n8n | Parts deduction workflow |
| color_mkzkats9 → "Do Now!" | Cloudflare Worker → n8n | Manual parts deduction trigger |
| Serial number entered (text4) | SickW | iCloud lock check |
| New item created | n8n (planned) | Create Intercom contact + conversation |

---

## Board 2: Parts Board (985177480)

### Purpose
Inventory tracking for all repair parts. Each item represents a part type (e.g., "LCD - A2337") with a quantity in stock. The parts deduction automation decrements quantities when repairs are completed.

### Key Column Schema
*(NEEDS FULL EXTRACTION — below is from partial conversation data)*

| Column | Purpose | Notes |
|--------|---------|-------|
| Name | Part name (e.g., "LCD - A2337") | |
| Quantity / Stock | Current stock level | Decremented by parts deduction automation |
| Unit Cost | Cost per unit | |
| Supplier | Where part comes from | |
| SKU | Internal reference | |

### LCD Inventory Structure
The LCD naming convention groups compatible models together:

| Parts Board Item Name | Models Covered | Screen Type |
|----------------------|----------------|-------------|
| LCD - A1932 | MacBook Air 13" 2018-19 (Intel) | Intel Air |
| LCD - A2179 | MacBook Air 13" 2020 (Intel) | Intel Air |
| LCD - A2337 | MacBook Air 13" M1 | **Highest volume** |
| LCD - A2681 \| A3113 \| A3240 | MacBook Air 13" M2/M3/M4 | M-series Air |
| LCD - A2941 \| A3114 | MacBook Air 15" M2/M3 | Air 15" |
| LCD - A1706 \| A1708 | MacBook Pro 13" 2016-17 (Intel) | Intel Pro |
| LCD - A1989 \| A2159 | MacBook Pro 13" 2018-20 (Intel) | Intel Pro |
| LCD - A2251 \| A2289 | MacBook Pro 13" 2020 (Intel) | Intel Pro |
| LCD - A2338 (LG) | MacBook Pro 13" M1 | LG panel variant |
| LCD - A2338 (Sharp) | MacBook Pro 13" M1 | Sharp panel variant |
| LCD - A2442 \| A2779 (LG) | MacBook Pro 14" M1/M2 | LG panel variant |
| LCD - A2442 \| A2779 (Sharp) | MacBook Pro 14" M1/M2 | Sharp panel variant |
| LCD - A2992 \| A2918 (BOE) | MacBook Pro 14" M3 | BOE panel |
| LCD - A2485 \| A2780 \| A2991 (Sharp) | MacBook Pro 16" M1/M2/M3 | Sharp panel variant |
| LCD - A2485 \| A2780 \| A2991 (LG) | MacBook Pro 16" M1/M2/M3 | LG panel variant |
| LCD - A1707 | MacBook Pro 15" 2016-17 (Intel) | Legacy |
| LCD - A1990 | MacBook Pro 15" 2018-19 (Intel) | Legacy |
| LCD - A2141 | MacBook Pro 16" 2019 (Intel) | Legacy |

**Missing M4 models to add:** A3283 (Pro 14" M4), A3286 (Pro 16" M4)

### Tcon Swap Compatibility
Some screens can be used across models by swapping the T-con board:

| Donor Screen | Can Be Used For | Notes |
|-------------|----------------|-------|
| A1932 / A2179 LCD | A2337 repairs | T-con swap required |
| A2251 / A2289 LCD | A2338 repairs | T-con swap required |

---

## Board 3: Products & Pricing Board (2477699024)

### Purpose
Maps repair products to pricing. Used for linking Shopify products to Monday items and for the Requested Repairs board relation.

### Key Columns
| Column | Column ID | Purpose | Notes |
|--------|-----------|---------|-------|
| Name | `name` | Product name (e.g., "MacBook Pro 16 M1 Pro Max A2485 Screen") | |
| Shopify ID | `text_mkzdte13` | Shopify product ID for automation linking | ⚠️ Currently EMPTY — needs populating |
| Item ID | `item_id` | Monday internal ID | |

### Known Issue
Shopify IDs are not populated, preventing automatic product linking in the Shopify → Monday order automation. Ferrari currently links products manually.

---

## Board 4: BM Board (ID NEEDS VERIFICATION)

### Purpose
Tracks Back Market trade-in devices through the sales pipeline: from purchase through refurbishment, listing, sale, and shipping.

### Key Columns (from n8n workflow data)
| Column | Purpose |
|--------|---------|
| BM Number | e.g., "BM 1225" |
| Customer Name | Trade-in seller |
| Device Model | e.g., MacBook Pro 13 M1 A2338 |
| Colour | Device colour |
| Grade | Fair / Good / Excellent |
| Purchase Price | What we paid for the trade-in |
| Sale Price | What we listed/sold for on Back Market |
| BM Fee | Back Market commission |
| Profit | Calculated margin |
| SKU | Back Market listing SKU |
| Status | Pipeline stage |

---

## Cross-Board Relationships

```
iCorrect Main Board (349212843)
    │
    ├── board_relation5 ──→ Devices Board (device lookup)
    │
    ├── board_relation ──→ Products & Pricing (2477699024) (requested repairs)
    │
    └── BM items also tracked on ──→ BM Board (parallel tracking)

Parts Board (985177480)
    │
    └── Referenced by parts deduction automation (column values matched by name)
```

---

## Automation Architecture

### Current (Live)
| System | What | Status |
|--------|------|--------|
| Cloudflare Worker: `icorrect-status` | Routes status4 changes to n8n webhooks | ✅ Deployed |
| Cloudflare Worker: `icorrect-parts-deducted` | Routes "Do Now!" to parts deduction | ✅ Deployed |
| n8n: Flow 0 | Sent Trade-in Orders → Monday Boards | ✅ Active |
| n8n: Flow 5 | BM Device Listing (Sales) | ✅ Active |
| n8n: Flow 6 | Sales Alert v2 | ✅ Active |
| n8n: Flow 7 | Ship Confirmation | ✅ Active |
| n8n: Parts Deduction | Deducts parts from Parts Board on status change | ✅ Active |
| Monday Native | status4 change → webhook to Cloudflare | ✅ Active |
| SickW | Serial number → iCloud check | ✅ Active |

### Planned (Spec Docs Exist)
| System | What | Status |
|--------|------|--------|
| n8n: Shopify → Monday → Intercom | New order automation | 📋 Full spec doc created |
| n8n: 9 Notification Webhooks | Status change → Intercom messages | 📋 Full spec doc created |
| Extended Cloudflare Worker | Routing logic for all 9 notification statuses | 📋 Spec exists |

---

## Credentials & Access

| System | Credential Name (in n8n) | Notes |
|--------|-------------------------|-------|
| Monday.com | "Monday.com account - Ricky" | Primary — needs system account created |
| Monday.com | "Monday.com account 3" | ⚠️ Legacy/duplicate — avoid |
| Intercom | "Intercom Auth" | |
| Shopify | "Shopify account" | Shop: i-correct-final |
| Slack | Multiple (2, 3, 4, 5 + OAuth2) | ⚠️ Ferrari mess — needs cleanup |

---

## Known Issues & Debt

1. **Column ID `status` vs `status4`**: The "Client" column has ID `status` and the "Status" column has ID `status4`. Confusing — document clearly everywhere.
2. **Duplicate columns**: Colour (`status8`) vs Device Colour (`color_mkzmx3w`), Priority (`priority`) vs Priority text (`text__1`). Need audit to determine which are active.
3. **47 boards total**: Most are likely unused/legacy. Need full board inventory and cleanup.
4. **Shopify Product IDs empty**: Products & Pricing board has the column but no data populated.
5. **Multiple credentials**: n8n has duplicate/legacy credentials that should be cleaned up.
6. **Screen refurbishment tracking**: No board exists yet for tracking LCD refurb workflow (QR code system planned).
7. **link1 column dual use**: Was Zendesk, now Intercom. Old items may still have Zendesk URLs.

---

## Verification Checklist for Jarvis

- [ ] Pull live schema for board 349212843 — confirm all column IDs and types
- [ ] Pull live schema for board 985177480 — get full Parts Board column list
- [ ] Identify BM Board ID — search by name or check board relations
- [ ] Identify Devices Board ID — check board_relation5 settings
- [ ] Identify Ferrari Task Board ID
- [ ] List all boards in workspace — flag active vs unused
- [ ] Verify all status values for status4 column
- [ ] Verify all status values for service column
- [ ] Verify all status values for status (client type) column
- [ ] Check which automations are actually active on the board
- [ ] Verify group IDs (especially new_group77101__1)

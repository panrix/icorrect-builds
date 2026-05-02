# Back Market Trade-In Operations

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Most documented area — SOPs, n8n workflows, grading criteria, and board schema all covered
> **Last updated:** 23 Feb 2026

---

## Overview

Back Market trade-ins are iCorrect's primary revenue stream. Customers sell their MacBooks to iCorrect via the Back Market platform. iCorrect receives the device, diagnoses it, refurbishes it if needed, and resells it on Back Market at a higher grade/price.

The full pipeline: **Customer ships device → iCorrect receives & diagnoses → Payout to customer → Refurbish if needed → List on Back Market → Sell → Ship to buyer**

---

## Revenue Model

| Metric | Typical Value |
|--------|--------------|
| Purchase price (paid to customer) | £85 - £200+ (depends on model/condition) |
| Sale price on Back Market | £400 - £1,200+ |
| Back Market fee | ~11% of sale price |
| Profit margin | 50-72% on individual devices |
| Weekly Back Market payout | ~£8,000 - £11,000 |

---

## n8n Automation Flows

### Flow 0: Sent Trade-In Orders → Monday Boards
| Field | Value |
|-------|-------|
| Workflow ID | *(NEEDS VERIFICATION from n8n)* |
| Trigger | Schedule |
| What it does | Fetches SENT orders from Back Market API, extracts PDF assessment data, parses device details, creates items on both Main Board and BM Board |
| Outputs to | Main Board (349212843) + BM Board |
| Notifications | Slack |
| Status | ✅ Active |

### Flow 5: BM Device Listing (Sales)
| Field | Value |
|-------|-------|
| Workflow ID | 69BCMOtdUyFWDDEV |
| Trigger | Schedule |
| What it does | Queries Monday boards for devices ready to list, checks Google Sheets for existing listing matches, calculates pricing, creates/updates BM listings |
| Data flow | Monday → Google Sheets (SKU matching) → Back Market API (create/update listing) → Monday (update status) → Slack |
| Status | ✅ Active |

**Example execution:**
- BM 1225 (Isabelle Saxton) — MacBook Pro 13 M1 A2338
- Space Grey / Fair grade / 8GB RAM / 512GB storage
- Purchase price: £85, Listed at: £500, BM fee: £55
- **Profit: £360 (72% margin)**

### Flow 6: Sales Alert v2
| Field | Value |
|-------|-------|
| Workflow ID | HsDqOaIDwT5DEjCn |
| Trigger | Schedule |
| What it does | Monitors Back Market for new orders (state 1 = paid, awaiting confirmation), matches to Monday items, updates both boards, auto-accepts orders |
| Data flow | Back Market API (state 1 orders) → Match to BM Board item → Update BM Board + Main Board → Accept order on BM API → Slack notification |
| Status | ✅ Active |

**When orders can't auto-match:**
- If no matching inventory found in Monday, the order is flagged in Slack for manual action
- Common reasons: inventory item not created yet, listing doesn't have matching stock

### Flow 7: Ship Confirmation
| Field | Value |
|-------|-------|
| Workflow ID | *(NEEDS VERIFICATION from n8n)* |
| Trigger | Schedule |
| What it does | Handles shipped items by confirming shipment to Back Market API, moves items on BM Board, sends Slack notifications |
| Status | ✅ Active |

---

## BM Board Schema

### Purpose
Tracks each Back Market trade-in device through the complete sales pipeline.

### Board ID
⚠️ **NEEDS VERIFICATION** — not captured in conversations as a standalone ID. May be identifiable via board relations or n8n workflow configs.

### Key Columns (from workflow data)

| Column | Type | Purpose |
|--------|------|---------|
| BM Number | text | Unique identifier (e.g., "BM 1225") |
| Customer Name | text | Person who sold the device to iCorrect |
| Device Model | text | e.g., "MacBook Pro 13 M1 A2338" |
| Colour | status | Space Grey, Silver, Starlight, Midnight, etc. |
| Grade | status | Fair / Good / Excellent (Back Market grading) |
| RAM | text/status | 8GB / 16GB / 32GB / 64GB |
| Storage | text/status | 256GB / 512GB / 1TB / 2TB |
| Purchase Price | number | What iCorrect paid the customer |
| Sale Price | number | What device sold for on Back Market |
| BM Fee | number | Back Market commission |
| Profit | formula/number | Sale price minus purchase price minus BM fee |
| SKU | text | Back Market listing SKU |
| Status | status | Pipeline stage (Expecting, Received, Diagnostic, Listed, Sold, Shipped, etc.) |
| Order Number | text | Back Market order number |
| Buyer Name | text | Person who bought from Back Market |
| Buyer Location | text | Shipping destination |
| Payment Method | text | How buyer paid (Klarna, card, etc.) |
| Tracking | text | Outbound shipping tracking |

---

## Grading Criteria

### LCD Pre-Grade
| Grade | Criteria |
|-------|---------|
| Excellent | No visible marks, scratches, or imperfections on the LCD |
| Good | Minor marks that don't affect display quality |
| Fair | Noticeable marks, light scratches, minor backlight issues |

### Lid Pre-Grade
| Grade | Criteria |
|-------|---------|
| Excellent | No dents, scratches, or cosmetic damage on the lid |
| Good | Minor cosmetic wear, light scratches |
| Fair | Noticeable dents, scratches, or wear |

### Top Case (Keyboard Case)
| Grade | Criteria |
|-------|---------|
| Excellent | No wear, all keys functioning, trackpad perfect |
| Good | Minor wear marks, fully functional |
| Fair | Visible wear, minor cosmetic issues |
| Dead | Non-functional keyboard or trackpad |

### Back Market Grade Mapping
| BM Grade | What It Means | Typical Sale Price Range |
|----------|---------------|------------------------|
| Fair | Functional with visible cosmetic wear | Lower tier |
| Good | Minor cosmetic imperfections | Mid tier |
| Excellent | Near-new condition | Premium tier |

---

## Defective Device Process

### When a sold device is returned as defective

1. Back Market notifies of defective return
2. Device arrives back at iCorrect
3. Technician diagnoses the reported fault
4. Decision matrix:
   - **Can repair & resell:** Fix the issue, relist on Back Market
   - **Cannot repair economically:** Back Market may authorise recycle
   - **Screen salvageable:** Even if device is recycled, test and salvage the screen if possible

### Key Learning (from BM 1108 incident)
- Back Market gave green light to recycle a device, but it was already shipped back
- **Recommendation:** Implement a screen test for non-responsive trade-ins BEFORE shipping back — screens should be salvaged where possible

---

## Operational Flow (End-to-End)

```
1. CUSTOMER LISTS ON BACK MARKET
   └→ Customer lists their MacBook for trade-in on Back Market

2. BACK MARKET SENDS ORDER TO ICORRECT
   └→ n8n Flow 0 picks up the order
   └→ Creates item on Main Board + BM Board
   └→ Slack notification

3. CUSTOMER SHIPS DEVICE
   └→ Royal Mail tracking updates on Monday board
   └→ When tracking shows delivered → moves to "Today's Repairs"

4. ICORRECT RECEIVES & DIAGNOSES
   └→ SOP 2 (Back Market Trade-In Receive & Diagnostic Process)
   └→ Print labels → Match → Verify → Ammeter → iCloud check
   └→ Grade → Diagnose → Record findings

5. PAYOUT TO CUSTOMER
   └→ Repair type changed to "Payout"
   └→ Ferrari processes payment to customer via Back Market

6. REFURBISHMENT (if needed)
   └→ Screen repair, battery replacement, etc.
   └→ Parts consumed from Parts Board

7. LISTING
   └→ n8n Flow 5 (BM Device Listing)
   └→ Checks Google Sheets for SKU match
   └→ Creates/updates listing on Back Market
   └→ Updates Monday boards + Slack

8. SALE
   └→ n8n Flow 6 (Sales Alert)
   └→ Detects new order on Back Market
   └→ Auto-accepts order
   └→ Updates Monday boards + Slack
   └→ Device status: "Awaiting Shipment"

9. SHIP TO BUYER
   └→ Team packages device (SOP 3)
   └→ n8n Flow 7 (Ship Confirmation)
   └→ Confirms shipment to Back Market API
   └→ Updates BM Board status
```

---

## Google Sheets Integration

### SKU Matching Sheet
Flow 5 (BM Device Listing) references a Google Sheet for SKU matching. This sheet contains:
- Device specifications (model, RAM, storage, colour, grade)
- Corresponding Back Market listing IDs/SKUs
- Pricing data

**Purpose:** When a device is ready to list, the flow looks up the matching SKU in the sheet to determine if a listing already exists (update quantity from 0→1) or needs creating.

---

## Back Market API Integration

### Key Endpoints Used
| Endpoint | Used By | Purpose |
|----------|---------|---------|
| Get orders (state: SENT) | Flow 0 | Fetch new trade-in orders |
| Get orders (state: 1/PAID) | Flow 6 | Detect new sales |
| Accept order | Flow 6 | Auto-accept paid orders |
| Update listing quantity | Flow 5 | Set listing from 0→1 when device ready |
| Confirm shipment | Flow 7 | Mark order as shipped |

### Authentication
Back Market API credentials are stored in n8n. *(Specific credential name NEEDS VERIFICATION)*

---

## Key Metrics to Track

| Metric | Current Method | Ideal |
|--------|---------------|-------|
| Weekly payout (BM income) | Back Market dashboard | Automated weekly report |
| Average margin per device | Manual calculation | Dashboard with model-level breakdown |
| Time from receive to list | Not tracked | Should be tracked — impacts cash cycle |
| Time from list to sale | Not tracked | Indicator of pricing accuracy |
| Defective return rate | Not tracked | Quality indicator |
| Stock in pipeline (unlisted devices) | BM Board count | Automated alert if > X days unlisted |

---

## Verification Checklist for Jarvis

- [ ] Get the BM Board ID from n8n workflow configs or Monday API
- [ ] Pull full BM Board column schema
- [ ] Verify all 4 n8n workflow IDs (Flows 0, 5, 6, 7)
- [ ] Confirm Google Sheets SKU matching sheet exists and is current
- [ ] Check Back Market API credential name in n8n
- [ ] Verify which BM Board status values exist
- [ ] Count current pipeline (how many devices at each stage)
- [ ] Check if any additional automations have been added since Jan 2026
- [ ] Verify the defective device process against current BM Board columns

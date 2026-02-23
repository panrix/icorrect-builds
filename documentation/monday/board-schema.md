# Monday.com Main Board — Full Schema & Audit

**Board:** iCorrect Main Board
**Board ID:** 349212843
**Total Items:** 4,122 (estimated ~100-150 active, rest is dead weight)
**Total Columns:** 170
**Total Groups:** 33
**Pulled from live API:** 23 Feb 2026

---

## Repair Flows

### Walk-In Flow
Customer walks in → Typeform/n8n automation creates item in **New Orders** → auto-moves to **Today's Repairs** (if booking date filled) → Ferrari/automation assigns to tech queue → **[Tech Group]** (Saf/Andres/Mykhailo) → **Quality Control** (Roni) → **Awaiting Collection** → **Returned**

### Mail-In Flow
**New Orders** → **Incoming Future** (device not yet arrived) → device arrives → **Today's Repairs** → **[Tech Group]** → **Quality Control** → **Outbound Shipping** → **Returned**

### Back Market Trade-In Flow
**Incoming Future** → **Today's Repairs** → **[Tech Group]** → if iCloud locked → **Trade-In BMs Awaiting Validation** → once cleared → continues → **Quality Control** → **BMs Awaiting Sale** → sold

### Corporate Flow
Same as walk-in/mail-in but Client column = "Corporate". May have different notification settings.

### What Moves Items Between Groups
Monday native automations (not manual). Booking date triggers move to Today's Repairs. Status changes trigger other moves. **These automations need to be extracted and documented — currently no record of what they do.**

---

## Groups

### Active — Tech Queues
- **Safan (Short Deadline)** — Saf's urgent repairs
- **Andres** — Andres's assigned repairs
- **Mykhailo** — Mykhailo's assigned repairs
- **Roni** — QC queue (also listed as Quality Control)
- **Ferrari** — Ferrari's tasks. **Issue: tasks get missed, no accountability system**

### Active — Flow Groups
- **New Orders** — Shopify orders and new bookings land here
- **Today's Repairs** — Active work for today (auto-populated from booking dates)
- **Incoming Future** — Booked/confirmed but device not yet arrived
- **Quality Control** — Roni's QC review queue
- **Awaiting Parts** — Repairs paused waiting for parts
- **Awaiting Collection** — Repaired, waiting for customer pickup
- **Outbound Shipping** — Ready to ship (mail-in returns)
- **Awaiting Confirmation of Price** — Quote sent, waiting for customer approval
- **Returned** — Completed and returned to customer

### Active — Client Services
- **Client Services - To Do** — Ferrari's customer follow-ups
- **Client Services - Awaiting Confirmation** — Waiting on customer response
- **Issue:** These don't get audited or actioned. Need agent automation.

### Active — Back Market
- **BMs Awaiting Sale** — Refurbed BM devices ready to list
- **Trade-In BMs Awaiting Validation** — BM trade-ins being checked (bad group name)
- **BMs No repair / iCloud** — Devices that can't be repaired or have iCloud lock. **Issue: these sit here forever. Should be actively moved out.**

### Active — Other
- **Leads to Chase** — People who booked and didn't turn up. **Issue: no automated follow-up flow.**
- **Cancelled/Missed Bookings** — No-shows
- **Locked** — iCloud locked devices. **Should merge with BMs No repair / iCloud.**
- **Devices In Hole** — Physical storage area for dead/uncollected devices

### Dead/Unused Groups (Candidates for Removal)
- **Adil** — Doesn't use his group (0-1 items)
- **Safan (Long Deadline)** — Dumping ground, not properly managed
- **New Orders (Not Confirmed)** — Not used (0-1 items)
- **Ricky** — Shouldn't exist, dumping ground
- **Purchased/Refurb Devices** — Not used anymore
- **Completed Refurbs** — Dead (0-1 items)
- **Selling** — Dead (0-1 items)
- **Zara iPods** — Not used in years (0-1 items)
- **Recycle List** — Should merge with Devices In Hole
- **Devices Left in Long Term** — Should merge with Devices In Hole

### Recommended Merges
- **Devices In Hole + Devices Long Term + Recycle List** → one "Dead/Uncollected" group
- **BMs No Repair + Locked** → one "BM Dead / iCloud" group
- **Leads to Chase + Cancelled/Missed Bookings** → one group with automated follow-up

---

## Status Column (status4) — 39 Values

This column is overloaded. It tracks repair flow, BM lifecycle, QC, customer comms, and edge cases all in one.

### Repair Flow Statuses (core)
- New Repair
- Received
- Booking Confirmed
- Diagnostics (transient — daytime only)
- Diagnostic Complete (transient)
- Queued For Repair
- Under Repair (transient)
- Repaired (transient)
- Reassemble
- Ready To Collect
- Returned

### Customer Communication Statuses
- Awaiting Confirmation
- Client To Contact
- Client Contacted (124 items — most common resting state)
- Password Req
- Quote Sent
- Ready to Quote
- Invoiced

### Courier/Shipping Statuses
- Expecting Device
- Courier Booked
- Book Courier
- Book Return Courier
- Return Booked
- To Ship
- Shipped

### BM/Trade-In Statuses (SHOULD BE IN TRADE-IN STATUS COLUMN)
- Purchased
- Under Refurb
- Cancelled/Declined

### QC Statuses (NEEDS OWN COLUMN)
- QC Failure
- Cleaning (transient)
- Battery Testing (transient)

### Edge Cases
- Repair Paused (38 items — significant)
- Awaiting Part
- BER/Parts (46 items — "Beyond Economic Repair")
- Clamped
- Part Repaired
- Software Install
- Missing Parts
- Error

### Usage (from 500-item sample at 3:41am UK)
**Heavy (>20):** Client Contacted (124), Ready To Collect (77), BER/Parts (46), Repair Paused (38), Expecting Device (27), Quote Sent (26), Queued For Repair (24), Awaiting Confirmation (23), Shipped (22)
**Moderate (5-20):** Returned (16), Awaiting Part (13), Received (12), Book Return Courier (11), Booking Confirmed (7), Purchased (5), Client To Contact (5)
**Light (<5):** Courier Booked (4), New Repair (3), Error (3), Invoiced (3), To Ship (2), Software Install (2)
**Zero (daytime transient):** Diagnostics, Under Repair, Repaired, QC Failure, Clamped, Cleaning, Under Refurb, Missing Parts, Ready to Quote, Diagnostic Complete, Return Booked, Battery Testing

**Note:** Zero-usage statuses were sampled at 3:41am UK time. These are working statuses that items pass through during the day. A daytime query is needed to confirm.

---

## Repair Type Column (status24) — 25 Values

This column is also overloaded — mixing actual repair types with BM lifecycle stages and outcomes.

### Actual Repair Types
- Diagnostic (144) — most common
- Repair (139)
- Board Level
- Manual (1)
- Parts (12)

### BM/Trade-In Lifecycle (SHOULD BE SEPARATE)
- Trade-In
- Purchased (64)
- Pay-Out (23)
- Listed (20)
- Sold (7)
- To List
- Unlisted (2)
- BM RTN/RFD (6)
- Counteroffer (5)

### Outcomes
- BER (13)
- Unrepairable (8)
- No Fault Found
- Quote Rejected (9)
- IC ON (9)
- IC OFF (6)

### Other
- Unconfirmed (26)
- Task (5)
- Booking Cancelled (1)
- Warranty [DEACTIVATED]

---

## Trade-In Status Column (color_mkypbg6z) — 12 Values

Created to separate trade-in statuses out of Status and Repair Type. **Migration stalled.**

### Values
Trade-in, Purchased, To-List, Listed, Sold, Pay-Out, Counter, Manual Review, Error, N/a, (empty), "to" (orphan)

### Current Usage (500-item sample)
- 378 items: (empty) — 75.6% not using it
- 122 items: Trade-in
- 0 items using any other value

**This column is essentially not adopted.** Only "Trade-in" is being set, likely by an automation. The rest of the lifecycle (Listed, Sold, Pay-Out) is still tracked in Repair Type.

---

## QC Columns

| Column | ID | Type | Purpose |
|--------|----|------|---------|
| * Final Grade * | status_2_Mjj4GJNQ | status | Final device grade |
| LCD - Pre-Grade | color_mkp5ykhf | status | LCD condition pre-repair |
| Lid - Pre-Grade | status_2_mkmc4tew | status | Lid condition pre-repair |
| Top Case - Pre-Grade | status_2_mkmcj0tz | status | Top case condition |
| Screen Condition | screen_condition | dropdown | Screen condition assessment |
| QC By | multiple_person_mkyp2bka | people | Who performed QC |
| QC Time | date_mkypt8db | date | When QC happened |

**Missing: QC Status column.** No pass/fail/in-review status. QC outcome is tracked through main Status column ("QC Failure" exists but no "QC Pass"). Items that pass QC just move to the next status.

---

## Column Inventory by Category (170 total)

### Core Identification (6)
- Name, Item ID, Ticket (link), Subitems, Notifications, Service

### Device Info (8)
- Device (board relation), IMEI/SN, Colour, Device Colour (duplicate?), Ammeter Reading, Keyboard, iCloud, Passcode Verified

### Dates & Timestamps (14)
- Received, Deadline, Booking Time, Created, Updated, Date Repaired, Collection Date, Diag. Complete, Quote Sent, Repaired, Intake Timestamp, QC Time, ETA, Start, Scheduled Collection Time, SLA Update

### Customer Contact (5)
- Email, Phone Number, Company, Street Name/Number, Post Code

### Status & Tracking (15)
- Status, Repair Type, Trade-in Status, Payment Status, Payment Method, Notifications, Parts Status, Parts Deducted, Stock Status, Courier Collection, Courier Return, Cleaning Status, Invoice Status, Invoice Action, Payments Reconciled, Info Capture, Feedback, Column Sync, Source

### Grading & QC (7)
- Final Grade, LCD Pre-Grade, Lid Pre-Grade, Top Case Pre-Grade, Screen Condition, QC By, QC Time

### BM Reported vs Actual (8)
- Battery (Reported), Battery (Actual), Screen (Reported), Screen (Actual), Casing (Reported), Casing (Actual), Function (Reported), Function (Actual), Liquid Damage?

### Financial (8)
- Quote (formula), Discount, Paid, Invoice Amount, Xero Invoice ID, Xero Invoice URL, Payment 1 Ref/Amt/Date, Payment 2 Ref/Amt/Date

### Time Tracking (5)
- Total Time, Total RR&D Time (formula), Diagnostic Time, Cleaning Time, Repair Time, Refurb Time, BM Diag Time, Initial Hours

### People (6)
- Technician, Diagnostic (person), Refurb (person), Repair (person), BM Diag Tech, QC By

### Parts (6)
- Parts Used (board relation), Parts Cost (mirror), Parts Status, Part to Order, Parts Required (board relation), Part Stock Level (mirror), Stock Checkout ID

### Linked Board Data (mirrors) (12)
- Intake Condition, Fault to Repair (Details), Further Faults, Client Notes, Previous Repairs, Notes for Repairer, Collection Notes, Data, Been to Apple?, New or Refurb?, Battery, Requested Repairs Price, Custom Repairs Price, Stock Level

### Notes & Text (7)
- Walk-in Notes, Final Quote (long text), Intake Notes (long text), High Level Notes Thread ID, Tech Notes Thread, Error Thread ID, Point of Collection

### BM-Specific (6)
- Date Listed (BM), Date Sold (BM), Date Purchased (BM), BM Trade-in ID, BM Listing UUID, Warranty Sticker #

### Shipping & Courier (6)
- Inbound Tracking, Outbound Tracking, Gophr Link, Gophr Time Window, Collection Job ID, Return Job ID

### Integration (5)
- External Board ID, Intercom ID, Email Thread ID, Refurb ID, Refurb Status, Google Calendar event

### Dev/System (5)
- Dev (checkbox), Dev: Phase Deadline, Tech Repair Phase, Tech Repair Status, Status to Notifications, Counter, Status 1, Unified Groups

### Formulas (6)
- Quote, On Time?, Total Labour, Revenue ex Vat, Gross Profit, Parts Cost (formula), BM Deadline, Formula (unnamed)

### Buttons (2)
- Make Sale Item, Add to enquiries

### Legacy/Unknown (5+)
- ZenDeskID (text6) — legacy Zendesk reference
- Priority (text__1) — duplicate of Priority status?
- Passcode (text8) vs "passcode" column ID used for Street — confusing naming
- Various columns with cryptic IDs that may be unused

---

## Known Issues & Clashes

### 1. Status Column Overloaded (39 values)
Tracks repair flow + BM lifecycle + QC + customer comms. Should be split into:
- **Repair Status** — the core repair journey only
- **Trade-in Status** — already exists, migration stalled
- **QC Status** — doesn't exist, needs creating

### 2. Repair Type Column Overloaded (25 values)
Mixes repair types (Diagnostic, Repair, Board Level) with BM outcomes (Listed, Sold, Pay-Out). These are fundamentally different things.

### 3. Trade-In Status Migration Stalled
Column exists but 75%+ items have no value set. Only "Trade-in" is being used. The other values (Listed, Sold, Pay-Out) are still tracked in Repair Type.

### 4. Duplicate Columns
- Colour (status8) vs Device Colour (color_mkzmx3w)
- Priority (priority status) vs Priority (text__1 text)
- Multiple columns with confusing IDs (e.g. "passcode" is actually Street address)

### 5. No QC Status Column
QC pass/fail tracked through main Status. No dedicated column for QC outcome.

### 6. 4,000+ Dead Items
Board has 4,122 items. Estimated 100-150 active. The rest should be archived to a separate board. Returns should go to a different board. Dead items to another.

### 7. Dead Groups
8-10 groups with 0-1 items that should be removed or merged.

### 8. Monday Automations Undocumented
Native Monday automations handle group moves and status changes. No record of what they do. Previously extracted by Systems agent but data wasn't saved.

### 9. No Follow-Up Automation
Leads to Chase and Cancelled/Missed Bookings have no automated follow-up. Items sit there indefinitely.

---

## Cleanup Plan (Pre-Supabase Migration)

### Phase 1: Archive Dead Weight
- Script to identify items not updated in 90+ days
- Move to "iCorrect Archive" board (create new board)
- Move all Returned items older than 30 days to archive
- Target: reduce from 4,122 to ~200 active items

### Phase 2: Kill Dead Groups
- Remove: Adil, Zara iPods, Completed Refurbs, Selling, Ricky, New Orders (Not Confirmed)
- Merge: Devices In Hole + Long Term + Recycle → "Dead/Uncollected"
- Merge: BMs No Repair + Locked → "BM Dead / iCloud"
- Merge: Leads to Chase + Cancelled/Missed → "Follow Up Required"
- Assess: Safan (Long Deadline) — clean out or remove
- Assess: Purchased/Refurb Devices — move remaining items, remove group

### Phase 3: Status Column Separation
- Finish Trade-in Status migration — move all BM lifecycle out of Status and Repair Type
- Create QC Status column (Pass / Fail / In Review)
- Remove BM-related values from main Status once Trade-in Status is adopted
- Split Repair Type into actual type vs outcome

### Phase 4: Column Audit
- Identify and hide unused columns
- Resolve duplicates (Colour x2, Priority x2)
- Fix confusing names (passcode = Street)
- Document which columns are required vs optional

### Phase 5: Document Automations
- Systems agent to log into Monday, extract all active automations
- Document trigger → action for each
- Store in builds/documentation/monday/automations.md

### Phase 6: Supabase Mirror
- Once Monday is clean, design Supabase schema to mirror active items
- Build ETL (Monday API → Supabase) for real-time sync
- Agents read from Supabase, never from Monday directly

---

## Next Steps

- [ ] Code to run cross-query: which statuses and columns are used per repair type and service type
- [ ] Daytime API pull to capture transient statuses (Diagnostics, Under Repair, etc.)
- [ ] Systems agent to extract Monday native automations
- [ ] Ricky to confirm which columns are actually used by the team day-to-day
- [ ] Write cleanup script for Phase 1 (archive dead items)

---

## Other Boards (Need Auditing)

| Board | ID | Status |
|-------|----|--------|
| Parts Board | 985177480 | Active — needs full schema pull |
| Products & Pricing | 2477699024 | Active — Shopify IDs empty |
| BM Board | UNKNOWN | Active — need to find ID |
| Devices Board | UNKNOWN (linked via board_relation5) | Active — device catalogue |
| Ferrari Task Board | UNKNOWN | Active? |
| 47+ total boards | — | Most likely legacy/unused |

*This document was generated from live Monday API data on 23 Feb 2026 and Ricky's direct input. Status usage numbers are from a 3:41am UK sample — daytime numbers will differ for transient statuses.*

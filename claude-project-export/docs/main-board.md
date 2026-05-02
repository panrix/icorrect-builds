# Monday.com Main Board Schema

Status: partially-verified
Last verified: 2026-03-31
Verification method: local Monday export docs + staged live API schema note
Evidence sources:
- /home/ricky/builds/monday/board-schema.md
- /home/ricky/builds/monday/main-board-column-audit.md
- /home/ricky/builds/monday/automations.md
- /home/ricky/builds/monday/repair-flow-traces.md
- /home/ricky/data/archives/kb-inbox/2026-03-31/knowledge/monday-main-board-schema.md

**Board ID:** 349212843
**Latest schema evidence:** 2026-03-31 live API pull (group and column inventory)
**Older metric snapshot:** 2026-02-23 live API pull
**Older snapshot total items:** 4,122 (~100-150 active, rest is dead weight)
**Older snapshot total columns:** 170
**Older snapshot total groups:** 33
**Older snapshot active automations:** 147 active + 40 deactivated

This document mixes fresher 2026-03-31 schema inventory with older 2026-02-23 counts and automation totals. Treat item counts, activity labels, and automation totals as potentially stale until a fresh full Monday export/API pull is available.

---

## Key Columns

| Column ID | Column Name | Type | Purpose |
|-----------|-------------|------|---------|
| `status4` | Status | status | Main repair status (39 values) |
| `person` | Technician | people | Assigned technician |
| `status24` | Repair Type | status | Repair type / BM lifecycle (23 live values in the 2026-03-31 schema note) |
| `color_mkypbg6z` | Trade-in Status | status | BM trade-in lifecycle (12 values, migration stalled) |
| `service` | Service | status | Walk-In / Mail-In / External Mail-In / International Mail-In / Internal / Gophr Courier / Gophr Express / Stuart Courier |
| `status` | Client Type | status | End User / Warranty / Corporate / Corporate Warranty / B2B / Refurb / BM / iCorrect (NOTE: column named "status" is Client type, NOT the main Status) |
| `board_relation5` | Device | board_relation | Links to Devices Board |
| `connect_boards__1` | Parts Used | board_relation | Links to Parts Board (985177480) |
| `text4` | IMEI/SN | text | Device serial number or IMEI |
| `date4` | Received | date | Date device was received |
| `date36` | Deadline | date | Repair deadline |
| `date6` | Booking Time | date | Walk-in booking time |
| `status8` | Colour | status | Device colour |
| `color_mkzmx3w` | Device Colour | status | DUPLICATE of Colour |
| `status_2_Mjj4GJNQ` | Final Grade | status | Final device grade for BM |
| `color_mkp5ykhf` | LCD Pre-Grade | status | LCD condition pre-repair |
| `status_2_mkmc4tew` | Lid Pre-Grade | status | Lid condition pre-repair |
| `status_2_mkmcj0tz` | Top Case Pre-Grade | status | Top case / keyboard condition |
| `multiple_person_mkyp2bka` | QC By | people | Who performed QC |
| `date_mkypt8db` | QC Time | date | When QC happened |
| `text53` | Outbound Tracking | text | Tracking number for buyer shipment |
| `text5` | Email | text | Customer email |
| `text_mky01vb4` | BM Trade-in ID | text | Back Market trade-in identifier |
| `text_mkydhq9n` | Listing ID | text | Numeric BM listing_id |

---

## Status Column (status4) -- 39 Values

### Repair Flow (core)
- New Repair
- Received
- Booking Confirmed
- Diagnostics (transient -- daytime only)
- Diagnostic Complete (transient)
- Queued For Repair
- Under Repair (transient)
- Repaired (transient)
- Reassemble
- Ready To Collect
- Returned

### Customer Communication
- Awaiting Confirmation
- Client To Contact
- Client Contacted (124 items -- most common resting state)
- Password Req
- Quote Sent
- Ready to Quote
- Invoiced

### Courier/Shipping
- Expecting Device
- Courier Booked
- Book Courier
- Book Return Courier
- Return Booked
- To Ship
- Shipped

### BM/Trade-In (SHOULD BE IN Trade-in Status column)
- Purchased
- Under Refurb
- Cancelled/Declined

### QC (NEEDS OWN COLUMN)
- QC Failure
- Cleaning (transient)
- Battery Testing (transient)

### Edge Cases
- Repair Paused (38 items)
- Awaiting Part
- BER/Parts (46 items -- "Beyond Economic Repair")
- Clamped
- Part Repaired
- Software Install
- Missing Parts
- Error

### Usage Distribution (3:41am UK sample, 500 items)
Heavy (>20): Client Contacted (124), Ready To Collect (77), BER/Parts (46), Repair Paused (38), Expecting Device (27), Quote Sent (26), Queued For Repair (24), Awaiting Confirmation (23), Shipped (22)
Moderate (5-20): Returned (16), Awaiting Part (13), Received (12), Book Return Courier (11), Booking Confirmed (7), Purchased (5), Client To Contact (5)
Light (<5): Courier Booked (4), New Repair (3), Error (3), Invoiced (3), To Ship (2), Software Install (2)
Zero (daytime transient): Diagnostics, Under Repair, Repaired, QC Failure, Clamped, Cleaning, Under Refurb, Missing Parts, Ready to Quote, Diagnostic Complete, Return Booked, Battery Testing

---

## Repair Type Column (status24) -- 23 Values in the 2026-03-31 live schema note

- Repair
- Diagnostic
- Board Level
- Quote Rejected
- Unrepairable
- BER
- To List
- Listed
- Sold
- Trade-In
- Pay-Out
- IC ON
- IC OFF
- Purchased
- BM RTN/RFD
- Unprocessable
- Task
- Parts
- Booking Cancelled
- Manual
- Unlisted
- No Fault Found
- Counteroffer

Older February usage counts for these values are omitted here because the 2026-03-31 schema note is now the stronger enum source.

---

## Trade-In Status Column (color_mkypbg6z) -- 12 Values

Values: Trade-in, Purchased, To-List, Listed, Sold, Pay-Out, Counter, Manual Review, Error, N/a, (empty), "to" (orphan)

**Migration stalled:** 75.6% of items have no value set. Only "Trade-in" is being populated (likely by automation). The rest of the lifecycle (Listed, Sold, Pay-Out) is still tracked in Repair Type.

---

## Groups (34 listed in the 2026-03-31 API pull)

- New Orders
- Today's Repairs
- BM Inbound
- Incoming Future
- Safan (Short Deadline)
- Andres
- Mykhailo
- Roni
- Adil
- Quality Control
- BMs Awaiting Sale
- Client Services - To Do
- Outbound Shipping
- Devices In Hole
- Awaiting Parts
- Ferrari
- New Orders (Not Confirmed)
- Awaiting Confirmation of Price
- Trade-In BMs Awaiting Validation
- Safan (Long Deadline)
- BER Devices
- Client Services - Awaiting Confirmation
- Ricky
- Awaiting Collection
- Devices Left in Long Term
- Selling
- Purchased/Refurb Devices
- Zara iPods
- Completed Refurbs
- Recycle List
- Returned
- Cancelled/Missed Bookings
- Locked
- Leads to Chase

Earlier February audits treated several of these groups as low-use or dead. Keep that as a hypothesis, not current truth, until fresh item counts are pulled against the live board.

---

## Repair Flow Paths

### Walk-In
Customer walks in -> New Orders -> Today's Repairs (booking date trigger) -> Tech Group (Saf/Andres/Mykhailo) -> Quality Control (Roni) -> Awaiting Collection -> Returned

### Mail-In
New Orders -> Incoming Future -> device arrives -> Today's Repairs -> Tech Group -> Quality Control -> Outbound Shipping -> Returned

### Back Market Trade-In
Incoming Future -> Today's Repairs -> Tech Group -> if iCloud locked: Trade-In BMs Awaiting Validation -> once cleared -> Quality Control -> BMs Awaiting Sale -> sold

### Corporate
Same as walk-in/mail-in but Client column = "Corporate"

---

## Column Categories (170 total)

- Core Identification: 6 columns (Name, Item ID, Ticket, Subitems, Notifications, Service)
- Device Info: 8 columns (Device relation, IMEI/SN, Colour x2, Ammeter, Keyboard, iCloud, Passcode Verified)
- Dates & Timestamps: 14 columns (Received, Deadline, Booking Time, Created, Updated, etc.)
- Customer Contact: 5 columns (Email, Phone, Company, Street, Post Code)
- Status & Tracking: 15 columns (Status, Repair Type, Trade-in Status, Payment Status, etc.)
- Grading & QC: 7 columns (Final Grade, LCD/Lid/Top Case Pre-Grade, Screen Condition, QC By, QC Time)
- BM Reported vs Actual: 8 columns (Battery/Screen/Casing/Function -- Reported and Actual each)
- Financial: 8 columns (Quote, Discount, Paid, Invoice Amount, Xero Invoice ID/URL, Payments)
- Time Tracking: 5 columns (Total Time, Diagnostic/Cleaning/Repair/Refurb/BM Diag Time)
- People: 6 columns (Technician, Diagnostic/Refurb/Repair/BM Diag person, QC By)
- Parts: 6 columns (Parts Used relation, Parts Cost mirror, Parts Status, Part to Order, Parts Required, Stock Level)
- Linked Board Data (mirrors): 12 columns
- Notes & Text: 7 columns
- BM-Specific: 6 columns (Date Listed/Sold/Purchased, BM Trade-in ID, BM Listing UUID, Warranty Sticker)
- Shipping & Courier: 6 columns
- Integration: 5 columns (Intercom ID, Email Thread, Refurb ID, Google Calendar)
- Dev/System: 5 columns
- Formulas: 6 columns
- Buttons: 2 columns
- Legacy/Unknown: 5+ columns

---

## Known Issues

1. **Status column overloaded (39 values)** -- tracks repair flow + BM lifecycle + QC + customer comms. Should be split into Repair Status, Trade-in Status (exists but stalled), and QC Status (does not exist).
2. **Repair Type column overloaded (23 live values in the 2026-03-31 schema note)** -- mixes actual repair types with BM outcomes.
3. **Trade-In Status migration stalled** -- 75%+ items empty. Only "Trade-in" populated.
4. **No QC Status column** -- QC pass/fail tracked via main Status. No "QC Pass" value -- items just move forward.
5. **Duplicate columns** -- Colour (status8) vs Device Colour (color_mkzmx3w), Priority (status) vs Priority (text__1).
6. **Column "status" is Client Type, not Status** -- confusing naming.
7. **4,000+ items in the older February snapshot** -- likely archive candidates, but the exact count should be refreshed before acting on it.
8. **Several groups were previously treated as low-use/dead** -- revalidate with fresh item counts before deleting or automating around that assumption.
9. **Monday automations undocumented** -- 147 active automations with no record of what they do.
10. **No follow-up automation** for Leads to Chase / Cancelled bookings.
11. **"passcode" column ID is actually Street address** -- confusing naming.

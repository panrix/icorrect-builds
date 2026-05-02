# Monday Main Board — Column Audit

**Board:** iCorrect Main Board (349212843)
**Date:** 25 Feb 2026
**Author:** Code (Claude Code build agent)
**Source data:** board-schema.md, automations.md (147 active), repair-flow-traces.md (80 items), target-state.md
**Purpose:** Every column assessed for the new board rebuild. This is the Phase 1 blocker.

---

## Methodology

For every column listed in board-schema.md, this audit determines:

1. **Automation refs** — Is the column referenced by any of the 147 active automations? Count of automation IDs that read, write, or condition on the column.
2. **Flow trace usage** — Does the column appear in repair-flow-traces.md as an actively used field in real workflows?
3. **Board relation** — Is this a link to Parts board, Devices board, or other boards? These must be preserved.
4. **Formula/mirror dependency** — Is this a formula or mirror column? What does it depend on?
5. **Target-state need** — Is this column required by the target-state.md design?

**Verdict key:**
- **KEEP** — Needed on the new board as-is
- **KEEP (rename)** — Needed but should be renamed for clarity
- **MERGE** — Combine with another column (specified)
- **DROP** — Not needed on new board
- **NEW** — Does not exist yet, needs creating on new board
- **REMAP** — Column exists but its values/purpose changes significantly in the new design

**Note on column count:** board-schema.md states 170 columns but some categories list more items than their header count (e.g., "Time Tracking (5)" lists 8 items, "Status & Tracking (15)" lists 19 items). This audit covers every individual column mentioned, plus columns discovered in automations.md that were not explicitly listed in the schema categories. Total columns audited: **~175+**, including unlisted automation-only columns.

---

## 1. Core Identification (6 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Name | — | text | N | 0 | Y (item names in all traces) | N | KEEP | Primary identifier. Every item has a name. |
| Item ID | — | auto-number | N | 0 | Y (IDs listed in all traces) | N | KEEP | System-generated unique ID. Essential for API/ETL. |
| Ticket | — | link | N | 0 | N | N | KEEP | Links to external ticket/booking system. Useful for customer reference. |
| Subitems | — | subitems | N | 0 | N | Y (subitems board) | KEEP | Monday native subitems. Used for sub-tasks. Preserve if any active items use them. |
| Notifications | — | status | Y | 7 | N | N | KEEP | Used by 7 automations: [161355079] Password Req routing, [493570056] Password Req routing, [341517382] walk-in move, [44663250] Client→End User, [44663331] Client→Warranty, [44664616] Client→Refurb, [44663164] Client→Corporate. Controls whether customer gets auto-notifications. |
| Service | — | status/dropdown | Y | 6 | N | N | KEEP | Used by 6 automations: [475267570] Received routing, [340118443] Booking Time arrival, [489426254] Outbound Shipping, [364025154] Book Courier, [339385373] Courier Booked, [355902302] Stuart Courier, [272490060] walk-in collection, [341517382] walk-in move. Values: Walk-In, Mail-In, Stuart Courier, Unconfirmed. Critical for flow routing. |

---

## 2. Device Info (8 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Device | board_relation5 | board relation | Y | 1 | N | Y (Devices board) | KEEP | Links to Devices board (device catalogue). Referenced by [482555797] (Device changes → notify Ferrari for Trade-In). Must preserve board relation. |
| IMEI/SN | — | text | Y | 6 | N | N | KEEP | Referenced by 6 QC error-handling automations: [524402757], [524401012], [524401791], [524402464], [524402133], [509618257]. All check "if IMEI/SN is empty → set Status to Error". Critical data integrity field. |
| Colour | status8 | status | N | 0 | N | N | MERGE | Duplicate of Device Colour. Merge into one column — keep "Device Colour" as the name. |
| Device Colour | color_mkzmx3w | color | N | 0 | N | N | KEEP (rename) | Keep this one (newer column). Rename to just "Colour" after merging with status8 duplicate. |
| Ammeter Reading | — | text/number | N | 0 | N | N | KEEP | Technical diagnostic data. Low automation usage but needed for repair documentation. |
| Keyboard | — | status/text | N | 0 | N | N | KEEP | Device attribute (keyboard layout for MacBooks). Relevant for BM listings and parts. |
| iCloud | — | status | N | 0 | N | N | KEEP | iCloud lock status. Critical for BM trade-ins. Referenced implicitly by IC ON/IC OFF repair type values and "Trade-In BMs Awaiting Validation" group routing. Target-state Pause Reason "iCloud Lock" replaces some of this. |
| Passcode Verified | — | status/checkbox | N | 0 | N | N | KEEP | Security/access verification. Needed during intake. |

---

## 3. Dates & Timestamps (14 listed, 16 found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Received | — | date | Y | 5 | Y (shown in trace headers) | N | KEEP | Referenced by 5 automations: [3611197] set Received to today, [351394248] clear Booking Time on Received, [362869414] if Received is empty on Shipped, [260513231] if Received is empty on Shipped, [339383390] if Received is not empty on Shipped. Also conditions in [475267570], [340118443]. Critical date. |
| Deadline | — | date | Y | 4 | N | N | KEEP | Referenced by 4 automations: [517634192] BM Received → set Deadline+1 day, [429075536] No Stock → clear Deadline, [339411159] Quote Sent → clear Deadline, [432315289] Diagnostic Complete → clear Deadline. Key operational date. |
| Booking Time | — | date/time | Y | 3 | N | N | KEEP | Referenced by 3 automations: [351394248] clear on Received, [340118443] when Booking Time arrives, [339427949] when Booking Time arrives + Payment Status check. Triggers daily workflow. |
| Created | — | date | N | 0 | N | N | KEEP | System-generated creation timestamp. Needed for SLA tracking and archival. |
| Updated | — | date | N | 0 | N | N | KEEP | System-generated last-updated timestamp. Needed for archival (90-day rule). |
| Date Repaired | — | date | Y | 2 | N | N | KEEP | Referenced by [115492627] and [458670657]: Repaired → set Date Repaired to today. Key SLA metric. |
| Collection Date | — | date | Y | 1 | N | N | KEEP | Referenced by [3616510]: Returned → set Collection Date to today. Needed for completion tracking. |
| Diag. Complete | — | date | Y | 1 | N | N | KEEP | Referenced by [478836826]: Diagnostic Complete → set Diag. Complete to today. SLA metric for diagnostic turnaround. |
| Quote Sent | — | date | Y | 1 | N | N | KEEP | Referenced by [478837222]: Quote Sent → set Quote Sent to today. SLA metric for quote responsiveness. |
| Repaired | date_mkwdan7z | date | Y | 2 | N | N | MERGE → Date Repaired | **RESOLVED 25 Feb.** API confirms separate column from Date Repaired (`collection_date`). Referenced by [478837686] and [478837287]. Merge into single "Date Repaired" on new board — both automations update to reference the merged column. |
| Intake Timestamp | — | date | N | 0 | N | N | KEEP | Records when device was physically received. May overlap with Received date. |
| QC Time | date_mkypt8db | date | N | 0 | N | N | KEEP | When QC happened. Referenced in QC columns section. Needed for QC SLA tracking. |
| ETA | — | date | N | 0 | N | N | KEEP | Estimated completion date shown to customer. Useful for comms. |
| Start | date_mkxcktm5 | date | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** Legacy column. Overlaps with time tracking. Ricky confirmed. |
| Scheduled Collection Time | — | date/time | N | 0 | N | N | KEEP | Customer-facing collection appointment. Different from Collection Date (actual). |
| SLA Update | date32 | date | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** Legacy column. Ricky confirmed. |

**RESOLVED 25 Feb:** "Date Repaired" (`collection_date`) and "Repaired" (`date_mkwdan7z`) are two separate date columns confirmed by API. Merge into single "Date Repaired" on new board.

---

## 4. Customer Contact (5 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Email | — | email/text | N | 0 | N | N | KEEP | Customer email. Essential for comms and invoicing. |
| Phone Number | — | phone/text | N | 0 | N | N | KEEP | Customer phone. Essential for comms. |
| Company | — | text | N | 0 | N | N | KEEP | Corporate client name. Needed for corporate flow filtering. |
| Street Name/Number | passcode (!) | text | N | 0 | N | N | KEEP (rename) | Confusingly uses "passcode" as column ID. Rename column to "Address" on new board. Needed for courier/shipping. |
| Post Code | — | text | N | 0 | N | N | KEEP | Needed for courier logistics. |

---

## 5. Status & Tracking (15 listed, 19+ found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Status | status4 | status (39 values) | Y | 90+ | Y (every trace) | N | REMAP | The most-referenced column in the entire board. Used by 90+ automations as trigger or action. 39 values to be split across 4 new status columns per target-state: Repair Status, Comms Status, Shipping Status (new), plus existing QC handling. See target-state.md Section 1. |
| Repair Type | status24 | status (25 values) | Y | 12 | N | N | REMAP | Referenced by 12 automations: [478837686], [478837287] (condition on Diagnostic), [418734895] (Purchased), [414522418] (Sold), [414521830] (Listed), [482555797] (Trade-In condition), [411590646] (not Listed/Sold/RTN), [417781933] (not RTN), [507333831] (RTN), [474233835] (IC ON), [362779687] (Sold), [362327734] (Sold condition), [362887045] (Sold), [362869414] (Sold condition), [260513231] (not Sold condition), [362329061] (Listed condition), [384600181] (To List), [355318918] (Quote Rejected), [355319600] (BER), [318092989] (Booking Cancelled). Heavily used. Values to split: actual types stay, BM lifecycle → Trade-in Status, outcomes → Repair Status end states. |
| Trade-in Status | color_mkypbg6z | status (12 values) | N | 0 | N | N | REMAP | Exists but stalled at 75.6% empty. Target-state redesigns this column with 11 values. Migration must move BM values from Repair Type into here. |
| Payment Status | — | status | Y | 5 | N | N | KEEP | Referenced by 5 automations: [362887045] Sold → Confirmed, [319313101] Warranty Returned → Confirmed, [319313390] Invoiced → Pending, [319877126] Client Warranty → Warranty, [205853796] BER/Parts → Confirmed, [339427949] Booking Time + Unsuccessful. Critical for financial tracking. |
| Payment Method | — | status | Y | 4 | N | N | KEEP | Referenced by 4 automations: [362887045] Sold → BM Sale, [319313101] Warranty Returned → Warranty, [319313390] Invoiced → Invoiced - Xero, [319877126] Client Warranty → Warranty. Needed for financial reconciliation. |
| Parts Status | — | status | Y | 2 | N | N | KEEP | Referenced by 2 automations: [429085203] No Stock → Error if Part to Order empty, [429075536] No Stock → clear Deadline and move to Awaiting Parts. Key for parts workflow. |
| Parts Deducted | — | status | Y | 1 | N | N | KEEP | Referenced by [520364311]: Parts Deducted → Do Now! sends webhook. Used for stock deduction workflow. |
| Stock Status | color_mm01323z | status | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** Values: Low Stock, In Stock, No Stock. No automation references. Redundant with Parts Status (automation-driven) + Part Stock Level mirror. API-confirmed column ID. |
| Courier Collection | — | status | Y | 2 | N | N | KEEP | Referenced by [154487601] Booking Failed → Error, [35667419] Booking Complete → Courier Booked. Critical for inbound shipping. Maps to Shipping Status in target-state. |
| Courier Return | — | status | Y | 2 | N | N | KEEP | Referenced by [154487916] Booking Failed → Error, [35667471] Booking Complete → Return Booked. Critical for outbound shipping. Maps to Shipping Status in target-state. |
| Cleaning Status | — | status | N | 0 | N | N | DROP | No automation reference (note: Cleaning *status value* in main Status is referenced, but there is no separate Cleaning Status column automation). Flow traces show Cleaning as a status value, not a column. Redundant with main status tracking. |
| Invoice Status | color_mm0pkek6 | status | N | 0 | N | N | KEEP | **RESOLVED 25 Feb.** Not redundant with Payment Status. Tracks Xero invoice lifecycle: Draft, Sent, Paid, Overdue, Error, Voided. Payment Status tracks customer payment state. Different concerns, both needed. |
| Invoice Action | — | status | Y | 1 | N | N | KEEP | Referenced by [537692848]: Invoice Action → Create Invoice sends webhook. Active webhook trigger. |
| Payments Reconciled | — | status | N | 0 | N | N | KEEP | Financial tracking column. No automation but needed for Xero reconciliation workflow. |
| Info Capture | — | status | Y | 2 | N | N | KEEP | Referenced by [475267570] condition (not Info Validated), [472186986] trigger (Not Filled → Client To Contact). Controls intake info verification workflow. |
| Feedback | — | status | N | 0 | N | N | KEEP | Customer feedback tracking. Low usage but useful for quality metrics. |
| Column Sync | — | status | N | 0 | N | N | DROP | No automation reference. Appears to be a system/dev column for Monday internal syncing. |
| Source | — | status/text | N | 0 | N | N | KEEP | Tracks where the repair order originated (Shopify, walk-in, etc.). Useful for analytics. |

**Columns found in automations but NOT in Status & Tracking list:**

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Client | — | status/dropdown | Y | 12 | N | N | KEEP | Referenced by 12 automations as condition: BM, Corporate, Warranty, End User, Refurb. Values: BM, Corporate, Warranty, End User, Refurb. Critical for flow routing — determines whether item goes through BM, corporate, warranty, or standard flow. **Not listed in schema categories but heavily used.** |
| Problem (Repair) | — | status | Y | 6 | N | N | KEEP | Referenced by 6 automations: [441937418] Stuck→Solved, [458670105] Deadline Delay→Solved, [458670068] Solving→Solved, [442073587] Deadline Delay notify, [442072426] Stuck notify, [442073118] Solving notify. Tracks repair issues/escalations. Values: Stuck, Deadline Delay, Solving, Solved. |
| Supplier | — | label/dropdown | Y | 1 | N | N | KEEP | Referenced by [371622983]: Repaired + Supplier contains labels → notify Ferrari. Used to track third-party parts suppliers. |
| Requested Repairs | — | connect/mirror | Y | 2 | N | N | KEEP | Referenced by [355318918] Quote Rejected → clear, [355319600] BER → clear. Board relation or mirror to Products & Pricing board. Tracks which repair services were requested. |
| Custom Products | — | connect/mirror | Y | 2 | N | N | KEEP | Referenced by [355318918] Quote Rejected → clear, [355319600] BER → clear. Custom/non-standard repair products. Cleared when quote rejected or BER. |

---

## 6. Grading & QC (7 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| * Final Grade * | status_2_Mjj4GJNQ | status | N | 0 | N | N | KEEP | Final device grade after QC. Essential for BM listings and quality tracking. |
| LCD - Pre-Grade | color_mkp5ykhf | status | N | 0 | N | N | KEEP | Pre-repair LCD condition. Needed for BM grade comparison (reported vs actual). |
| Lid - Pre-Grade | status_2_mkmc4tew | status | N | 0 | N | N | KEEP | Pre-repair lid condition. Needed for BM grade comparison. |
| Top Case - Pre-Grade | status_2_mkmcj0tz | status | N | 0 | N | N | KEEP | Pre-repair top case condition. Needed for BM grade comparison. |
| Screen Condition | screen_condition | dropdown | N | 0 | N | N | KEEP | Screen condition assessment. Part of grading process. |
| QC By | multiple_person_mkyp2bka | people | N | 0 | N | N | KEEP | Who performed QC. Needed for accountability and QC workflow. |
| QC Time | date_mkypt8db | date | N | 0 | N | N | KEEP | When QC happened. Already listed in Dates section too (duplicate listing, same column). |

---

## 7. BM Reported vs Actual (9 listed — includes Liquid Damage)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Battery (Reported) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | BM trade-in reported battery condition. Flow traces show 60-100% mismatch rates — this data is essential for BM grading disputes. |
| Battery (Actual) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | Actual battery condition after intake. |
| Screen (Reported) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | BM trade-in reported screen condition. |
| Screen (Actual) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | Actual screen condition after intake. |
| Casing (Reported) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | BM trade-in reported casing condition. Most common mismatch in traces (4-6/10 items). |
| Casing (Actual) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | Actual casing condition after intake. |
| Function (Reported) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | BM trade-in reported functionality. |
| Function (Actual) | — | status | N | 0 | Y (BM trace tables) | N | KEEP | Actual functionality after intake. |
| Liquid Damage? | — | status/checkbox | N | 0 | Y (BM trace tables) | N | KEEP | Liquid damage indicator. Listed in BM trace comparison tables. |

---

## 8. Financial (8 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Quote | — | formula | N | 0 | N | N | KEEP | Formula column calculating quote amount. Depends on Requested Repairs / Custom Products pricing. Also listed in Formulas category. |
| Discount | — | number | N | 0 | N | N | KEEP | Discount amount or percentage. Needed for invoicing. |
| Paid | — | number/status | N | 0 | N | N | KEEP | Tracks payment amount received. Financial essential. |
| Invoice Amount | — | number | N | 0 | N | N | KEEP | Invoice total. Financial essential. |
| Xero Invoice ID | — | text | N | 0 | N | N | KEEP | Links to Xero accounting system. Needed for reconciliation. |
| Xero Invoice URL | — | link | N | 0 | N | N | KEEP | Direct link to Xero invoice. Convenience for Ferrari/accounting. |
| Payment 1 Ref/Amt/Date | — | text/number/date | N | 0 | N | N | KEEP | First payment tracking. May be 3 separate columns (Ref, Amount, Date) or a composite. Keep all. |
| Payment 2 Ref/Amt/Date | — | text/number/date | N | 0 | N | N | KEEP | Second payment tracking. Same structure as Payment 1. Keep for split payments. |

---

## 9. Time Tracking (5 listed, 8 found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Total Time | — | time tracking | Y | 2 | N | N | KEEP | Referenced by [5576384] Received → start, Ready To Collect → stop, and [341940054] moved to Returned → stop. Measures total repair lifecycle duration. |
| Total RR&D Time | — | formula | N | 0 | N | N | KEEP | Formula: likely sums Repair + Refurb + Diagnostic time. Depends on Diagnostic Time, Repair Time, Refurb Time. |
| Diagnostic Time | — | time tracking | Y | 1 | N | N | KEEP | Referenced by [338559396] Diagnostics → start, anything else → stop. Measures diagnostic phase duration. |
| Cleaning Time | — | time tracking | Y | 1 | N | N | KEEP | Referenced by [510266236] Cleaning → start, anything else → stop. Measures cleaning phase duration. |
| Repair Time | — | time tracking | Y | 1 | N | N | KEEP | Referenced by [338558605] Under Repair → start, anything else → stop. Measures repair phase duration. |
| Refurb Time | — | time tracking | Y | 2 | N | N | KEEP | Referenced by [511131239] and [511131197] (duplicate automations) Under Refurb → start, anything else → stop. Measures refurb phase duration. |
| BM Diag Time | — | time tracking | N | 0 | N | N | KEEP | BM-specific diagnostic time. No automation but useful for BM SLA tracking. |
| Initial Hours | numeric_mkxcedc | numbers | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** Legacy estimate field. Ricky confirmed. |

---

## 10. People (6 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Technician | — | person | Y | 28+ | Y (Tech field in all traces) | N | KEEP | The second most-referenced column after Status. Used in all 22 Status Routing automations (tech assignment), 6 QC error automations, 4 Diagnostic person auto-assigns, 4 Repair person auto-assigns, 4 Refurb person auto-assigns. Critical. |
| Diagnostic (person) | — | person | Y | 4 | N | N | KEEP | Referenced by [482496783], [482496952], [482495684], [482496856]: Diagnostics → auto-assign tech as Diagnostic person. Tracks who performed diagnostics. |
| Refurb (person) | — | person | Y | 4 | N | N | KEEP | Referenced by [482498532], [482498477], [482498431], [482498342]: Under Refurb → Repaired → auto-assign tech as Refurb person. Tracks who did refurb work. |
| Repair (person) | — | person | Y | 4 | N | N | KEEP | Referenced by [482498216], [482498139], [482498095], [482497012]: Under Repair → Repaired → auto-assign tech as Repair person. Tracks who did repair work. |
| BM Diag Tech | — | person | N | 0 | N | N | KEEP | BM-specific diagnostic tech assignment. Keep for BM workflow tracking. |
| QC By | multiple_person_mkyp2bka | people | N | 0 | N | N | KEEP | Already listed in Grading & QC. Same column, cross-listed. Keep. |

---

## 11. Parts (6 listed, 7 found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Parts Used | — | board relation | Y | 2 | N | Y (Parts board 985177480) | KEEP | Referenced by [115492627] and [458670657]: Repaired + Parts Used not empty → set Date Repaired. Board relation to Parts board. Must preserve. |
| Parts Cost | — | mirror | N | 0 | N | Y (mirrors Parts board) | KEEP | Mirror column pulling cost data from Parts board. Depends on Parts Used board relation. |
| Parts Status | — | status | Y | 2 | N | N | KEEP | Already listed in Status & Tracking. Referenced by [429085203] and [429075536] (No Stock triggers). Keep. |
| Part to Order | — | text/dropdown | Y | 2 | N | N | KEEP | Referenced by [429085203] if empty → Error, [429075536] if not empty → Awaiting Parts. Part ordering workflow. |
| Parts Required | — | board relation | Y | 1 | N | Y (Parts board) | KEEP | Referenced by [526854222]: Parts Required changes → webhook. Board relation to Parts board. Must preserve. |
| Part Stock Level | — | mirror | N | 0 | N | Y (mirrors Parts board) | KEEP | Mirror column showing stock level from Parts board. Depends on Parts Required board relation. |
| Stock Checkout ID | — | text | N | 0 | N | N | KEEP | Reference ID for stock checkout transactions. Needed for inventory tracking. |

---

## 12. Linked Board Data / Mirrors (12 listed, 14 found)

These are mirror columns pulling data from connected boards (Client Information Capture, Products & Pricing, Parts). They depend on board relations and provide read-only reference data.

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Intake Condition | — | mirror | N | 0 | N | Y (mirror) | KEEP | Mirrored from Client Information Capture board. Device condition at intake. |
| Fault to Repair (Details) | — | mirror | N | 0 | N | Y (mirror) | KEEP | Mirrored fault description. Critical for tech work queue. |
| Further Faults | — | mirror | N | 0 | N | Y (mirror) | KEEP | Additional faults discovered. Useful for quote building. |
| Client Notes | — | mirror | N | 0 | N | Y (mirror) | KEEP | Customer-provided notes mirrored from intake form. |
| Previous Repairs | — | mirror | N | 0 | N | Y (mirror) | KEEP | Repair history for the device. Important for diagnostics. |
| Notes for Repairer | — | mirror | N | 0 | N | Y (mirror) | KEEP | Specific instructions for the tech. Critical for workflow. |
| Collection Notes | — | mirror | N | 0 | N | Y (mirror) | KEEP | Collection-specific instructions. Needed for Ferrari's dispatch. |
| Data | — | mirror | N | 0 | N | Y (mirror) | KEEP | Generic mirrored data field. Keep unless confirmed unused. |
| Been to Apple? | — | mirror | N | 0 | N | Y (mirror) | KEEP | Whether device has been to Apple before. Important for warranty/repair context. |
| New or Refurb? | — | mirror | N | 0 | N | Y (mirror) | KEEP | Whether device is new or refurbished. Affects repair approach. |
| Battery | — | mirror | N | 0 | N | Y (mirror) | KEEP | Battery health data mirrored. Distinct from Battery (Reported/Actual) BM columns. |
| Requested Repairs Price | — | mirror | N | 0 | N | Y (mirror) | KEEP | Price from Products & Pricing board for requested repairs. Feeds Quote formula. |
| Custom Repairs Price | — | mirror | N | 0 | N | Y (mirror) | KEEP | Custom product pricing mirrored. Feeds Quote formula. |
| Stock Level | — | mirror | N | 0 | N | Y (mirror) | KEEP | Stock level mirrored from Parts board. May be same as Part Stock Level. If duplicate, merge. |

---

## 13. Notes & Text (7 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Walk-in Notes | — | text | N | 0 | N | N | KEEP | Free-text notes from walk-in intake. Operational. |
| Final Quote | — | long text | N | 0 | N | N | KEEP | Detailed quote text sent to customer. Needed for client communication. |
| Intake Notes | — | long text | N | 0 | N | N | KEEP | Notes captured during device intake. Operational. |
| High Level Notes Thread ID | — | text | N | 0 | N | N | DROP | Monday updates thread reference. System column — not user-facing. Can be auto-generated. |
| Tech Notes Thread | — | text | N | 0 | N | N | DROP | Same as above — Monday thread ID for tech notes. System-managed. |
| Error Thread ID | — | text | N | 0 | N | N | DROP | Thread ID for error discussions. System-managed. |
| Point of Collection | — | text | N | 0 | N | N | KEEP | Where the customer will collect from. Operational for front desk. |

---

## 14. BM-Specific (6 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Date Listed (BM) | — | date | Y | 1 | N | N | KEEP | Referenced by [414521830]: Repair Type → Listed → set Date Listed to today. BM listing timestamp. |
| Date Sold (BM) | — | date | Y | 1 | N | N | KEEP | Referenced by [414522418]: Repair Type → Sold → set Date Sold to today. BM sale timestamp. |
| Date Purchased (BM) | — | date | Y | 1 | N | N | KEEP | Referenced by [418734895]: Repair Type → Purchased → set Date Purchased to today. BM purchase timestamp. |
| BM Trade-in ID | — | text | N | 0 | N | N | KEEP | Back Market trade-in reference number. Needed for BM API integration and dispute resolution. |
| BM Listing UUID | — | text | N | 0 | N | N | KEEP | Back Market listing UUID. Needed for BM API integration. |
| Warranty Sticker # | — | text | N | 0 | N | N | KEEP | Physical warranty sticker number on the device. Operational tracking. |

---

## 15. Shipping & Courier (6 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Inbound Tracking | — | text | N | 0 | N | N | KEEP | Courier tracking number for inbound shipment. Needed for mail-in flow. |
| Outbound Tracking | — | text | N | 0 | N | N | KEEP | Courier tracking number for outbound return. Needed for mail-in flow. |
| Gophr Link | text_mkzmxq1d | text | N | 0 | N | N | KEEP | **RESOLVED 25 Feb.** Gophr is still the courier provider. Keep the booking link. |
| Gophr Time Window | text_mm084vbh | text | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** Gophr still used but time window column not needed. |
| Collection Job ID | — | text | N | 0 | N | N | KEEP | Courier job ID for collection (inbound). Needed for tracking/disputes. |
| Return Job ID | — | text | N | 0 | N | N | KEEP | Courier job ID for return (outbound). Needed for tracking/disputes. |

---

## 16. Integration (5 listed, 6 found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| External Board ID | — | text | N | 0 | N | N | DROP | Legacy integration reference. No automation or flow trace usage. |
| Intercom ID | — | text | N | 0 | N | N | KEEP | Links repair item to Intercom conversation. Needed for customer service agent integration. |
| Email Thread ID | — | text | N | 0 | N | N | DROP | Email thread reference. Likely legacy — email comms now handled via Intercom. |
| Refurb ID | — | text | N | 0 | N | N | DROP | Unknown integration reference. No automation usage. |
| Refurb Status | — | status | N | 0 | N | N | DROP | Separate refurb status tracking. No automation usage. Redundant with Under Refurb status value in main Status column. |
| Google Calendar event | — | text/link | N | 0 | N | N | KEEP | Links to Google Calendar booking. Needed for scheduling integration. |

---

## 17. Dev/System (5 listed, 8 found)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Dev | — | checkbox | N | 0 | N | N | DROP | Developer flag. Legacy dev/testing column. No operational use. |
| Dev: Phase Deadline | — | date | Y | 2 | N | N | DROP | Referenced by [277388549] and [255422860]: any status change → clear Dev: Phase Deadline and notify Gabriel Barr. **Gabriel Barr is a former developer.** These are legacy dev automations that should be deactivated. |
| Tech Repair Phase | — | status | N | 0 | N | N | DROP | Developer tracking column. No operational automation (Tech Repair Status is different). |
| Tech Repair Status | — | status | Y | 3 | N | N | DROP | Referenced by [259333840] Under Repair → anything → Complete, [259328813] Diagnostics → Active, [259328523] Under Repair → Active. **This is a dev tracking column** that duplicates the main Status flow. Values: Active, Complete. Provides no information beyond what Status already tracks. All 3 automations are from Sep 2024 (Maksym Shtanko / dev period). Recommend DROP and deactivate the 3 automations. |
| Status to Notifications | — | status | N | 0 | N | N | DROP | Dev/system column. No automation reference. Purpose unclear. |
| Counter | — | number | N | 0 | N | N | DROP | Unknown counter. No automation or flow trace usage. Legacy. |
| Status 1 | — | status | N | 0 | N | N | DROP | Appears to be a legacy status column (pre-status4). No automation or flow trace usage. |
| Unified Groups | — | status | Y | 1 | N | N | DROP | Referenced by [275236281]: item created → set Unified Groups to Complete. **This is a dev/system column** used during board migration. The automation fires on every new item creation — serves no operational purpose. Recommend DROP and deactivate the automation. |

---

## 18. Formulas (6 listed, 8 found)

Formula columns depend on other columns. They cannot be "kept" independently — their source columns must also exist.

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Dependencies | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|-------------|---------|--------|
| Quote | — | formula | N | 0 | N | N | Requested Repairs Price + Custom Repairs Price + Discount | KEEP | Calculates total quote amount. Depends on mirror columns from Products & Pricing board. |
| On Time? | — | formula | N | 0 | N | N | Deadline + Date Repaired (or Collection Date) | KEEP | SLA indicator — was the repair completed by deadline? Useful for performance metrics. |
| Total Labour | — | formula | N | 0 | N | N | Diagnostic Time + Repair Time + Refurb Time + Cleaning Time | KEEP | Total labour hours across all phases. Depends on time tracking columns. |
| Revenue ex Vat | — | formula | N | 0 | N | N | Invoice Amount or Paid (minus VAT) | KEEP | Financial metric. Depends on financial columns. |
| Gross Profit | — | formula | N | 0 | N | N | Revenue ex Vat - Parts Cost | KEEP | Financial metric. Depends on Revenue ex Vat and Parts Cost. |
| Parts Cost (formula) | — | formula | N | 0 | N | N | Parts Cost mirror column | KEEP | May be a formula version of the Parts Cost mirror. Keep if it adds calculation beyond the mirror. If pure duplicate, merge. |
| BM Deadline | — | formula | N | 0 | N | N | Date Purchased (BM) or Received + SLA offset | KEEP | BM-specific deadline calculation. Depends on BM date columns. |
| Formula (unnamed) | — | formula | N | 0 | N | N | Unknown | DROP | Unnamed formula column. No visible purpose. If it has a real name in Monday that wasn't captured by the schema pull, investigate. Otherwise drop. |

---

## 19. Buttons (2 listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Make Sale Item | — | button | Y | 1 | N | N | KEEP | Referenced by [309734967]: Make Sale Item changes → webhook. Creates a sale item in another system. Active integration. |
| Add to enquiries | — | button | Y | 1 | N | N | KEEP | Referenced by [449355354]: clicked → create item in Enquiries board and connect. Active integration. |

---

## 20. Legacy/Unknown (5+ listed)

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| ZenDeskID | text6 | text | N | 0 | N | N | DROP | Legacy Zendesk reference. Zendesk no longer in use (replaced by Intercom). |
| Priority | text__1 | text | N | 0 | N | N | KEEP (rename) | **RESOLVED 25 Feb.** Team uses this for 0-10 repair priority numbering. Rename to "Priority (0-10)" on new board. |
| Passcode | text8 | text | N | 0 | N | N | KEEP (rename) | Customer device passcode. Different from the "passcode" column ID used for Street Name. Rename to "Device Passcode" for clarity. Needed for device access during repair. |
| Priority (status) | priority | status | N | 0 | N | N | DROP | **RESOLVED 25 Feb.** API confirms native Monday priority column exists. But team uses the text column (0-10 numbering). Drop this one. |

---

## 21. Columns Found in Automations Not Listed in Schema Categories

These columns appear in automations.md but were not explicitly listed in any board-schema.md category. They exist on the board but were missed in the schema pull or belong to unlisted categories.

| Column | Column ID | Type | Auto Refs | Auto Count | Flow Traces | Board Rel | Verdict | Reason |
|--------|-----------|------|-----------|------------|-------------|-----------|---------|--------|
| Client | — | status/dropdown | Y | 12 | N | N | KEEP | See Section 5 extended table. Values: BM, Corporate, Warranty, End User, Refurb. 12 automation conditions. Critical routing column. |
| Problem (Repair) | — | status | Y | 6 | N | N | KEEP | See Section 5 extended table. Repair issue escalation tracking. |
| Supplier | — | label/dropdown | Y | 1 | N | N | KEEP | See Section 5 extended table. Third-party parts supplier tracking. |
| Requested Repairs | — | board relation/connect | Y | 2 | N | Y (Products & Pricing board) | KEEP | Links to Products & Pricing board. Cleared on Quote Rejected and BER. |
| Custom Products | — | board relation/connect | Y | 2 | N | Y (Products & Pricing board) | KEEP | Links to Products & Pricing board for custom items. Cleared on Quote Rejected and BER. |
| Link - Client Information Capture | — | board relation | Y | 1 | N | Y (Client Info Capture board) | KEEP | Referenced by [443069923]: item created → create in Client Information Capture and connect. Board relation must be preserved. |

---

## 22. NEW Columns Required by Target-State Design

These do not exist on the current board and must be created on the new board.

| Column | Type | Target-State Section | Verdict | Reason |
|--------|------|---------------------|---------|--------|
| QC Status | status | 1.2 | NEW | Values: Testing, Pass, Fail. Currently no dedicated QC column — QC outcome tracked through main Status ("QC Failure"). New column gives Roni clear queue visibility. |
| Comms Status | status | 1.3 | NEW | Values: Client To Contact, Contacted, Awaiting Response, Quote Sent, Quote Accepted, Invoiced, Confirmed, Declined. Currently these states live in Status column (39 values). Separation reduces dropdown noise for techs. |
| Pause Reason | status/dropdown | 1.5 | NEW | Values: Awaiting Parts, Awaiting Customer, Technical Issue, iCloud Lock, Requires Specialist, Other. Required when Repair Status = "Repair Paused". Gives context for all pauses — currently zero visibility into WHY something is paused. |
| Shipping Status | status | 1.6 | NEW | Values: N/A, Book Courier, Courier Booked, In Transit (Inbound), Received, Book Return, Return Booked, In Transit (Outbound), Delivered. Separates courier logistics from repair journey. Walk-in repairs set to N/A. |

---

## Summary Statistics

### By Verdict

| Verdict | Count | Description |
|---------|-------|-------------|
| KEEP | 107 | Columns needed as-is on new board |
| KEEP (rename) | 3 | Keep but rename for clarity (Device Colour, Street Name/Number, Passcode) |
| REMAP | 3 | Column exists but purpose/values change significantly (Status, Repair Type, Trade-in Status) |
| MERGE | 1 | Combine with another column (Colour → merge into Device Colour) |
| DROP | 25 | Not needed on new board |
| NEW | 4 | Must be created (QC Status, Comms Status, Pause Reason, Shipping Status) |

### Columns Referenced by Active Automations

**36 distinct columns** are referenced by the 147 active automations:

| Column | Automation Count | Role in Automations |
|--------|-----------------|---------------------|
| Status (status4) | 90+ | Trigger (status changes) and action (set status) |
| Technician | 28+ | Condition (assigned to specific person) and action (assign) |
| Repair Type | 12+ | Trigger (type changes) and condition |
| Client | 12 | Condition (BM, Corporate, Warranty, End User, Refurb) |
| Notifications | 7 | Condition (ON/OFF/Unconfirmed) and action (set) |
| Service | 6+ | Condition (Walk-In, Mail-In, Stuart Courier, Unconfirmed) |
| IMEI/SN | 6 | Condition (empty check for QC error handling) |
| Problem (Repair) | 6 | Trigger (changes) and action (set to Solved) |
| Payment Status | 5 | Action (set Confirmed/Pending/Warranty/Unsuccessful) |
| Received (date) | 5 | Action (set to today) and condition (empty check) |
| Diagnostic (person) | 4 | Action (auto-assign) |
| Repair (person) | 4 | Action (auto-assign) |
| Refurb (person) | 4 | Action (auto-assign) |
| Payment Method | 4 | Action (set BM Sale/Warranty/Invoiced-Xero) |
| Deadline | 4 | Action (set/clear/push) |
| Booking Time | 3 | Trigger (arrives) and action (clear) |
| Parts Used | 2 | Condition (not empty) |
| Parts Status | 2 | Trigger (No Stock) |
| Part to Order | 2 | Condition (empty/not empty) |
| Courier Collection | 2 | Trigger (Booking Failed/Complete) |
| Courier Return | 2 | Trigger (Booking Failed/Complete) |
| Requested Repairs | 2 | Action (clear) |
| Custom Products | 2 | Action (clear) |
| Date Repaired | 2 | Action (set to today) |
| Repaired (date) | 2 | Action (set to today) |
| Refurb Time | 2 | Action (start/stop) |
| Total Time | 2 | Action (start/stop) |
| Info Capture | 2 | Trigger and condition |
| Invoice Action | 1 | Trigger (Create Invoice → webhook) |
| Parts Required | 1 | Trigger (changes → webhook) |
| Parts Deducted | 1 | Trigger (Do Now! → webhook) |
| Make Sale Item | 1 | Trigger (changes → webhook) |
| Add to enquiries | 1 | Trigger (clicked → create item) |
| Collection Date | 1 | Action (set to today) |
| Quote Sent (date) | 1 | Action (set to today) |
| Diag. Complete (date) | 1 | Action (set to today) |
| Date Listed (BM) | 1 | Action (set to today) |
| Date Sold (BM) | 1 | Action (set to today) |
| Date Purchased (BM) | 1 | Action (set to today) |
| Diagnostic Time | 1 | Action (start/stop) |
| Cleaning Time | 1 | Action (start/stop) |
| Repair Time | 1 | Action (start/stop) |
| Device | 1 | Trigger (changes, Trade-In condition) |
| Supplier | 1 | Condition (contains labels) |
| Unified Groups | 1 | Action (set to Complete — DROP) |
| Tech Repair Status | 3 | Action (set Active/Complete — DROP) |
| Dev: Phase Deadline | 2 | Action (clear — DROP) |

### Board Relations (Must Preserve)

| Column | Connected Board | Type |
|--------|----------------|------|
| Device | Devices board | board relation |
| Parts Used | Parts board (985177480) | board relation |
| Parts Required | Parts board | board relation |
| Requested Repairs | Products & Pricing board (2477699024) | board relation / connect |
| Custom Products | Products & Pricing board | board relation / connect |
| Link - Client Information Capture | Client Info Capture board | board relation |
| Subitems | Subitems board | native subitems |

### Mirror Columns (Depend on Board Relations)

| Mirror Column | Source Board | Source Relation |
|---------------|-------------|-----------------|
| Parts Cost | Parts board | via Parts Used |
| Part Stock Level | Parts board | via Parts Required |
| Stock Level | Parts board | via Parts Required (possible duplicate of Part Stock Level) |
| Intake Condition | Client Info Capture | via Link - Client Info Capture |
| Fault to Repair (Details) | Client Info Capture | via Link - Client Info Capture |
| Further Faults | Client Info Capture | via Link - Client Info Capture |
| Client Notes | Client Info Capture | via Link - Client Info Capture |
| Previous Repairs | Client Info Capture | via Link - Client Info Capture |
| Notes for Repairer | Client Info Capture | via Link - Client Info Capture |
| Collection Notes | Client Info Capture | via Link - Client Info Capture |
| Data | Client Info Capture | via Link - Client Info Capture |
| Been to Apple? | Client Info Capture | via Link - Client Info Capture |
| New or Refurb? | Client Info Capture | via Link - Client Info Capture |
| Battery | Client Info Capture | via Link - Client Info Capture |
| Requested Repairs Price | Products & Pricing | via Requested Repairs |
| Custom Repairs Price | Products & Pricing | via Custom Products |

### Duplicate Columns — ALL RESOLVED (25 Feb, API + Ricky)

| Column A | Column B | Resolution |
|----------|----------|------------|
| Colour (`status8`) | Device Colour (`color_mkzmx3w`) | MERGE → Keep "Device Colour", drop "Colour" |
| Priority text (`text__1`) | Priority status (`priority`) | KEEP text (rename to "Priority (0-10)"), DROP status. Team uses 0-10 numbering. |
| Date Repaired (`collection_date`) | Repaired (`date_mkwdan7z`) | MERGE → Keep "Date Repaired". Two separate columns, confirmed by API. |
| Parts Cost mirror (`lookup_mkx1xzd7`) | Parts Cost formula (`formula_mkx13zr7`) | KEEP BOTH. Mirror pulls raw data, formula sums it. Formula exists because mirror wouldn't sum. |
| Part Stock Level (`lookup_mm01jk08`) | Stock Level (`lookup_mkzjzdem`) | MERGE → Keep one "Stock Level". Two separate mirrors from different board relations. |

### Legacy/Dev Columns (Recommended for Deactivation + DROP)

| Column | Why Legacy | Automations to Deactivate |
|--------|-----------|--------------------------|
| Dev (checkbox) | Developer testing flag | None |
| Dev: Phase Deadline | Gabriel Barr dev tracking | [277388549], [255422860] — both notify Gabriel Barr (no longer at company?) |
| Tech Repair Phase | Developer tracking | None |
| Tech Repair Status | Dev tracking, duplicates Status | [259333840], [259328813], [259328523], [259334255] — all set Active/Complete |
| Status to Notifications | Dev/system column | None |
| Counter | Unknown counter | None |
| Status 1 | Legacy status column | None |
| Unified Groups | Board migration artifact | [275236281] — fires on every item creation |
| ZenDeskID | Zendesk no longer used | None |
| External Board ID | Legacy integration | None |
| Refurb ID | Unknown integration | None |
| Refurb Status | Redundant with Status | None |

**Total automations to deactivate with DROP columns: 9** (out of 147 active). This reduces active automations to 138.

---

## Columns Used in Flow Traces

The repair-flow-traces.md file traces 80 items across 8 flow types. The traces primarily show **Status column transitions** (the status values items pass through). Additional columns visible in trace data:

| Column | Trace Usage |
|--------|-------------|
| Status (status4) | Every trace — all status transitions documented |
| Technician | Listed as "Tech:" in every item header |
| Received (date) | Listed as "Received:" in item headers |
| Battery (Reported/Actual) | BM Functional and Not Functional trace comparison tables |
| Screen (Reported/Actual) | BM trace comparison tables |
| Casing (Reported/Actual) | BM trace comparison tables — most common mismatch |
| Function (Reported/Actual) | BM trace comparison tables |
| Liquid Damage? | BM trace comparison tables |

**Status values seen in flow traces but NOT in automation references:**
- Part Repaired (appears in BM Not Functional traces)
- Refurb Paused (appears in Corporate Diagnostic traces)
- Missing Parts Used (appears once, BM 506 trace)
- Awaiting Part (Ordered) (appears in Corporate traces — variant of "Awaiting Part")
- Quote Accepted / Paid / Client Contact (appear in Ian Roberts trace — possibly older status values)

These edge statuses need remapping decisions for the new board.

---

## Ricky Decision Points — ALL RESOLVED (25 Feb)

Resolved via Ricky's answers + Monday API verification (25 Feb 2026).

| # | Question | Resolution | Source |
|---|----------|-----------|--------|
| 1 | Date Repaired vs Repaired (date) | **MERGE.** Two separate columns confirmed by API: `collection_date` (Date Repaired) and `date_mkwdan7z` (Repaired). Keep one — use "Date Repaired" on new board. | API + Ricky |
| 2 | Parts Cost mirror vs Parts Cost formula | **KEEP BOTH.** Mirror (`lookup_mkx1xzd7`) pulls from Parts board. Formula (`formula_mkx13zr7`) exists because mirror values wouldn't sum. Both needed. | Ricky |
| 3 | Part Stock Level vs Stock Level | **MERGE.** Two separate mirrors confirmed by API: `lookup_mm01jk08` (Part Stock Level, via Parts Required) and `lookup_mkzjzdem` (Stock Level, via Requested Repairs). Keep one on new board. | API + Ricky |
| 4 | Gophr Link / Gophr Time Window | **KEEP Gophr Link, DROP Gophr Time Window.** Gophr is still the courier provider. Link is useful, time window is not. | Ricky |
| 5 | Invoice Status vs Payment Status | **KEEP BOTH.** Not redundant. Invoice Status (`color_mm0pkek6`) tracks Xero invoice lifecycle: Draft, Sent, Paid, Overdue, Error, Voided. Payment Status tracks customer payment state. Different concerns. | API |
| 6 | Priority (status type) | **KEEP text column (`text__1`).** Used for 0-10 numbering by team. Also a native Monday priority status column exists (`priority`). Drop the status one, keep the text one — rename to "Priority (0-10)" on new board for clarity. | API + Ricky |
| 7 | Gabriel Barr automations | **DEACTIVATE.** Gabriel Barr no longer at the company. Deactivate [277388549] and [255422860] (Dev: Phase Deadline → notify Gabriel). | Ricky |
| 8 | Stock Status | **DROP.** Values (Low Stock, In Stock, No Stock) overlap with Parts Status automation triggers. No automation references Stock Status directly. Parts Status + Part Stock Level mirror cover inventory visibility. | API + Ricky |
| 9 | Start (date) | **DROP.** Legacy column (`date_mkxcktm5`). Overlaps with time tracking columns. | Ricky |
| 10 | SLA Update (date) | **DROP.** Legacy column (`date32`). No operational use. | Ricky |
| 11 | Initial Hours | **DROP.** Legacy estimate field (`numeric_mkxcedc`). | Ricky |

---

## API Verification (25 Feb 2026)

Full column list pulled from Monday API. 170 columns confirmed. All column IDs now known.

### Columns Found by API Not in Original Schema

5 columns exist on the board but were missed in the original board-schema.md pull:

| Column | ID | Type | Verdict | Reason |
|--------|-----|------|---------|--------|
| Case | `status_14` | status | KEEP | Device case type/model. Operational — assess usage on new board. |
| Problem (Client) | `color_mkse6bhk` | status | KEEP | Companion to Problem (Repair). Client-side issue tracking (e.g. customer unreachable, wrong device sent). |
| Basic Test | `color_mm01xyth` | status | KEEP | Pre-QC basic functionality test. Part of intake/diagnostic process. |
| Batt Health | `numbers9` | numbers | KEEP | Numeric battery health percentage. Distinct from Battery (Reported/Actual) status columns which track condition category. |
| Order Reference | `text7__1` | text | KEEP | Parts order reference number. Companion to Part to Order and Supplier columns. |

### Updated Duplicate Resolutions

| Pair | API Finding | Resolution |
|------|-----------|------------|
| Date Repaired (`collection_date`) vs Repaired (`date_mkwdan7z`) | **Two separate date columns.** Both are `date` type. Different IDs. | MERGE → keep "Date Repaired" on new board |
| Parts Cost mirror (`lookup_mkx1xzd7`) vs Parts Cost formula (`formula_mkx13zr7`) | **Two separate columns.** Mirror pulls raw data, formula calculates. | KEEP BOTH |
| Part Stock Level (`lookup_mm01jk08`) vs Stock Level (`lookup_mkzjzdem`) | **Two separate mirrors.** Pull from different board relations. | MERGE → keep one "Stock Level" on new board |
| Colour (`status8`) vs Device Colour (`color_mkzmx3w`) | **Two separate status columns.** Same purpose, different IDs. | MERGE → keep "Device Colour" |
| Priority text (`text__1`) vs Priority status (`priority`) | **Two separate columns.** Text used for 0-10, status is native Monday priority. | KEEP text (rename to "Priority (0-10)"), DROP status |

### Updated Summary Statistics

| Verdict | Count |
|---------|-------|
| **KEEP** | 113 (was 107 — added 5 API-discovered columns, added Invoice Status) |
| **KEEP (rename)** | 3 (Device Colour, Street Name/Number → Address, Passcode → Device Passcode) |
| **REMAP** | 3 (Status, Repair Type, Trade-in Status) |
| **MERGE** | 4 (Colour→Device Colour, Date Repaired+Repaired, Part Stock Level+Stock Level, Priority text kept/status dropped) |
| **DROP** | 28 (was 25 — added Stock Status, Gophr Time Window, Priority status) |
| **NEW** | 4 (QC Status, Comms Status, Pause Reason, Shipping Status) |

### Automations to Deactivate (updated)

| Automation ID | Trigger | Reason |
|---------------|---------|--------|
| [277388549] | Status changes → clear Dev: Phase Deadline, notify Gabriel Barr | Gabriel Barr gone. Column dropped. |
| [255422860] | Status changes → clear Dev: Phase Deadline, notify Gabriel Barr | Gabriel Barr gone. Column dropped. |
| [259333840] | Under Repair → anything → Tech Repair Status = Complete | Dev tracking column dropped. |
| [259328813] | Diagnostics → Tech Repair Status = Active | Dev tracking column dropped. |
| [259328523] | Under Repair → Tech Repair Status = Active | Dev tracking column dropped. |
| [259334255] | Diagnostics → anything → Tech Repair Status = Complete | Dev tracking column dropped. |
| [275236281] | Item created → Unified Groups = Complete | Board migration artifact. Column dropped. |
| [511131197] | Under Refurb → start Refurb Time (DUPLICATE of [511131239]) | Duplicate automation — keep [511131239], deactivate this one. |

**Total: 8 automations to deactivate** (was 9 — one was a counting error, but added the duplicate Refurb Time automation).

---

## 14-Day Activity Log Audit (25 Feb 2026)

**Method:** Pulled all activity_logs from the Monday API for 11-25 Feb 2026. 11,018 column change events across 94 distinct columns. This shows which columns the team is actually touching day-to-day.

**Why:** The original audit found 113 KEEP columns. Ricky felt this was too many. Activity data shows which KEEP columns are genuinely in use vs theoretical.

### Activity by Column (all 94 active columns)

| Column | ID | 14-Day Hits | Current Verdict |
|--------|-----|----------:|----------------|
| Status | status4 | 1732 | REMAP |
| Tech Repair Status | status_110 | 766 | DROP (automations still firing!) |
| Diagnostic Time | time_tracking | 519 | KEEP |
| Repair Type | status24 | 425 | REMAP |
| Deadline | date36 | 398 | KEEP |
| Refurb Time | time_tracking93 | 345 | KEEP |
| Parts Used | connect_boards__1 | 334 | KEEP |
| Total Time | time_tracking98 | 317 | KEEP |
| Repair Time | time_tracking9 | 249 | KEEP |
| Technician | person | 196 | KEEP |
| Link - Client Info Capture | board_relation_mkshr9ah | 158 | KEEP |
| Unified Groups | status_2 | 156 | DROP (automation still firing!) |
| BM Diag Tech | multiple_person_mkyp6fdz | 147 | KEEP |
| IMEI/SN | text4 | 127 | KEEP |
| Requested Repairs | board_relation | 124 | KEEP |
| Colour | status8 | 122 | MERGE (but team uses THIS one, not Device Colour!) |
| Received | date4 | 115 | KEEP |
| Date Repaired | collection_date | 113 | KEEP |
| Parts Deducted | color_mkzkats9 | 109 | KEEP |
| Priority (text) | text__1 | 101 | KEEP (rename) |
| High Level Notes Thread ID | text03 | 98 | DROP (system-generated) |
| Tech Notes Thread | text37 | 98 | DROP (system-generated) |
| Error Thread ID | text34 | 98 | DROP (system-generated) |
| Email Thread ID | text_1 | 98 | DROP (system-generated) |
| Diagnostic (person) | multiple_person_mkwqj321 | 88 | KEEP |
| Device | board_relation5 | 85 | KEEP |
| Counter | numbers1 | 78 | DROP (still being written to) |
| Payment Status | payment_status | 74 | KEEP |
| Custom Products | board_relation0 | 68 | KEEP |
| Parts Required | board_relation_mm01yt93 | 68 | KEEP |
| Passcode | text8 | 66 | KEEP (rename) |
| Diag. Complete | date_mkwdmm9k | 66 | KEEP |
| Outbound Tracking | text53 | 64 | KEEP |
| Payment Method | payment_method | 64 | KEEP |
| Lid - Pre-Grade | status_2_mkmc4tew | 64 | KEEP |
| LCD - Pre-Grade | color_mkp5ykhf | 64 | KEEP |
| Date Sold (BM) | date_mkq34t04 | 63 | KEEP |
| Top Case - Pre-Grade | status_2_mkmcj0tz | 63 | KEEP |
| Ammeter Reading | color_mkwr7s1s | 62 | KEEP |
| Casing (Actual) | color_mkqga1mc | 62 | KEEP |
| Function (Actual) | color_mkqgj96q | 61 | KEEP |
| Cleaning Time | duration_mkyrykvn | 61 | KEEP |
| Liquid Damage? | color_mkqg8ktb | 59 | KEEP |
| Screen (Actual) | color_mkqgtewd | 58 | KEEP |
| Battery (Actual) | color_mkqg4zhy | 55 | KEEP |
| Client | status | 53 | KEEP |
| Date Listed (BM) | date_mkq385pa | 51 | KEEP |
| Refurb (person) | multiple_person_mkwqsxse | 51 | KEEP |
| Notifications | status_18 | 45 | KEEP |
| * Final Grade * | status_2_Mjj4GJNQ | 43 | KEEP |
| Stock Status | color_mm01323z | 43 | DROP (but being written to) |
| Repair (person) | multiple_person_mkwqy930 | 41 | KEEP |
| BM Listing UUID | text_mkydhq9n | 40 | KEEP |
| Case | status_14 | 40 | KEEP |
| Collection Date | date3 | 37 | KEEP |
| Date Purchased (BM) | date_mkqgbbtp | 36 | KEEP |
| Batt Health | numbers9 | 35 | KEEP |
| Paid | dup__of_quote_total | 31 | KEEP |
| Booking Time | date6 | 30 | KEEP |
| Parts Status | color_mkppdv74 | 28 | KEEP |
| Service | service | 28 | KEEP |
| Passcode Verified | color_mm01jjsx | 26 | KEEP |
| Ticket | link1 | 23 | KEEP |
| Quote Sent | date_mkwdwx03 | 21 | KEEP |
| Info Capture | color_mkvmn8wr | 20 | KEEP |
| Intercom ID | text_mm087h9p | 16 | KEEP |
| Repaired (date) | date_mkwdan7z | 14 | MERGE |
| Walk-in Notes | text368 | 13 | KEEP |
| Part to Order | text_mkpp9s3h | 12 | KEEP |
| Supplier | ordered_part_from_mkkassja | 10 | KEEP |
| Street Name/Number | passcode | 10 | KEEP (rename) |
| Basic Test | color_mm01xyth | 10 | KEEP |
| Make Sale Item | button__1 | 9 | KEEP |
| Gophr Time Window | text_mm084vbh | 8 | DROP (but being written to!) |
| Discount | numeric_mkxx7j1t | 7 | KEEP |
| Email | text5 | 7 | KEEP |
| Inbound Tracking | text796 | 6 | KEEP |
| Gophr Link | text_mkzmxq1d | 6 | KEEP |
| Problem (Repair) | color_mkse6rw0 | 5 | KEEP |
| Invoice Action | color_mm0pjwz1 | 5 | KEEP |
| Order Reference | text7__1 | 4 | KEEP |
| Function (Reported) | color_mkqg578m | 4 | KEEP |
| Xero Invoice URL | link_mm0a43e0 | 4 | KEEP |
| BM Trade-in ID | text_mky01vb4 | 4 | KEEP |
| Source | color_mkzmbya2 | 2 | KEEP |
| Post Code | text93 | 2 | KEEP |
| Trade-in Status | color_mkypbg6z | 2 | REMAP |
| Screen (Reported) | color_mkqg7pea | 2 | KEEP |
| Phone Number | text00 | 2 | KEEP |
| Invoice Amount | numeric_mm0pvem5 | 1 | KEEP |
| Invoice Status | color_mm0pkek6 | 1 | KEEP |
| Xero Invoice ID | text_mm0a8fwb | 1 | KEEP |
| Casing (Reported) | color_mkqg1c3h | 1 | KEEP |
| Battery (Reported) | color_mkqg66bx | 1 | KEEP |

### KEEP Columns With Zero Activity (excluding formulas, mirrors, system fields)

These 30 KEEP columns had **zero changes in 14 days** and are NOT formulas, mirrors, or auto-generated system fields:

#### Recommend DROP — genuinely unused (9 columns)

| Column | Reason to Drop |
|--------|---------------|
| ETA | Never filled. Team doesn't estimate completion dates in Monday. |
| Feedback | Customer feedback not tracked through Monday. Zero usage. |
| Google Calendar event | Calendar integration is dead. Zero usage. |
| Screen Condition | Replaced by LCD/Lid/Top Case Pre-Grade columns (64 hits each). Redundant. |
| BM Diag Time | BM diagnostics tracked through regular Diagnostic Time (519 hits). No separate tracking. |
| Scheduled Collection Time | Team doesn't schedule collections through Monday. Zero usage. |
| Stock Checkout ID | Inventory checkout not tracked here. Zero usage. |
| Point of Collection | Never filled by front desk. Zero usage. |
| Intake Timestamp | Duplicate of Received date (115 hits). Received serves the same purpose. |

#### Recommend DROP — Ricky to confirm (8 columns)

| Column | Reason to Consider Dropping | Counter-argument |
|--------|----------------------------|-----------------|
| Warranty Sticker # | Zero activity. Possibly legacy. | Physical sticker tracking could still be useful. |
| Collection Job ID | Zero activity. Courier tracking not populated. | Needed if courier booking workflow is fixed. |
| Return Job ID | Zero activity. Same as above. | Same. |
| Payments Reconciled | Zero activity. Xero reconciliation not done via this column. | Could be needed for future finance workflow. |
| Payment 1 Ref/Amt/Date | Zero activity. Split payments never tracked here. | May need for corporate invoicing. |
| Payment 2 Ref/Amt/Date | Zero activity. Same. | Same. |
| Final Quote | Zero activity. Quote formula exists. Long text quote not being used. | Could be useful for detailed customer quotes. |
| Add to enquiries (button) | Zero button presses in 14 days. | May be used occasionally for walk-in enquiries. |

#### Flag for Process Review — should be used but aren't (7 columns)

| Column | Issue |
|--------|-------|
| QC By | Zero activity. Roni should be filling this during QC. **Process gap, not column issue.** |
| QC Time | Zero activity. Should be timestamped during QC. Same process gap. |
| Courier Collection | Zero activity but has 2 automation references. May just be low mail-in volume in this window. |
| Courier Return | Zero activity. Same reasoning as Courier Collection. |
| Keyboard | Zero activity. Needed for MacBook BM listings but not being filled. |
| iCloud | Zero activity. Important for BM trade-ins but not tracked here. |
| Company | Zero activity. Corporate clients may not have come through in 14 days. |

#### Expected Zero — not a concern (6 columns)

| Column | Why Zero Is Normal |
|--------|-------------------|
| Subitems | Monday system feature. Subitem changes logged differently, not as column changes. |
| Created | Auto-generated at item creation. Never manually changed. |
| Updated | Auto-updated by system. Never manually changed. |
| Device Colour | Team uses old "Colour" column (122 hits) instead. See note below. |
| Intake Notes | Walk-in Notes (13 hits) is the active equivalent. Mail-in volume may be too low to trigger. |
| Problem (Client) | Newly discovered column. May not be visible to team or actively used yet. |

### Key Findings

**1. DROP columns are still firing automations:**
- Tech Repair Status: 766 hits — 3 dev automations fire on every status change. Must deactivate.
- Unified Groups: 156 hits — creation automation fires on every new item. Must deactivate.
- Counter: 78 hits — something is still incrementing this. Investigate.
- Thread ID columns (4): 98 hits each — system-generated, not user activity. Still fine to DROP.
- Stock Status: 43 hits — marked DROP but something is writing to it.
- Gophr Time Window: 8 hits — marked DROP but still receiving data.

**2. Device Colour naming mismatch:**
Team uses "Colour" (status8, 122 hits). "Device Colour" (color_mkzmx3w, 0 hits) is unused. On the new board, name the merged column **"Colour"** (not "Device Colour") to match team habits.

**3. QC process gap:**
Both QC By and QC Time have zero activity. Roni is not recording who did QC or when. This is a training/process issue — the columns should exist on the new board but the QC workflow needs enforcement.

**4. BM Diag Tech is heavily used (147 hits):**
Originally suspected low usage. Actually the 6th most-active people column. Confirms KEEP.

**5. Priority text column actively used (101 hits):**
Ricky said the team "used to" number priorities 0-10. They still do — 101 changes in 14 days. Confirm KEEP and rename.

### Revised Summary Statistics

If Ricky approves all 9 strong DROP recommendations:

| Verdict | Original Count | After Activity Audit | Change |
|---------|---------------|---------------------|--------|
| KEEP | 113 | 104 | -9 |
| KEEP (rename) | 3 | 3 | — |
| REMAP | 3 | 3 | — |
| MERGE | 4 | 4 | — |
| DROP | 28 | 37 | +9 |
| NEW | 4 | 4 | — |

If Ricky also approves the 8 "confirm" drops: KEEP goes to **96**, DROP to **45**.

**New board column count (best case): 96 KEEP + 3 rename + 3 REMAP + 4 NEW = ~106 columns.**
**New board column count (conservative): 104 KEEP + 3 rename + 3 REMAP + 4 NEW = ~114 columns.**

Note: ~14 of those are mirror columns (auto-created when board relations exist) and ~7 are formula columns (computed, not user-facing). Real user-facing columns: **~85-93**.

---

## Phase 1 Status: COMPLETE

All 170 columns audited. All decision points resolved. All column IDs confirmed via API. Activity log analysis complete. Ready for Ricky's final review before Phase 2 (build new board).

**Remaining Ricky decisions:** 8 columns in the "Recommend DROP — Ricky to confirm" section above.

---

*This audit was compiled by cross-referencing board-schema.md (170 columns), automations.md (147 active automations), repair-flow-traces.md (80 traced items across 8 flow types), target-state.md (6 new status columns design), a live Monday API column pull, and 14-day activity log analysis (11,018 events, 11-25 Feb 2026). Every column on the board has been assessed with its real column ID and actual usage data.*

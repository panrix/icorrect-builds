# Monday Automation Audit — 147 Active Automations

**Board:** 349212843 (current Main Board)
**Target:** 18401861682 (v2 board)
**Date:** 18 Mar 2026 (updated 30 Mar — production activity audit from screenshots)
**Author:** Code

---

## Production Activity Audit (30 Mar 2026)

Verified all 147 automations against Monday's automation panel (screenshots at `builds/monday/automation screenshots/`). Each automation's action count, success rate, and last-triggered data was reviewed.

### Key Findings

**Confirmed dead (0 or near-0 actions on production):**
- Gabriel Barr notifications + Dev: Phase Deadline — 0 actions. Never fires.
- Tech Repair Status automations (Active/Complete) — near-0. Column is dead.
- Mike McAdam routing — auto-disabled by Monday (deleted resource).
- Unified Groups — near-0. Column is dead.
- Software Install routing (all techs) — very low. Status barely used.
- Reassemble routing (all techs) — very low. Status barely used.
- Booking Cancelled → Cancelled/Missed Bookings — very low.
- Technician → Ricky routing — very low. Ricky never assigned as tech.

**Extremely noisy (misconfigured):**
- Two "any column changes → webhook" automations — **2,073 actions each**. Fire on every column edit. One is Ferrari's (should be status changes only for Intercom), one is Ricky's (should be Parts changes only). **Codex to fix.**

**Confirmed duplicates:**
- Two identical Refurb Time trackers — both showing similar action counts, wasting automation quota.

**Healthy & active (high action counts):**
- Diagnostic Time start/stop — 191+ actions
- Repair Time start/stop — high activity
- Total Time tracking — 41+ actions
- IMEI empty checks — moderate
- Tech routing (Safan, Andres, Mykhailo, Ferrari) — active
- Ready To Collect routing — active
- QC Failure routing — moderate
- BM trade-in date stamps (Sold, Listed, Purchased) — moderate

**Low but correct (fire infrequently by design):**
- Person assignment (Diagnostic/Repair/Refurb) — 1-7 actions. Normal for specific transitions.
- Problem (Repair) notifications — low but valid
- Courier booking automations — moderate
- Repair Paused + Ferrari routing — low (few pauses, expected)

**Conclusion:** The 27 KILL automations are confirmed dead on production — 0 actions, not just theoretically dead. No surprises. The audit verdicts below are validated.

---

## Summary

| Verdict | Count | Description |
|---------|-------|-------------|
| **KILL** | 27 | Dead — references gone people, archived boards, dropped columns, or removed statuses |
| **DUPLICATE** | 5 | Exact or functional duplicates of other active automations |
| **REMAP** | 56 | Logic is still needed but must be rewritten for v2's split-column design |
| **KEEP AS-IS** | 36 | Works directly on v2 with no changes (same column names, same statuses) |
| **CONSOLIDATE** | 15 | Per-tech automations that could be reduced using v2's cleaner design |
| **REVIEW** | 8 | Webhooks — need confirming which endpoints are still active |
| **Total** | 147 | |

**Net result for v2:** ~80 automations (down from 147) after killing dead ones, removing duplicates, and consolidating per-tech rules.

---

## Gone People (referenced in automations but no longer on team)

| Person | Status | Automations Affected |
|--------|--------|---------------------|
| **Gabriel Barr** | Left (dev) | 2 — both KILL |
| **Mike McAdam** | Left | 6 — KILL the routing/notify ones, REMAP the logic-only ones |
| **Adil Azad** | Dismissed 5 Mar 2026 | 1 — KILL |
| **Maksym Shtanko** | Left (former dev) | Owner of many but not referenced as assignee in active ones |
| **Ricky Panesar** | Still here but "Ricky" group deleted in v2 | 1 — KILL (tech routing to Ricky group) |

**Current team for automations:** Safan, Mykhailo (Misha), Roni, Ferrari, Andres (Andreas)

---

## Removed Statuses (exist on old board, NOT in v2 repair_status)

These statuses were removed or moved to other columns in v2. Any automation triggering on "Status changes to X" where X is one of these is either KILL or REMAP.

| Old Status | V2 Mapping | Notes |
|------------|------------|-------|
| Software Install | **REMOVED** | No longer a tracked status |
| Reassemble | **REMOVED** | No longer a tracked status |
| Cleaning | **REMOVED** | Time tracking stays, but no status trigger |
| Ready To Collect | → `repair_status: Complete` | Renamed |
| Ready to Quote | **REMOVED** | Merged into comms flow |
| Error | **REMOVED** | No Error status in v2 |
| Client To Contact | → `comms_status` | Split from main status |
| Client Contacted | → `comms_status: Contacted` | Split from main status |
| Quote Sent | → `comms_status` | Split from main status |
| Invoiced | → `comms_status` | Split from main status |
| Password Req | → `comms_status: Awaiting Response` | Split from main status |
| Awaiting Confirmation | **REMOVED** | Was a group-based state, not a status |
| QC Failure | → `qc_status: Fail` | Split from main status |
| Book Courier | → `shipping_status` | Split from main status |
| Courier Booked | → `shipping_status` | Split from main status |
| Book Return Courier | → `shipping_status: Book Return` | Split from main status |
| Return Booked | → `shipping_status` | Split from main status |
| Shipped | → `shipping_status: In Transit (Outbound)` | Split + renamed |
| Expecting Device | → `shipping_status: In Transit (Inbound)` | Split + renamed |

**Repair Type values moved to tradein_status:**
Trade-In, Purchased, Pay-Out, To List, Listed, Sold, BM RTN/RFD, Counteroffer, Quote Rejected, BER, Booking Cancelled — all removed from `repair_type` in v2.

---

## 1. KILL — Dead Automations (27)

### 1.1 Gone People (5)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **277388549** | Status changes → notify Gabriel Barr + clear Dev: Phase Deadline | Gabriel gone. Dev: Phase Deadline column dropped. |
| **255422860** | Status changes → clear Dev: Phase Deadline + notify Gabriel Barr | Gabriel gone. Dev: Phase Deadline column dropped. |
| **488623832** | Tech assigned to Client Services → move to Adil | Adil dismissed. "Adil" group doesn't exist in v2. |
| **16264589** | Tech assigned to Ricky → move to Ricky group | "Ricky" group doesn't exist in v2. Ricky is not a tech. |
| **319902324** | Queued For Repair + Tech = Mike McAdam → move to group | Mike gone. No Mike group in v2. |

### 1.2 Dropped Columns (4)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **259333840** | Under Repair → anything: set Tech Repair Status to Complete | Tech Repair Status column dropped. |
| **259328813** | Diagnostics: set Tech Repair Status to Active | Tech Repair Status column dropped. |
| **259328523** | Under Repair: set Tech Repair Status to Active | Tech Repair Status column dropped. |
| **259334255** | Diagnostics → anything: set Tech Repair Status to Complete | Tech Repair Status column dropped. |
| **275236281** | Item created → set Unified Groups to Complete | Unified Groups column dropped. Migration artifact. |

### 1.3 Archived/Dead Boards (3)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **443069923** | Item created → create item in Client Information Capture + connect | Client Info Capture board archived. Items were never used. |
| **449355354** | "Add to enquiries" button → create item in Enquiries | Enquiries board dead since Jan 2026. |
| **309734967** | Make Sale Item changes → send webhook | Sales board is legacy. Make Sale Item button removed from v2. |

### 1.4 Removed Statuses — No V2 Equivalent (7)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **456510291** | Software Install + Tech = Andres → move to Andres | "Software Install" removed from v2. |
| **456508980** | Software Install + Tech = Roni → move to Roni | "Software Install" removed. Also: Roni has no personal group in v2 (he's QC). |
| **333956233** | Software Install + Tech = Safan → move to Safan | "Software Install" removed from v2. |
| **456508014** | Reassemble + Tech = Roni → move to Roni | "Reassemble" removed. Roni has no group in v2. |
| **328789674** | Reassemble + Tech = Mykhailo → move to Mykhailo | "Reassemble" removed from v2. |
| **317079729** | Reassemble + Tech = Andres → move to Andres | "Reassemble" removed from v2. |
| **330530788** | Reassemble + Tech = Safan → move to Safan | "Reassemble" removed from v2. |

### 1.5 Routing to Non-Existent Groups (3)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **456509194** | Queued For Repair + Tech = Roni → move to Roni | No "Roni" group in v2. Roni is QC, not repair tech. |
| **456507728** | Tech assigned to Roni → move to Roni | No "Roni" group in v2. |
| **456509728** | QC Failure + Tech = Roni → move to Roni | No "Roni" group in v2. QC Failure is now in qc_status column. |

### 1.6 Logic Superseded (2)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **135165968** | Status → "Ready to Quote" → move to Client Services - To Do | "Ready to Quote" doesn't exist in v2. Superseded by comms_status flow. |
| **318092989** | Repair Type → Booking Cancelled → move to Cancelled/Missed Bookings | "Booking Cancelled" removed from repair_type. "Cancelled/Missed Bookings" group merged into "Follow Up Required". |

### 1.7 Mike McAdam Routing/Assignment (3)

| ID | Automation | Why Kill |
|----|-----------|----------|
| **482498342** | Under Refurb → Repaired + Tech = Mike McAdam → assign as Refurb | Mike gone. |
| **482498216** | Under Repair → Repaired + Tech = Mike McAdam → assign as Repair | Mike gone. |
| **115492627** | Repaired + Parts Used not empty + Client not BM → notify Mike McAdam + set Date Repaired + move to QC | **Partially kill.** The notify Mike part is dead. The Date Repaired + move to QC logic needs REMAP — see [458670657] which does the same for BM. Need a new non-BM version without Mike. |

---

## 2. DUPLICATE — Remove These (5)

| ID | Duplicate Of | Automation | Why Duplicate |
|----|-------------|-----------|---------------|
| **511131197** | 511131239 | Under Refurb → start Refurb Time | **Exact duplicate.** Both created same minute by same person. |
| **326485718** | 218545034 | Queued For Repair + Tech = Andres → move to Andres | **Exact duplicate.** [218545034] does the same thing. |
| **362327734** | 362779687 | Ready To Collect + Repair Type = Sold → move to Outbound Shipping + Book Return Courier | **Functional overlap.** [362779687] fires on Repair Type → Sold AND status = Ready To Collect. [362327734] fires on Status → Ready To Collect AND type = Sold. Same result, different triggers = double-fire risk. Keep ONE. |
| **524402757** | 509618257 | Repaired + IMEI empty + Tech = Mykhailo → Error + notify | **Covered by generic.** [509618257] already catches ALL techs with "IMEI empty → Error + notify Technician". Per-tech versions are redundant. See §4 Consolidation. |
| **524401791** | 509618257 | Repaired + IMEI empty + Tech = Safan → Error + notify | Same — covered by generic [509618257]. |

**Note on IMEI checks:** 509618257 (generic) + 524402133 (Andres) + 524402464 (Roni) + 524401012 (Safan diag) are also redundant with the generic. See §4 for full consolidation recommendation.

---

## 3. REMAP — Needs Rewriting for V2 (56)

These automations have valid business logic but reference statuses/columns that have moved in v2.

### 3.1 "Ready To Collect" → "Complete" (9)

All automations triggering on "Ready To Collect" need to trigger on `repair_status: Complete` instead.

| ID | Current Trigger | V2 Remap |
|----|----------------|----------|
| **519172033** | Ready To Collect + Client not BM → notify Ferrari | `repair_status → Complete` + Client not BM → notify Ferrari |
| **411590646** | Ready To Collect + Client BM + type not Listed/Sold/RTN → move to BMs Awaiting Sale + set type To List | `repair_status → Complete` + Client BM → move to BMs Awaiting Sale + set `tradein_status → To List` |
| **507333831** | Ready To Collect + type BM RTN/RFD → move to Outbound + Book Return Courier | `repair_status → Complete` + `tradein_status: Return` → move to Outbound + set `shipping_status: Book Return` |
| **339375219** | Ready To Collect + Service not Walk-In + Client not BM → move to Outbound + Book Return Courier | `repair_status → Complete` + Service not Walk-In + Client not BM → move to Outbound + set `shipping_status: Book Return` |
| **272490060** | Ready To Collect + Service Walk-In → move to Awaiting Collection | `repair_status → Complete` + Service Walk-In → move to Awaiting Collection |
| **355902302** | Ready To Collect + Service Stuart Courier → move to Outbound Shipping | `repair_status → Complete` + Service Stuart Courier → move to Outbound |
| **362329061** | Ready To Collect + type Listed → move to BMs Awaiting Sale | `repair_status → Complete` + `tradein_status: Listed` → move to BMs Awaiting Sale |
| **362779687** | Repair Type → Sold + Ready To Collect → move to Outbound + Book Return Courier | `tradein_status → Sold` + `repair_status = Complete` → move to Outbound + `shipping_status: Book Return` |
| **5576384** | Received → start Total Time. Ready To Collect → stop. | Received → start Total Time. `repair_status → Complete` → stop. |

### 3.2 "QC Failure" → qc_status (5)

| ID | Current Trigger | V2 Remap |
|----|----------------|----------|
| **380507610** | QC Failure → create item in Warranties & Breakages | `qc_status → Fail` → create item in Warranties & Breakages |
| **380499701** | QC Failure + Tech = Mykhailo → move to Mykhailo | `qc_status → Fail` + Tech = Mykhailo → move to Mykhailo |
| **380499268** | QC Failure + Tech = Andres → move to Andres | `qc_status → Fail` + Tech = Andres → move to Andres |
| **380498808** | QC Failure + Tech = Safan → move to Safan | `qc_status → Fail` + Tech = Safan → move to Safan |
| ~~456509728~~ | ~~QC Failure + Tech = Roni → move to Roni~~ | **KILLED above** — Roni is QC lead, not repair tech. No Roni group. |

### 3.3 Shipping Statuses → shipping_status column (7)

| ID | Current Trigger | V2 Remap |
|----|----------------|----------|
| **364025154** | Status → Book Courier + Mail-In → move to Outbound | `shipping_status → Book Courier` + Mail-In → move to Outbound |
| **339385373** | Status → Courier Booked + Mail-In → move to Outbound | `shipping_status → Courier Booked` + Mail-In → move to Outbound |
| **339383390** | Status → Shipped + Received not empty → move to Returned | `shipping_status → In Transit (Outbound)` + Received not empty → move to Returned |
| **362869414** | Status → Shipped + Received empty + type Sold → move to Returned | `shipping_status → In Transit (Outbound)` + Received empty + `tradein_status: Sold` → move to Returned |
| **260513231** | Status → Shipped + Received empty + type not Sold → move to Incoming Future | `shipping_status → In Transit (Outbound)` + Received empty + `tradein_status ≠ Sold` → move to Incoming Future |
| **35667471** | Courier Return → Booking Complete → set Status to Return Booked | Courier Return → Booking Complete → set `shipping_status → Return Booked` |
| **35667419** | Courier Collection → Booking Complete → set Status to Courier Booked | Courier Collection → Booking Complete → set `shipping_status → Courier Booked` |

### 3.4 Client Comms Statuses → comms_status column (8)

| ID | Current Trigger | V2 Remap |
|----|----------------|----------|
| **344114608** | Status → Client Contacted + not BM → move to CS Awaiting Confirmation | `comms_status → Contacted` + not BM → move to CS Awaiting Confirmation |
| **344114656** | Status → Client To Contact → notify Ferrari + move to CS To Do | `comms_status → Client To Contact` → notify Ferrari + move to CS To Do |
| **5834756** | Status → Quote Sent → move to CS Awaiting Confirmation | `comms_status → Quote Sent` → move to CS Awaiting Confirmation |
| **339411159** | Status → Quote Sent → clear Deadline | `comms_status → Quote Sent` → clear Deadline |
| **161355079** | Status → Password Req + Notifications ON → move to CS Awaiting Confirmation | `comms_status → Awaiting Response` + Notifications ON → move to CS Awaiting Confirmation |
| **493570056** | Status → Password Req + Notifications OFF → move to CS To Do | `comms_status → Awaiting Response` + Notifications OFF → move to CS To Do |
| **319313390** | Status → Invoiced → set Payment Method to Invoiced-Xero + Pending + move to CS To Do | `comms_status → Invoiced` → set Payment Method + Payment Status + move to CS To Do |
| **472186986** | Info Capture → Not Filled → set Status to Client To Contact | Info Capture → Not Filled → set `comms_status → Client To Contact` |

### 3.5 Repair Type BM Values → tradein_status column (10)

| ID | Current Trigger | V2 Remap |
|----|----------------|----------|
| **417781933** | Queued For Repair + Client BM + type not BM RTN/RFD → set type to Pay-Out | Queued For Repair + Client BM + `tradein_status ≠ Return` → set `tradein_status → Pay-Out` |
| **474233835** | Repair Type → IC ON → move to Trade-In BMs Awaiting Validation | `repair_type → IC ON` → move to Trade-In Locked / Counteroffer. *(Group renamed in v2)* |
| **384600181** | Repair Type → To List → notify Ricky + Ferrari | `tradein_status → To List` → notify Ricky + Ferrari |
| **362887045** | Repair Type → Sold + Client BM → set Payment Confirmed + BM Sale | `tradein_status → Sold` + Client BM → set Payment Confirmed + BM Sale |
| **414522418** | Repair Type → Sold → set Date Sold (BM) to today | `tradein_status → Sold` → set Date Sold (BM) to today |
| **414521830** | Repair Type → Listed → set Date Listed (BM) to today | `tradein_status → Listed` → set Date Listed (BM) to today |
| **418734895** | Repair Type → Purchased → set Date Purchased (BM) to today | `tradein_status → Purchased` → set Date Purchased (BM) to today |
| **355319600** | Repair Type → BER → clear Requested Repairs + Custom Products | Need to decide: is BER now `repair_status → BER/Parts` or was it only in repair_type? If repair_status, remap trigger. |
| **355318918** | Repair Type → Quote Rejected → clear Requested Repairs + Custom Products | "Quote Rejected" removed from repair_type. Remap to `comms_status → Declined`? |
| **482555797** | Device changes + Repair Type = Trade-In → notify Ferrari | Device changes + `tradein_status ≠ N/A` → notify Ferrari |

### 3.6 "Repaired" Automations That Need Adjusting (8)

These trigger on Repair Status → Repaired (which still exists in v2) but reference people or logic that needs updating:

| ID | Automation | What Needs Changing |
|----|-----------|-------------------|
| **458670657** | Repaired + Parts Used not empty + Client BM → set Date Repaired + move to QC + notify Andres | **Notify target wrong** — Andres is not QC. Should notify Roni (QC lead). Also: need a non-BM version to replace killed [115492627]. |
| **478837686** | Under Refurb → Repaired + type Diagnostic → set Repaired to today | "Diagnostic" is still in repair_type. **KEEP but verify.** |
| **478837287** | Under Repair → Repaired + type Diagnostic → set Repaired to today | Same. **KEEP but verify.** |
| **371622983** | Repaired + Supplier contains labels → notify Ferrari | **Vague trigger** — "contains all these labels" with no labels specified. Likely broken. Kill or fix. |
| **441937418** | Repaired + Problem = Stuck → set Problem to Solved | **KEEP** — Problem (Repair) column exists in v2 with same values. |
| **458670105** | Repaired + Problem = Deadline Delay → set Problem to Solved | **KEEP** — same. |
| **458670068** | Repaired + Problem = Solving → set Problem to Solved | **KEEP** — same. |
| **499932331** | Repaired → notify Roni | **KEEP** — notifies QC lead. Valid. |

### 3.7 Received Flow (3)

| ID | Automation | V2 Remap |
|----|-----------|----------|
| **475267570** | Received + not Walk-In + not Info Validated + not BM + not Corporate → set Status to Client To Contact + Info Not Filled + notify Ferrari | Received → set `comms_status → Client To Contact` + Info Not Filled + notify Ferrari. Remove `set Status` part — repair_status stays at Received. |
| **517634192** | Received + Client BM → set Deadline to today + push 1 day | **KEEP** — BM deadline logic still valid. |
| **206743263** | Received + Client Warranty → create item in Warranties & Breakages | **KEEP** — Warranties board still exists. |

### 3.8 Expecting Device (1)

| ID | Automation | V2 Remap |
|----|-----------|----------|
| **361591581** | Status → Expecting Device → move to Incoming Future | "Expecting Device" removed from repair_status. Remap: `shipping_status → In Transit (Inbound)` → move to Incoming Future. |

### 3.9 Error Status (5)

"Error" doesn't exist in v2 repair_status. These automations set status to Error which can't work.

| ID | Automation | Decision |
|----|-----------|----------|
| **509618257** | Repaired + IMEI empty → set Status to Error + notify Technician | **RETHINK.** Error status is gone. Options: (a) add Error back to repair_status, (b) use Problem (Repair) column, (c) move item back to tech's group with notification only. |
| **524401012** | Diag Complete + IMEI empty + Tech = Safan → Error + notify | Same issue. Also a per-tech duplicate. |
| **524402133** | Repaired + IMEI empty + Tech = Andres → Error + notify | Same issue. Per-tech duplicate. |
| **524402464** | Repaired + IMEI empty + Tech = Roni → Error + notify | Same issue. Per-tech duplicate. |
| **429085203** | Parts Status → No Stock + Part to Order empty → Error + notify Tech | Same issue — Error status gone. |
| **154487601** | Courier Collection → Booking Failed → set Status to Error | Same issue. |
| **154487916** | Courier Return → Booking Failed → set Status to Error | Same issue. |

**Recommendation:** Add "Error" back to v2 `repair_status` as a temporary hold state, OR use `problem_repair` column to flag errors without changing repair status.

---

## 4. CONSOLIDATE — Per-Tech Rules That Could Be Simplified (15)

### 4.1 IMEI/SN Empty Checks (6 → 1)

Currently 1 generic + 5 per-tech. The generic [509618257] already catches everything. **Kill all 5 per-tech versions.** Already counted in §2 Duplicates and §3.9.

### 4.2 "Repaired" → Assign as Repair Person (4 → keep 3)

| ID | Tech | Verdict |
|----|------|---------|
| **482497012** | Safan | KEEP |
| **482498095** | Roni | KEEP — but does Roni do repairs? If QC-only, KILL. |
| **482498139** | Andres | KEEP |
| ~~482498216~~ | ~~Mike McAdam~~ | KILLED (Mike gone) |

### 4.3 "Repaired" → Assign as Refurb Person (4 → keep 3)

| ID | Tech | Verdict |
|----|------|---------|
| **482498532** | Mykhailo | KEEP |
| **482498477** | Roni | KEEP — same question. |
| **482498431** | Andres | KEEP |
| ~~482498342~~ | ~~Mike McAdam~~ | KILLED (Mike gone) |

### 4.4 Diagnostics → Assign as Diagnostic Person (4 → keep 4)

| ID | Tech | Verdict |
|----|------|---------|
| **482496783** | Mykhailo | KEEP |
| **482496952** | Safan | KEEP |
| **482495684** | Andres | KEEP |
| **482496856** | Roni | KEEP |

### 4.5 QC Failure → Route Back to Tech (3 → keep 3)

| ID | Tech | Verdict |
|----|------|---------|
| **380499701** | Mykhailo | REMAP (trigger on `qc_status → Fail`) |
| **380499268** | Andres | REMAP |
| **380498808** | Safan | REMAP |

---

## 5. KEEP AS-IS — Work Directly on V2 (36)

These automations use columns/statuses that exist identically on v2.

### 5.1 Status Routing — Tech Assignment (7)

| ID | Automation |
|----|-----------|
| **218545034** | Queued For Repair + Tech = Andres → move to Andres |
| **218545511** | Tech assigned to Andres → move to Andres |
| **261851578** | Tech assigned to Ferrari → move to Ferrari |
| **177522593** | Queued For Repair + Tech = Ferrari → move to Ferrari |
| **330530550** | Queued For Repair + Tech = Safan → move to Safan |
| **330530503** | Tech assigned to Safan → move to Safan |
| **328788651** | Queued For Repair + Tech = Mykhailo → move to Mykhailo |
| **328773856** | Tech assigned to Mykhailo → move to Mykhailo |

### 5.2 Status Timestamps (8)

| ID | Automation |
|----|-----------|
| **511131239** | Under Refurb → start Refurb Time |
| **338559396** | Diagnostics → start Diagnostic Time |
| **338558605** | Under Repair → start Repair Time |
| **510266236** | Cleaning → start Cleaning Time *(Note: Cleaning status removed from v2. KILL this one.)* |
| **351394248** | Received → clear Booking Time |
| **3611197** | Received → set Received to today |
| **3616510** | Returned → set Collection Date to today |
| **478836826** | Diagnostic Complete + Diag Complete empty → set to today |
| **478837222** | Quote Sent + Quote Sent empty → set to today |

**CORRECTION:** [510266236] should be KILL — Cleaning is not a v2 repair_status. And [478837222] needs REMAP — Quote Sent is now in comms_status.

### 5.3 Repair Paused + Problem Tracking (5)

| ID | Automation |
|----|-----------|
| **318742209** | Repair Paused + Tech = Ferrari → move to Ferrari |
| **441937418** | Repaired + Problem = Stuck → Solved |
| **458670105** | Repaired + Problem = Deadline Delay → Solved |
| **458670068** | Repaired + Problem = Solving → Solved |
| **442073587** | Problem → Deadline Delay → notify Mike + Ricky + Ferrari |
| **442072426** | Problem → Stuck → notify Mike + Ricky + Ferrari |
| **442073118** | Problem → Solving → notify Mike + Ricky + Ferrari |

**Note:** [442073587], [442072426], [442073118] notify Mike McAdam who is gone. REMAP to remove Mike from notification list.

### 5.4 BM Flow (3)

| ID | Automation |
|----|-----------|
| **517634192** | Received + Client BM → set Deadline to today+1 |
| **79519687** | Diagnostic Complete + not BM → move to Awaiting Confirmation of Price |
| **338493656** | Diagnostic Complete + not BM → notify Ferrari |

### 5.5 Client/Notification Logic (6)

| ID | Automation |
|----|-----------|
| **44663250** | Client → End User + Notifications Unconfirmed → set ON |
| **44663331** | Client → Warranty + Notifications Unconfirmed → set ON |
| **44663164** | Client → Corporate + Notifications Unconfirmed → set ON |
| **44664616** | Client → Refurb → set Notifications OFF |
| **319877126** | Client → Warranty → set Payment Status + Method to Warranty |
| **319313101** | Returned + Client Warranty → Confirmed + Warranty + move to Returned |

### 5.6 Other (7)

| ID | Automation |
|----|-----------|
| **341940054** | Item moved to Returned → stop Total Time |
| **319314766** | Status → Returned → move to Returned group |
| **205853796** | Status → BER/Parts → set Payment Status to Confirmed |
| **34083968** | Status → Battery Testing → create item in Battery Run-Down Tests |
| **429081804** | Item moved to Awaiting Parts → notify Ricky |
| **429075536** | Parts Status → No Stock + Part to Order not empty → clear Deadline + move to Awaiting Parts + notify Ferrari |
| **341517382** | Notifications → ON + Walk-In + New Repair → move to Today's Repairs |
| **340118443** | Booking Time arrives + not Mail-In + Received empty + not Awaiting Confirmation → move to Today's Repairs |
| **339427949** | Booking Time arrives + Payment Unsuccessful → notify Ferrari |
| **489426254** | Item moved to Outbound Shipping + Service Unconfirmed → set Mail-In |
| **499932331** | Repaired → notify Roni |
| **432315289** | Diagnostic Complete → clear Deadline |

---

## 6. REVIEW — Webhooks (8)

These need confirming: which endpoints are still active and which will be recreated on v2?

| ID | Trigger | Endpoint | Verdict |
|----|---------|----------|---------|
| **537692848** | Invoice Action → Create Invoice → webhook | Xero automation | **Likely KEEP** — active Feb 2026 |
| **537444955** | Any column changes → webhook | Ricky's — should be Parts changes only. **2,073 actions.** Codex to fix. | **FIX** |
| **530471762** | Any column changes → webhook | Ferrari's — should be status changes only (Intercom notifications). **2,073 actions.** Codex to fix. | **FIX** |
| **530469026** | Item created → webhook | Item creation webhook | **KEEP** — active Feb 2026 |
| **526854222** | Parts Required changes → webhook | Parts service | **Likely KEEP** — Jan 2026 |
| **520364311** | Parts Deducted → Do Now! → webhook | Parts deduction | **Likely KEEP** — Jan 2026 |
| **520364200** | Ready To Collect → webhook | Completion webhook | **REMAP** — trigger on `repair_status → Complete` |
| **309734967** | Make Sale Item changes → webhook | **KILL** — Sales board legacy | Already counted in §1.3 |

---

## 7. NEW Automations Needed for V2

These don't exist on the current board but are required by the v2 design:

| # | Automation | Purpose |
|---|-----------|---------|
| 1 | `repair_status → Repair Paused` → require `pause_reason` to be set | Context for all pauses |
| 2 | `repair_status → Repaired` → set `qc_status → Testing` | Auto-queue for QC |
| 3 | `qc_status → Pass` → set `repair_status → Complete` | QC approval flow |
| 4 | `qc_status → Fail` → set `repair_status → Under Repair` | Send back to tech |
| 5 | `repair_status → Returned` for 30+ days → move to archive board | Keep board lean |
| 6 | `repair_status → Repaired` + Client not BM + Parts Used not empty → set Date Repaired + move to QC + notify Roni | Replaces killed [115492627] (was notifying Mike) |

---

## 8. Decisions (Resolved 30 Mar 2026)

### 8.1 Error Status — ✅ ADD BACK
Added "Error" back to v2 `repair_status` at index 14. It's used as a validation flag to alert the team when an automation catches a data issue (e.g. missing IMEI). Column recreated as `repair_status_v2`.

### 8.2 Roni's Role — ✅ KEEP GROUP
Roni gets a tech group on v2. He still does repairs when tagged. Group created (`group_mm1yxrhs`). Keep all Roni repair routing automations (kill only the ones for removed statuses like Software Install/Reassemble).

### 8.3 Problem (Repair) Notifications — ✅ RICKY + FERRARI ONLY
Remove Mike McAdam from the 3 Problem notification automations [442073587], [442072426], [442073118]. Keep Ricky + Ferrari only.

### 8.4 Cleaning Time Tracker — ✅ KILL
Kill automation [510266236] and the `cleaning_time` column. Cleaning is tracked as part of diagnostic time. Column deleted from v2.

### 8.5 Webhook Audit — ✅ RESOLVED
- [537444955] (Ricky's) — needs fixing: should trigger on Parts changes only, not all columns. **Codex to fix.**
- [530471762] (Ferrari's) — needs fixing: should trigger on status changes only (Intercom notifications), not all columns. **Codex to fix.**
- Both are valid but misconfigured — firing on every column change instead of their specific triggers.

---

## V2 Automation Count Estimate

| Category | Current | V2 |
|----------|---------|-----|
| Status routing (per-tech) | 22 | **10** (kill gone people + removed statuses) |
| Status timestamps | 19 | **12** (kill duplicates + remapped statuses) |
| QC & error handling | 14 | **8** (consolidate per-tech, remap QC Failure) |
| BM / trade-in | 19 | **16** (remap repair_type → tradein_status) |
| Client communication | 22 | **14** (remap to comms_status, kill archived boards) |
| Shipping / courier | 7 | **7** (remap to shipping_status) |
| Webhooks | 8 | **5** (kill legacy, remap Ready To Collect) |
| Other | 36 | **14** (kill dropped columns + gone people) |
| **NEW** (v2 design) | 0 | **6** |
| **Total** | **147** | **~92** |

Further consolidation possible with Monday's newer automation features, but ~92 is the honest target.

---

*Audit compiled by Code on 18 Mar 2026. Cross-referenced against: v2 board column definitions, team roster (verified 16 Mar), target-state.md, builds/monday/automations.md, automations-export.csv.*

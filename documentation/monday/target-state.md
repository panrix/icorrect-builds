# Monday Main Board — Target State Design

**Board:** iCorrect Main Board (349212843)
**Date:** 23 Feb 2026
**Status:** IN PROGRESS — Ricky decisions captured, some items pending
**Source:** Ricky + Code design session (23 Feb), board-schema.md, repair-flow-traces.md

---

## Design Principles

1. **Process-first** — map clean workflows, then design structure to support them
2. **Role-based** — each person sees only the statuses/columns relevant to their daily work
3. **Separate concerns** — repair status, QC, comms, shipping, and trade-in are different things tracked in different columns
4. **Context over mystery** — when something is paused, say WHY (Pause Reason column)
5. **Clean before build** — get Monday right before building Supabase/intake/automation on top

---

## 1. Column Strategy (6 Status Columns)

### Current Problem
One `status4` column with 39 values tracking 5 different concerns: repair flow, customer comms, QC, shipping, and BM trade-in. Everyone sees all 39 in dropdown when they only need 5-10 for their work.

### Target: 6 Separate Status Columns

#### 1.1 Repair Status (Main) — replaces `status4`

The core repair journey. Slimmed from 39 to ~15 values.

| Status | Type | Description |
|--------|------|-------------|
| New Repair | Entry | Just created, not yet received |
| Booking Confirmed | Entry | Customer confirmed, waiting to arrive |
| Received | Entry | Device physically in shop |
| Queued For Repair | Queue | Waiting for tech assignment |
| Diagnostics | Active | Initial diagnosis in progress |
| Diagnostic Complete | Milestone | Diag done, needs quote/decision |
| Under Repair | Active | Tech actively repairing |
| Under Refurb | Active | Screen/refurb portion of repair (separate from repair work) |
| Battery Testing | Active | Battery cycle testing (time-gated) |
| Repair Paused | Hold | Work stopped — see Pause Reason column for why |
| Repaired | Milestone | Repair complete, awaiting QC |
| Ready To Collect | End | QC passed, customer notified |
| Returned | End | Device back with customer |
| BER/Parts | End | Beyond Economic Repair — dead end |

**Removed from this column (moved to dedicated columns):**
- All customer comms statuses → Comms Status column
- All courier/shipping statuses → Shipping Status column
- All BM trade-in statuses → Trade-in Status column
- QC Failure → QC Status column
- Cleaning → part of the QC/diagnostic process, tracked as sub-step

**Ricky decision:** Keep both "Under Repair" and "Under Refurb" — refurb is the screen part of the repair, repair is the repair itself. They are distinct activities.

**Key insight from flow traces:** "Diagnostics" appears twice in many flows — once for initial diagnosis, and again after repair as a post-repair QC verification step. The second occurrence is actually QC, not diagnostics. The new QC Status column handles this.

#### 1.2 QC Status (NEW COLUMN)

**Ricky decision:** Separate QC Status column. Currently QC outcome is invisible — items that pass just move forward, only "QC Failure" exists in main status.

| Status | Description |
|--------|-------------|
| In Review | Roni actively checking the repair |
| Pass | QC approved — ready for customer |
| Fail | QC rejected — back to tech with notes |

**Who uses this:** Roni (primary), techs (see their failures), Ferrari (completion tracking)

**Current gap this fixes:** When "Diagnostics" appears after "Repaired" in flow traces, that's actually QC verification. With a dedicated column, the main status stays at "Repaired" while QC Status shows "In Review" → "Pass" or "Fail".

#### 1.3 Comms Status (NEW COLUMN)

**Ricky decision:** Separate Comms Status column. Customer communication is a parallel track, not part of the repair journey.

| Status | Description |
|--------|-------------|
| Client To Contact | Need to reach out (diagnosis result, quote, update) |
| Contacted | Message/call sent, no response yet |
| Awaiting Response | Follow-up sent, waiting on customer |
| Quote Sent | Formal quote delivered |
| Confirmed | Customer approved the work/quote |
| Declined | Customer declined — either collect device or BER |

**Who uses this:** Ferrari (primary — manages all client communication), techs (trigger "Client To Contact" when they need customer input)

**Current gap this fixes:** "Client Contacted" is the most common resting state (124 items) in the current main status. Items sit there blocking the repair flow view. With a separate column, the repair status can stay at "Repair Paused" or "Diagnostic Complete" while comms tracks the conversation separately.

#### 1.4 Trade-in Status (FIX EXISTING COLUMN)

Column already exists (`color_mkypbg6z`) but migration stalled — 75.6% of items have no value set. Only "Trade-in" is being used. The BM lifecycle (Listed, Sold, Pay-Out) is still tracked in Repair Type column.

| Status | Description |
|--------|-------------|
| Trade-in | Tagged as BM trade-in |
| Received | Device received from customer |
| Graded | Reported vs actual comparison complete |
| Listed | Posted on Back Market |
| Sold | Sold on BM |
| Pay-Out | Payment processed |
| Counter | Counteroffer in progress |
| Return | BM return/refund |
| Cancelled | Trade-in cancelled |
| N/A | Not a trade-in item |

**Migration needed:** Move all BM lifecycle values out of Repair Type column into this column. Repair Type should only contain repair types (Diagnostic, Repair, Board Level, etc.).

#### 1.5 Pause Reason (NEW COLUMN)

**Ricky decision:** Need context for WHY repairs are paused. Currently "Repair Paused" gives zero information — could be parts, customer, tech issue, anything.

| Reason | Description |
|--------|-------------|
| Awaiting Parts | Part ordered, waiting for delivery |
| Awaiting Customer | Need customer decision/info/password |
| Technical Issue | Complex repair needs research/specialist |
| iCloud Lock | Device locked, waiting for customer to remove |
| Requires Specialist | Beyond current tech's capability |
| Other | Free-text context needed |

**Workflow:** When a tech sets Repair Status to "Repair Paused", they must also set the Pause Reason. Monday automation can enforce this (conditional required field).

**Who uses this:** Techs (set the reason), Ferrari (sees at a glance why things are stuck), Ricky (spot patterns — if 50% of pauses are "Awaiting Parts", that's a supply chain problem).

#### 1.6 Shipping Status (NEW COLUMN)

**Ricky decision:** Separate Shipping Status column for courier logistics. Currently courier statuses (Book Courier, Courier Booked, Return Booked, To Ship, Shipped) live in the main repair status, which makes no sense for walk-in repairs.

| Status | Description |
|--------|-------------|
| N/A | Walk-in — no shipping needed |
| Book Courier | Inbound courier needs booking |
| Courier Booked | Inbound pickup scheduled |
| In Transit (Inbound) | Device on its way to shop |
| Received | Device arrived at shop |
| Book Return | Return courier needs booking |
| Return Booked | Return pickup scheduled |
| In Transit (Outbound) | Device on its way back to customer |
| Delivered | Tracking confirms delivery |

**Who uses this:** Ferrari (manages courier bookings), operations (mail-in flow tracking)

**Current gap this fixes:** Mail-in flow traces show shipping statuses mixed into the repair journey (e.g., "New Repair → Book Courier → Courier Booked → To Ship → Shipped → Expecting Device"). These are logistics, not repair stages.

---

## 2. Clean Workflows (Target State)

### 2.1 Walk-in Repair (Happy Path)

```
ENTRY:         New Repair → Booking Confirmed → Received
DIAGNOSIS:     Queued For Repair → Diagnostics → Diagnostic Complete
QUOTE:         [Comms: Client To Contact → Quote Sent → Confirmed]
REPAIR:        Queued For Repair → Under Repair → Repaired
               (if screen work: Under Refurb → Repaired)
QC:            [QC: In Review → Pass]
COMPLETION:    Ready To Collect → Returned
```

**Shipping Status:** N/A (walk-in)
**Pause path:** Repair Status → "Repair Paused" + Pause Reason set
**QC fail path:** QC Status → "Fail" → Repair Status back to "Under Repair" → Repaired → QC again

### 2.2 Walk-in Diagnostic (Happy Path)

```
ENTRY:         New Repair → Booking Confirmed → Received
DIAGNOSIS:     Queued For Repair → Diagnostics → Diagnostic Complete
QUOTE:         [Comms: Client To Contact → Quote Sent → Confirmed]
BILLING:       (Invoiced via Xero integration)
REPAIR:        Queued For Repair → Under Repair → Repaired
QC:            [QC: In Review → Pass]
COMPLETION:    Ready To Collect → Returned
```

**Difference from repair:** Diagnostic flow always has a quote/approval step. Repair flow may skip it if pre-quoted.

### 2.3 Mail-in Repair (Happy Path)

```
LOGISTICS IN:  [Shipping: Book Courier → Courier Booked → In Transit → Received]
ENTRY:         New Repair → Received
DIAGNOSIS:     Queued For Repair → Diagnostics → Diagnostic Complete
QUOTE:         [Comms: Client To Contact → Quote Sent → Confirmed]
REPAIR:        Queued For Repair → Under Repair → Repaired
               (if screen work: Under Refurb → Repaired)
QC:            [QC: In Review → Pass]
LOGISTICS OUT: [Shipping: Book Return → Return Booked → In Transit → Delivered]
COMPLETION:    Returned
```

**Shipping Status:** Active throughout
**Repair Status + Shipping Status tracked in parallel, not sequentially**

### 2.4 BM Trade-in (Happy Path)

```
LOGISTICS IN:  [Shipping: In Transit → Received]  (BM ships to us)
ENTRY:         Received
DIAGNOSIS:     Diagnostics → Diagnostic Complete
               [Trade-in: Trade-in → Graded]   (reported vs actual comparison)
REPAIR:        Queued For Repair → Under Refurb → Repaired
QC:            [QC: In Review → Pass]
LISTING:       [Trade-in: Graded → Listed → Sold → Pay-Out]
COMPLETION:    Ready To Collect (ready to ship to buyer)
```

**Key difference:** No customer communication loop. BM trade-ins follow a standard grading + refurb path.
**BM discrepancy data:** Flow traces show 60-100% mismatch rate on casing (reported vs actual). This is expected — BM's customer self-grading is unreliable.

### 2.5 Corporate Repair (Happy Path)

Same as walk-in repair/diagnostic but:
- Client column = "Corporate"
- May have bulk items (multiple devices same company)
- Different notification/billing flow
- Often mail-in logistics too

```
Same workflow as walk-in or mail-in depending on delivery method.
Corporate flag is a filter, not a separate flow.
```

---

## 3. Group Structure (Target State)

### Current: 33 groups
### Target: ~17 groups (delete 6, merge 3 sets, keep 14, add 1)

### 3.1 Groups to DELETE (empty or unused)

| Group | Reason | Action |
|-------|--------|--------|
| Adil | Never used (0-1 items) | Delete |
| Zara iPods | Legacy, not used in years | Archive items → delete group |
| Completed Refurbs | Dead (0-1 items) | Delete |
| Selling | Dead (0-1 items) | Delete |
| New Orders (Not Confirmed) | Not used (0-1 items) | Delete |
| Purchased/Refurb Devices | Not used anymore | Move remaining items → delete |

### 3.2 Groups to MERGE

| Current Groups | Target Group | Notes |
|---------------|-------------|-------|
| Devices In Hole + Devices Left in Long Term + Recycle List | **Dead / Uncollected** | One group for all physically stored dead devices |
| BMs No Repair / iCloud + Locked | **BM Dead / iCloud** | One group for unrepairable BM + iCloud locked |
| Leads to Chase + Cancelled/Missed Bookings | **Follow Up Required** | One group with future automation for follow-ups |

### 3.3 Groups to KEEP (with notes)

| Group | Keep? | Notes |
|-------|-------|-------|
| **New Orders** | YES | Entry point — Shopify/Typeform creates items here |
| **Today's Repairs** | YES | Daily active work queue |
| **Incoming Future** | YES | Booked but device not yet arrived |
| **Safan (Short Deadline)** | YES | Saf's urgent repairs |
| **Andres** | YES | Andres's assigned repairs |
| **Mykhailo** | YES | Mykhailo's assigned repairs |
| **Ferrari** | YES | Ferrari's task queue — see view notes below |
| **Quality Control** | YES | Roni's QC review queue |
| **Awaiting Parts** | YES | Repairs paused for parts |
| **Awaiting Collection** | YES | Repaired, waiting for pickup |
| **Outbound Shipping** | YES | Mail-in returns to ship |
| **Awaiting Confirmation of Price** | YES | Quote sent, waiting for approval |
| **Client Services - To Do** | YES | Ferrari's customer follow-ups |
| **Client Services - Awaiting Confirmation** | YES | Waiting on customer response |
| **BMs Awaiting Sale** | YES | Refurbed BM devices ready to list |
| **Trade-In BMs Awaiting Validation** | YES | BM trade-ins being graded |
| **Returned** | YES | But with 30-day auto-archive (see below) |

### 3.4 Special Decisions

**Safan Long Deadline:**
- **Ricky decision:** Kill the group. But Ricky needs to manually go through the items first and decide what to do with each one.
- **Action:** Ricky reviews items → reassign to active groups or archive → delete group.

**Ricky (group):**
- **Listed as dead/unused.** Delete after confirming no items need saving.

**Ferrari's View:**
- **Ricky decision:** Ferrari should always view his group — that's what he needs to action. But he also needs a different view that shows him a broader picture.
- **Target:** Create a **Monday dashboard view for Ferrari** that shows:
  - His group (primary action queue)
  - Client Services groups (comms follow-ups)
  - Comms Status column filtered to items needing attention
  - Awaiting Collection (things to coordinate)
- Ferrari's dropdown only shows statuses relevant to his role (via filtered views)

**Returned Group — 30-Day Auto-Archive:**
- **Ricky decision:** Move items to archive after 30 days in Returned status.
- **Implementation:** Monday automation or cron script:
  - When Repair Status = "Returned" for 30+ days → move to archive board
  - Archive board preserves full history for reference
  - Keeps active board lean (~100-200 items vs 4,122)

---

## 4. Role-Based Views (Target State)

### PENDING — Needs Ricky Input

Define what each role sees in their daily Monday view:

| Role | Person(s) | Primary Group(s) | Key Columns | Status Dropdown |
|------|-----------|-------------------|-------------|-----------------|
| **Front Desk** | Ferrari | Ferrari, Client Services, New Orders | Repair Status, Comms Status, Shipping Status | *TBD — needs Ricky* |
| **Tech** | Saf, Andres, Mykhailo | Their personal group, Awaiting Parts | Repair Status, Pause Reason, QC Status | *TBD — needs Ricky* |
| **QC** | Roni | Quality Control | QC Status, Repair Status | *TBD — needs Ricky* |
| **BM Operations** | TBD | BMs Awaiting Sale, Trade-In Validation | Trade-in Status, QC Status, BM grading columns | *TBD — needs Ricky* |
| **Management** | Ricky | All groups (dashboard view) | All columns, KPI formulas | Full access |

**Monday supports this via:**
- Board views (filtered column sets per saved view)
- Column permissions (restrict who can edit which columns)
- Conditional status dropdowns are NOT natively supported — but filtered views limit what people see

---

## 5. Repair Type Column Cleanup

### Current Problem
`status24` (Repair Type) has 25 values mixing:
- Actual repair types (Diagnostic, Repair, Board Level)
- BM lifecycle stages (Listed, Sold, Pay-Out) — should be in Trade-in Status
- Outcomes (BER, Unrepairable, Quote Rejected) — should be in Repair Status end states

### Target: Repair Type = Type of Work Only

| Value | Keep? | Notes |
|-------|-------|-------|
| Diagnostic | YES | |
| Repair | YES | |
| Board Level | YES | |
| Manual | YES | |
| Parts | YES | Parts-only job |
| Trade-In | MOVE → Trade-in Status | |
| Purchased | MOVE → Trade-in Status | |
| Pay-Out | MOVE → Trade-in Status | |
| Listed | MOVE → Trade-in Status | |
| Sold | MOVE → Trade-in Status | |
| To List | MOVE → Trade-in Status | |
| Unlisted | MOVE → Trade-in Status | |
| BM RTN/RFD | MOVE → Trade-in Status | |
| Counteroffer | MOVE → Trade-in Status | |
| BER | MOVE → Repair Status (BER/Parts) | Already exists there |
| Unrepairable | MOVE → Repair Status (BER/Parts) | |
| No Fault Found | MOVE → Repair Status end state | |
| Quote Rejected | MOVE → Comms Status (Declined) | |
| IC ON / IC OFF | KEEP or MOVE → iCloud status | |
| Unconfirmed | KEEP | Pre-triage |
| Task | REMOVE | Not a repair type |
| Booking Cancelled | REMOVE | Not a repair type |
| Warranty | DEACTIVATED | Already inactive |

---

## 6. Automation Requirements

### New Automations Needed

| Trigger | Action | Purpose |
|---------|--------|---------|
| Repair Status → "Repair Paused" | Require Pause Reason to be set | Context for all pauses |
| Repair Status → "Repaired" | Set QC Status → "In Review" | Auto-queue for Roni |
| QC Status → "Pass" | Set Repair Status → "Ready To Collect" | Move to completion |
| QC Status → "Fail" | Set Repair Status → "Under Repair" | Send back to tech |
| Returned for 30+ days | Move to archive board | Keep board lean |
| Booking date = today | Move to Today's Repairs group | Existing automation, verify still works |

### Existing Automations to Document
**UNKNOWN — need Systems agent to extract all active Monday automations.**
This is a prerequisite before changing any statuses, as automations reference specific status values.

---

## 7. Migration Sequence (Proposed)

**Must happen in order — each step depends on the previous.**

### Phase 1: Document Existing Automations
- Extract all Monday native automations (triggers, actions, referenced statuses)
- Document in `builds/documentation/monday/automations.md`
- **Why first:** Changing statuses will break automations if we don't know what they reference

### Phase 2: Create New Columns
- Create QC Status column (status type, 3 values)
- Create Comms Status column (status type, 6 values)
- Create Pause Reason column (status type, 6 values)
- Create Shipping Status column (status type, 9 values)
- **No data migration yet** — just column creation

### Phase 3: Archive Dead Weight
- Script to identify items not updated in 90+ days
- Create "iCorrect Archive" board
- Move dead items (target: 4,122 → ~200 active)
- Move Returned items older than 30 days
- **Why before group cleanup:** Fewer items = safer group operations

### Phase 4: Group Cleanup
- Ricky reviews Safan Long Deadline items
- Delete empty groups (Adil, Zara iPods, Completed Refurbs, Selling, etc.)
- Execute merges (Dead/Uncollected, BM Dead/iCloud, Follow Up Required)
- Verify no automation references deleted groups

### Phase 5: Status Migration
- Populate new columns from existing data:
  - Parse current `status4` values → set corresponding Comms/QC/Shipping Status
  - Parse current `status24` BM values → set Trade-in Status
- Update automations to use new columns
- Test with 5-10 items before bulk migration

### Phase 6: Status Cleanup
- Remove migrated values from `status4` (comms, shipping, QC values)
- Remove migrated values from `status24` (BM lifecycle, outcomes)
- Slim `status4` to ~15 repair-only values
- **Point of no return** — automations must be updated first

### Phase 7: Views & Training
- Create role-based views (Ferrari, Techs, QC, BM, Management)
- Create Ferrari's dashboard view
- Record short training videos for each role
- 1-week parallel run (old views accessible, new views as default)

---

## 8. Testing Strategy

### Before Each Phase
- Snapshot current board state (item count per group, status distribution)
- Test on 5-10 items manually before scripting bulk changes
- Verify all Monday automations still fire correctly

### Rollback Plan
- Archive board preserves all moved items (Phase 3 is reversible)
- New columns can be hidden without deletion (Phase 2 is reversible)
- Status values can be re-added (Phase 6 is the hard point of no return)
- **Key risk:** Phase 6 (removing old status values) — must verify automations work with new columns first

### Validation Criteria
- [ ] All 8 flow types (from flow traces) can be completed with new status structure
- [ ] Ferrari can manage his daily workflow with new views
- [ ] Techs see only repair-relevant statuses in dropdown
- [ ] Roni has a clear QC queue with pass/fail tracking
- [ ] BM trade-ins tracked end-to-end in Trade-in Status
- [ ] All paused repairs have a Pause Reason set
- [ ] Mail-in shipping tracked separately from repair status
- [ ] Active item count < 250 after archive phase

---

## 9. Open Items (Needs Ricky)

| # | Decision Needed | Context |
|---|----------------|---------|
| 1 | **Role-based status dropdowns** — which statuses does each role see? | Monday can filter views but not dropdown options natively. May need workaround. |
| 2 | **Ferrari's expanded view** — what specifically should he see beyond his group? | He said "there is a different view we make" — needs definition. |
| 3 | **Safan Long Deadline items** — Ricky to go through and decide fate of each | Blocked on Ricky manual review. |
| 4 | **Roni's QC workflow detail** — does she need sub-grades per component on QC fail? | Current QC columns have pre-grades but no post-QC result breakdown. |
| 5 | **Monday automations extraction** — need Systems agent to pull these before any changes | Blocked on automation documentation. |
| 6 | **BM operations owner** — who manages BM groups day-to-day? | Determines whose view to design. |
| 7 | **Comms Status: who sets "Contacted"?** — Ferrari manually, or automation when email sent? | Affects automation design. |
| 8 | **iCloud Lock handling** — keep IC ON/IC OFF in Repair Type, or move to Pause Reason? | Currently in Repair Type column. |

---

## 10. Files Referenced

| File | Content |
|------|---------|
| `builds/documentation/monday/board-schema.md` | Full 170-column, 33-group, 39-status schema |
| `builds/documentation/monday/repair-flow-traces.md` | 80 items traced across 8 flow types |
| `builds/documentation/monday/cleanup-brief.md` | Jarvis's cleanup problem statement |
| `builds/documentation/monday/QUERY-SPEC.md` | Query spec for flow trace generation |
| `builds/documentation/monday/automations.md` | **TO CREATE** — Monday native automations |

---

*This document captures all decisions from the Ricky + Code design session on 23 Feb 2026. It is a working document — open items in Section 9 need resolution before implementation begins.*

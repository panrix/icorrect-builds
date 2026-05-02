# Monday Main Board — Target State Design

**Board:** iCorrect Main Board (349212843)
**Date:** 23 Feb 2026 (updated 24 Feb — team standup corrections)
**Status:** IN PROGRESS — All open items resolved 25 Feb. Column audit is next blocker.
**Source:** Ricky + Code design session (23 Feb), team standup (24 Feb), board-schema.md, repair-flow-traces.md

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
| Complete | End | QC passed, ready for collection or shipping |
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
| Testing | Roni actively checking the repair |
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
| Quote Accepted | Customer approved the quote |
| Invoiced | Invoice sent to customer |
| Confirmed | Customer confirmed and payment arranged |
| Declined | Customer declined — either collect device or BER |

**Who uses this:** Ferrari (primary — manages all client communication), techs (trigger "Client To Contact" when they need customer input)

**Current gap this fixes:** "Client Contacted" is the most common resting state (124 items) in the current main status. Items sit there blocking the repair flow view. With a separate column, the repair status can stay at "Repair Paused" or "Diagnostic Complete" while comms tracks the conversation separately.

#### 1.4 Trade-in Status (FIX EXISTING COLUMN)

Column already exists (`color_mkypbg6z`) but migration stalled — 75.6% of items have no value set. Only "Trade-in" is being used. The BM lifecycle (Listed, Sold, Pay-Out) is still tracked in Repair Type column.

| Status | Description |
|--------|-------------|
| Trade-in | Tagged as BM trade-in |
| Received | Device received from customer |
| Intake | Grading/assessment during intake process |
| Pay-Out | Payment processed to seller |
| Purchased | Device purchased — now ours |
| To List | Ready to be listed on BM |
| Listed | Posted on Back Market |
| Sold | Sold on BM |
| Counter | Counteroffer in progress |
| Return | BM return/refund |
| Cancelled | Trade-in cancelled |
| N/A | Not a trade-in item |

**Updated 24 Feb:** "Graded" removed as a separate status — grading happens during intake, not as a standalone step. "Purchased" added between Pay-Out and To List to track ownership transfer.

**Migration needed:** Move all BM lifecycle values out of Repair Type column into this column. Repair Type should only contain repair types (Diagnostic, Repair, Board Level, etc.).

#### 1.5 Pause Reason (NEW COLUMN)

**Ricky decision:** Need context for WHY repairs are paused. Currently "Repair Paused" gives zero information — could be parts, customer, tech issue, anything.

| Reason | Description |
|--------|-------------|
| Awaiting Parts | Part ordered, waiting for delivery |
| Awaiting Customer | Need customer decision/info/password |
| Technical Issue | Complex repair needs research/specialist |
| iCloud Lock | Device locked, waiting for customer/seller to remove |
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
QUOTE:         [Comms: Client To Contact → Quote Sent → Quote Accepted → Invoiced → Confirmed]
REPAIR:        Queued For Repair → Under Repair → Repaired
               (if screen work: Under Refurb → Repaired)
QC:            [QC: Testing → Pass]
COMPLETION:    Complete → Returned
```

**Shipping Status:** N/A (walk-in)
**Pause path:** Repair Status → "Repair Paused" + Pause Reason set
**QC fail path:** QC Status → "Fail" → Repair Status back to "Under Repair" → Repaired → QC again

### 2.2 Walk-in Diagnostic (Happy Path)

```
ENTRY:         New Repair → Booking Confirmed → Received
DIAGNOSIS:     Queued For Repair → Diagnostics → Diagnostic Complete
QUOTE:         [Comms: Client To Contact → Quote Sent → Quote Accepted → Invoiced → Confirmed]
REPAIR:        Queued For Repair → Under Repair → Repaired
QC:            [QC: Testing → Pass]
COMPLETION:    Complete → Returned
```

**Difference from repair:** Diagnostic flow always has a quote/approval step. Repair flow may skip it if pre-quoted.

### 2.3 Mail-in Repair (Happy Path)

```
LOGISTICS IN:  [Shipping: Book Courier → Courier Booked → In Transit → Received]
ENTRY:         New Repair → Received
DIAGNOSIS:     Queued For Repair → Diagnostics → Diagnostic Complete
QUOTE:         [Comms: Client To Contact → Quote Sent → Quote Accepted → Invoiced → Confirmed]
REPAIR:        Queued For Repair → Under Repair → Repaired
               (if screen work: Under Refurb → Repaired)
QC:            [QC: Testing → Pass]
LOGISTICS OUT: [Shipping: Book Return → Return Booked → In Transit → Delivered]
COMPLETION:    Complete → Returned
```

**Shipping Status:** Active throughout
**Repair Status + Shipping Status tracked in parallel, not sequentially**

### 2.4 BM Trade-in (Happy Path)

```
LOGISTICS IN:  [Shipping: In Transit → Received]  (BM ships to us)
ENTRY:         Received
DIAGNOSIS:     Diagnostics → Diagnostic Complete
               [Trade-in: Trade-in → Intake]   (grading happens during intake)
DECISION:      [Trade-in: Intake → Pay-Out → Purchased]
REPAIR:        Queued For Repair → Under Refurb → Repaired
QC:            [QC: Testing → Pass]
LISTING:       [Trade-in: To List → Listed → Sold]
COMPLETION:    Complete (ready to ship to buyer)
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
| **Trade-In Locked / Counteroffer** | YES | BM trade-ins with iCloud lock or active counteroffer (renamed from "Trade-In BMs Awaiting Validation") |
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
- Note: Monday cannot filter dropdown *options* per user — Ferrari still sees all statuses in any column he can edit. The mitigation is that his primary columns (Comms Status, Shipping Status) only have 6-9 options each, not 39.

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

**Monday capabilities (verified 23 Feb):**
- **Board views** — saved filters that show/hide *rows* and *columns* per view. Each person can have a default view.
- **Column permissions** — restrict who can *edit* or *view* entire columns (not individual values within them).
- **Conditional status changes** — require a field to be filled before a status change is allowed (e.g., "must set Pause Reason before Repair Paused"). Browser only, not mobile.
- **Dynamic person filter** — one shared view that auto-filters to each person's assigned items.
- **CANNOT** filter which status options appear in a dropdown per user or per role. Everyone sees all options in every status column they can access.

**Implication:** The 6-column split is the primary mitigation. Instead of 1 column with 39 options, each role interacts with 1-2 columns of 3-15 options. Column permissions can hide irrelevant columns entirely from specific roles.

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
| Repair Status → "Repaired" | Set QC Status → "Testing" | Auto-queue for Roni |
| QC Status → "Pass" | Set Repair Status → "Complete" | Move to completion |
| QC Status → "Fail" | Set Repair Status → "Under Repair" | Send back to tech |
| Returned for 30+ days | Move to archive board | Keep board lean |
| Booking date = today | Move to Today's Repairs group | Existing automation, verify still works |

### Existing Automations — DOCUMENTED ✅
**Completed 24 Feb 2026.** See `builds/documentation/monday/automations.md` and raw export `automations-export.csv`.
- **187 total automations** (147 active, 40 deactivated)
- Key status values referenced by active automations: Repaired (12x), Ready To Collect (9x), Queued For Repair (8x), Received (6x), Diagnostics (6x), Diagnostic Complete (5x), QC Failure (5x)
- All referenced statuses must be preserved or remapped during migration

---

## 7. Migration Sequence — New Board Rebuild

**Ricky decision (25 Feb):** Build a new clean board from scratch instead of modifying the existing one. Migrate active items over. Old board stays as rollback.

**Why rebuild beats in-place migration:**
- Zero disruption — team keeps working on current board until cutover day
- Clean rollback — if anything breaks, old board is untouched
- No automation conflicts — current board's 187 automations keep running. New board gets only what's needed, deduplicated
- Test data — load fake items covering every flow type, show the team how it works before go-live
- Column audit forced by design — every column on the new board is a deliberate choice, not inherited cruft

### Phase 1: Column Audit *(blocker — must complete first)*
- Assess all 170 columns: keep, merge, or drop for new board
- Cross-reference against: active automations (which columns they touch), flow traces (what's actually used), board relations (links to Parts/Devices boards), formulas (dependencies)
- Output: `builds/documentation/monday/column-audit.md` — every column with verdict and reason
- **Ricky reviews and approves** before Phase 2 begins

### Phase 2: Build New Board
- Create "iCorrect Main Board v2" with clean structure
- Groups: target ~17 groups from Section 3 (no dead groups, merges already applied)
- Status columns: the 6 from Section 1 (Repair Status, QC Status, Comms Status, Trade-in Status, Pause Reason, Shipping Status)
- Only columns that passed the audit in Phase 1
- No items yet — structure only

### Phase 3: Build Automations
- Rebuild from scratch using `automations.md` (147 active) as reference
- Deduplicate — current board has redundant automations (e.g. 5 separate "QC Failure → move to tech" rules, one per tech)
- Fix conflicts — document known conflicts during rebuild
- Map old status values to new column structure (e.g. "Client Contacted" in status4 → "Contacted" in Comms Status)
- Rebuild external integrations: webhooks (8 active), Typeform/Shopify item creation, board relations to Parts/Devices boards

### Phase 4: Test Data & Validation
- Load 10-20 fake items covering every flow type (walk-in repair, walk-in diagnostic, mail-in, BM functional, BM not-functional, corporate)
- Walk each flow end-to-end: trigger automations, verify group moves, verify status columns update correctly
- Record short screen recordings for each flow type — training material for team
- Ricky + Ferrari review and approve before migration

### Phase 5: Migrate Active Items
- Script to move ~100-150 active items from old board to new board
- Map old status values → new column values (status4 → Repair Status + Comms Status + QC Status + Shipping Status)
- Map old Repair Type BM values → Trade-in Status
- Preserve all board relations (Parts Used, Device links)
- Preserve all dates, people assignments, notes, financial data
- **Test with 5 items first** — verify mapping is correct before bulk run

### Phase 6: Cutover
- Team switches to new board (Monday morning, announced in advance)
- Old board renamed to "iCorrect Main Board (ARCHIVE)" — not deleted
- Monitor for 1 week: any missing automations, broken flows, team confusion
- Old board stays accessible for reference / rollback for 30 days minimum

### Phase 7: Views & Training *(after cutover stabilises)*
- Create role-based views (Ferrari, Techs, QC, BM, Management)
- Ferrari's dashboard view (deferred from open item #2 — design together with Ricky)
- Training videos per role showing their daily workflow on the new board
- 30-day auto-archive automation: items in Returned for 30+ days → archive board

---

## 8. Testing Strategy

### Test Data (Phase 4)
- 10-20 fake items with clear names (e.g. "TEST Walk-in Repair 001")
- Cover all 8 flow types from `repair-flow-traces.md`
- Include edge cases: Repair Paused with Pause Reason, QC Failure loop, BM trade-in with casing mismatch, mail-in with courier booking
- Walk each item through full lifecycle, triggering every automation

### Rollback Plan
- **Old board stays untouched** until cutover is proven stable (30 days minimum)
- If new board has critical issues at cutover → team switches back to old board same day
- If new board has minor issues → fix on new board, old board stays as reference
- **No point of no return** — unlike in-place migration, the rebuild approach is fully reversible at every phase

### Validation Criteria (must pass before Phase 5 migration)
- [ ] All 8 flow types can be completed end-to-end with new status structure
- [ ] All automations fire correctly on test data (group moves, timestamps, notifications)
- [ ] Board relations to Parts and Devices boards work on new board
- [ ] Webhooks fire to correct endpoints from new board
- [ ] Techs see only repair-relevant statuses in dropdown (max ~15 options)
- [ ] Roni has clear QC queue with Testing / Pass / Fail tracking
- [ ] BM trade-ins tracked end-to-end in Trade-in Status column
- [ ] Paused repairs require Pause Reason to be set
- [ ] Mail-in shipping tracked in Shipping Status, separate from Repair Status
- [ ] Ricky and Ferrari approve after reviewing test data walkthrough

---

## 9. Open Items (Needs Ricky)

| # | Decision Needed | Context |
|---|----------------|---------|
| ~~1~~ | ~~**Role-based status dropdowns**~~ | **RESOLVED:** Monday cannot filter dropdown options per user. The 6-column split is the mitigation. |
| ~~2~~ | ~~**Ferrari's expanded view**~~ | **RESOLVED 25 Feb:** Deferred until after board cleanup is complete. Ricky + Code will design Ferrari's dashboard view together once the new board is live. |
| ~~3~~ | ~~**Safan Long Deadline items**~~ | **RESOLVED 25 Feb:** Move all items to Safan Short Deadline. Delete Long Deadline group. Ricky hasn't had time to review individually — consolidating is good enough. |
| ~~4~~ | ~~**Roni's QC workflow detail**~~ | **RESOLVED 25 Feb:** No sub-grades. Keep it simple: QC Status = Testing / Pass / Fail. Roni writes failure details in a notes field. No per-component pass/fail breakdown. |
| ~~5~~ | ~~**Monday automations extraction**~~ | **RESOLVED 24 Feb:** 187 automations documented. See `automations.md` + `automations-export.csv`. |
| ~~6~~ | ~~**BM operations owner**~~ | **RESOLVED 24 Feb:** Jarvis (agents) manages BM groups day-to-day. |
| ~~7~~ | ~~**Comms Status: who sets "Contacted"?**~~ | **RESOLVED 24 Feb:** Ferrari manually for now. Automation when agents take over client comms. |
| ~~8~~ | ~~**iCloud Lock handling**~~ | **RESOLVED 24 Feb:** Moves to Pause Reason column. IC ON/IC OFF removed from Repair Type. |
| ~~9~~ | ~~**New board vs modify existing**~~ | **RESOLVED 25 Feb:** New board rebuild. Duplicate Main board structure, strip to only needed columns, rebuild automations from scratch, load test data, migrate active items, cutover. Old board archived as rollback. See Section 7 (rewritten). |

---

## 10. Files Referenced

| File | Content |
|------|---------|
| `builds/documentation/monday/board-schema.md` | Full 170-column, 33-group, 39-status schema |
| `builds/documentation/monday/repair-flow-traces.md` | 80 items traced across 8 flow types |
| `builds/documentation/monday/cleanup-brief.md` | Jarvis's cleanup problem statement |
| `builds/documentation/monday/QUERY-SPEC.md` | Query spec for flow trace generation |
| `builds/documentation/monday/automations.md` | ✅ Monday native automations (147 active, 40 deactivated) |
| `builds/documentation/monday/automations-export.csv` | Raw CSV export from Monday (24 Feb 2026) |

---

*This document captures decisions from the Ricky + Code design session (23 Feb 2026), team standup corrections (24 Feb 2026), and Ricky's decisions on 25 Feb 2026. All open items resolved. Next step: column audit (Phase 1 of rebuild).*

# SOP: Back Market Repairs and Returns

Date: 2026-04-26
Status: Draft for operations review
Owner: Ricky
Operational mode: recovery / automation-ready

## Jarvis Summary for Ricky

- Drafted a practical Back Market repairs and returns SOP aligned to the current recovery mode: read-only-first browser monitoring, explicit approval gates, and reduced Ferrari dependency for routine portal admin.
- The core rule is now explicit: one physical device must stay linked to one canonical BM Devices item through sale, return, repair, QC, refund, and relist.
- Returned stock does not get a new BM Devices identity. It re-enters the normal Main Board repair/QC/listing path only after original linkage, stale sale/listing reset, and QC re-pass are verified.
- Refunds, return accept/reject, warranty decisions, customer-facing replies, and live relists all remain approval-gated.
- BM 1541 is called out as a current caution case: SKU-ready, but not safe to live-list until original BM Devices linkage/reset is re-verified.

## Purpose

This SOP defines the current operating model for Back Market repair, return, refund, warranty, and relist handling.

It is designed for two uses:

1. Practical day-to-day ops handling now.
2. Later automation, with explicit decision gates preserved.

This SOP is grounded in current Back Market recovery constraints:

- Ferrari should be removed from routine manual Back Market portal admin where possible.
- Browser automation for BM seller portal work is read-only first.
- Any mutation path remains human-gated until explicitly approved.
- No customer-facing message, refund, return accept/reject, warranty decision, or live relist should happen without approval.

## Scope

This SOP covers:

- incoming return requests
- returned devices physically received back
- repair vs replace vs refund handling
- warranty / after-sales cases
- refund-state recording
- returned-stock QC and relist readiness
- data-linkage and canonical-record rules
- escalation rules
- automation-ready checklists

This SOP does not authorize:

- customer messages
- BM portal mutations
- Monday mutations without the normal approval path
- live relists without approval

## Source Grounding

This draft is based on the current Back Market docs and reports, especially:

- `reports/return-refund-relist-invariant-2026-04-26.md`
- `sops/12-returns-aftercare.md`
- `sops/04-repair-refurb.md`
- `sops/05-qc-final-grade.md`
- `sops/06-listing.md`
- `OVERNIGHT-BACKMARKET-RECOVERY-2026-04-25.md`
- `docs/PLAN.md`
- `docs/historical/staged-plans-2026-03-31-04-01/2026-04-01/BM-PROCESS-CURRENT-STATE.md`
- `docs/historical/audits-2026-02-27-to-03-27/returns-deep-dive-2026-03-03.md`
- `docs/historical/audits-2026-02-27-to-03-27/returns-forensic-2026-03-03.md`
- `../operations-system/docs/ferrari-dependency-assessment-2026-04-24.md`

Where the current process is unclear, this SOP flags a gap instead of inventing one.

## Core Rules

### 1. Canonical device identity

One physical BM device = one canonical BM Devices item.

Return, refund, and repeat-repair cycles do not create a new BM Devices identity for the same physical unit.

### 2. Workflow-cycle identity

Each repair / return / rework cycle may create or reuse a Main Board workflow item, but that Main item must link back to the original BM Devices item.

### 3. Read-only-first control

BM seller portal monitoring for returns, warranty, and customer-care cases should start as read-only detection and triage.

No live BM action is taken from that monitoring layer unless specifically approved.

### 4. Approval-gated actions

The following always require approval before execution:

- refund
- return accept
- return reject
- warranty decision
- customer-facing reply
- live relist

### 5. No stale sale/listing data on relist

A returned/refunded device cannot be relisted while stale sold-to, sales-order, or inactive listing linkage is still attached to the canonical BM Devices item.

## Operating Ownership

Default intended ownership under recovery mode:

- Jarvis / approved ops automation: read-only detection, evidence collection, case summary, approval pack preparation
- workshop ops / technician: physical receipt, inspection, repair notes, QC evidence
- Ricky: final approval owner for money, warranty, customer-facing, and account-risk decisions
- Ferrari: not required for routine monitoring; optional exception support only

## Minimum Data Checks

Every repair/return/warranty case must have these minimum checks before any decision:

| Check | Required standard |
|---|---|
| BM order / case | BM sales order ID or return/case ID present and verified |
| Main item | Current Main Board item identified or explicitly missing |
| BM Devices item | Original canonical BM Devices item identified or escalated as orphan |
| Serial / IMEI | Verified against original sale record and physical device where applicable |
| Return / refund state | Recorded from BM evidence; if no dedicated field exists, logged in notes and flagged |
| Repair notes | Existing repair notes reviewed; new post-return findings added |
| QC state | Current QC result known: pass, fail, pending, or not started |
| Listing / SKU state | Old listing ID state known; canonical SKU state known; relist blocked until verified |

Minimum evidence pack for each case:

- BM order or case identifier
- original sale reason / customer complaint text if available
- linked Main item ID
- linked BM Devices item ID
- serial / IMEI evidence
- current physical condition summary
- post-return notes
- provisional resolution recommendation

## Safety Gates

### Hard gates

Do not proceed past triage if any of these are unresolved:

- original BM Devices item cannot be identified
- serial / IMEI does not match the original record
- current Main item is not linked to the canonical BM Devices item
- stale sold/listing state is still attached and not intentionally accounted for
- QC state is missing for a relist candidate
- stored SKU state is missing or mismatched for a relist candidate

### Approval gates

| Action | Approval required |
|---|---|
| Refund | Ricky |
| Return accept / reject | Ricky |
| Warranty resolution | Ricky |
| Customer-facing reply | Ricky |
| Live relist | Ricky |
| Replacement shipment | Ricky |
| Partial refund / commercial goodwill | Ricky |

### Automation gate

Until Ricky explicitly approves otherwise, browser automation may:

- log in
- read return / warranty / CS queues
- collect evidence
- prepare summaries

It may not:

- reply to customer
- accept or reject a return
- approve or reject a warranty claim
- issue or submit a refund
- trigger a live relist

## Case Types

Use these case types at triage:

| Case type | Working meaning | Default next step |
|---|---|---|
| `CHANGE_OF_MIND` | Buyer no longer wants the device; no defect yet evidenced | Wait for receipt, inspect, QC, relist if condition matches |
| `DEFECTIVE_RETURN` | Buyer reports a fault or poor condition | Wait for receipt, inspect, repair/QC decision |
| `WRONG_ITEM_OR_LISTING_ERROR` | Wrong model, wrong spec, wrong colour, wrong accessory, or likely listing mismatch | Ricky escalation before any customer reply or relist decision |
| `WARRANTY_AFTER_SALES` | After-sales defect or warranty issue | Ricky decision on repair, replace, refund, or evidence request |
| `UNKNOWN` | Evidence too weak or contradictory | Escalate; no customer reply without approval |

## SOP Flow

### Stage 1: Detect and log the case

Trigger sources may include:

- BM seller portal CS / returns / warranty tabs
- BM order state change
- internal report of returned parcel received
- manual workshop alert

Actions:

1. Read the case in read-only mode.
2. Capture BM order / case ID, customer name, complaint reason, and timestamps if visible.
3. Classify the case provisionally using the case types above.
4. Do not reply to the customer.
5. Do not accept or reject the return.
6. Prepare the approval / ops pack.

If the reason is missing or ambiguous:

- classify as `UNKNOWN`
- do not improvise a customer response
- escalate for Ricky decision

### Stage 2: Link the case to the canonical records

Find the original BM Devices item using, in order:

1. BM sales order ID
2. listing ID
3. serial / IMEI
4. other verified sale evidence

Then verify:

1. the original BM Devices item is the canonical record for the physical unit
2. the current Main item exists or needs to be created for the new workflow cycle
3. the Main item links back to the original BM Devices item

If any of the above fails:

- mark as `ORPHAN_RETURN` or `LINKAGE_MISMATCH`
- stop operational progression
- escalate to Ricky

### Stage 3: Freeze unsafe actions until linkage is clean

Before any return is processed into repair/QC/relist flow:

- old sold-to state must be identified
- old sales-order linkage must be identified
- old listing ID state must be identified
- refund state must be identified

If the return lifecycle requires it, stale sale/listing fields on the original BM Devices item must be cleared or intentionally replaced before relist.

Confirmed current rule from the relist invariant:

- returned/refunded stock reuses the same BM Devices item
- returned/refunded stock must not go live again until stale sale/listing linkage is reset

### Stage 4: Physical receipt and post-return intake

When the device is physically returned:

1. Confirm the serial / IMEI against the original record.
2. Compare the received device to the original sold device and listing description.
3. Record mandatory post-return notes.
4. Record accessories received back.
5. Record visible transit damage, cosmetic changes, and obvious fraud indicators.

Mandatory post-return note minimum:

- reported customer issue
- actual observed issue
- serial / IMEI result
- cosmetic state on receipt
- charger / accessory state
- whether the complaint reproduced
- provisional route: QC-only, repair, replace candidate, refund candidate, BER, or fraud escalation

Reason for this control:

Historical returns forensics found almost no post-return notes, which blocks learning and repeat-failure prevention.

### Stage 5: Decision after receipt

Use this decision matrix:

| Condition on receipt | Operational route | Approval needed |
|---|---|---|
| No fault found, condition matches sale | QC-only path, then relist if all gates pass | Live relist approval |
| Minor fault, economically repairable | Repair -> QC -> relist path | Live relist approval |
| Significant defect but repairable | Ricky decision on repair vs refund vs replacement | Ricky |
| Wrong colour / wrong model / wrong spec / wrong accessory | Treat as listing-error case; hold for Ricky decision | Ricky |
| Buyer returned different device / serial mismatch / fraud concern | Stop, preserve evidence, escalate | Ricky |
| Repeat return of same physical unit | Hold for enhanced review; no normal relist shortcut | Ricky |
| BER / uneconomic repair | Ricky decision on write-off / parts / alternative route | Ricky |

### Stage 6: Repair / replace / refund / warranty branch

#### Repair branch

Use when the returned device is the correct unit and repair is still commercially acceptable.

Actions:

1. Keep the canonical BM Devices linkage.
2. Create or reuse the Main workflow item for the current cycle.
3. Add clear repair notes for the returned-fault cycle.
4. Send through normal SOP 04 repair and SOP 05 QC.
5. Do not treat prior QC as sufficient; returned stock must pass QC again.

#### Replace branch

Use only if Ricky explicitly approves a replacement outcome.

Current confirmed rule:

- replacement shipment is not a routine auto-path
- no replacement commitment should be made to the customer without approval

Open implementation gap:

- the exact Monday data model for replacement shipments vs same-order resolution is not fully confirmed in the current rebuild docs

#### Refund branch

Use only after Ricky approval.

Rules:

- refund state must be recorded
- if BM auto-refunded, record that state and continue returned-stock handling
- if manual refund is required, do not action it without approval

Open schema gap:

- `docs/PLAN.md` proposes `color_returns_refund_state`, but this field is not yet confirmed here as live production truth

Until confirmed, record refund state in notes and flag the schema gap.

#### Warranty / after-sales branch

Current known constraint:

- BM `/ws/sav` after-sales API is still documented as under construction
- seller portal / manual handling remains the source of truth

Therefore:

1. Detect and summarise warranty cases in read-only mode.
2. Do not reply to the customer without approval.
3. Do not accept or reject warranty liability without approval.
4. Ricky decides repair, replace, refund, evidence request, or reject path.

## Returned-Stock QC Standard

Returned stock must pass the normal QC handoff again, plus the return-specific checks below.

Minimum returned-stock QC:

- full boot to desktop
- display test
- keyboard and layout test
- trackpad test
- camera and microphone test
- battery health / charging check
- port test
- WiFi / Bluetooth check where relevant
- charger / accessory check
- serial / IMEI re-verify
- colour / spec / model re-verify against intended listing

Additional return-specific requirements:

- confirm whether the original customer complaint reproduces
- confirm whether any new damage exists
- add post-return notes before QC sign-off
- if this is a repeat return, require enhanced review before relist

Grounding note:

Historical returns analysis showed preventable failures clustered around missing boot tests, weak pre-dispatch QC, missing serial-to-listing verification, missing accessory checks, and repeat-return devices being relisted too easily.

## Relist Rules for Returned Stock

Returned stock can re-enter the normal listing path only when all are true:

1. the current Main item is linked to the correct original BM Devices item
2. stale sale/listing fields on the BM Devices item are cleared or intentionally updated
3. the returned-fault cycle has repair notes and post-return notes
4. the device has passed QC again
5. final grade is current
6. stored SKU state is valid for the current device state
7. no unresolved refund / warranty / fraud issue remains
8. Ricky approves the live relist

### Listing caution markers

Names such as `RTN > REFUND`, `returned`, or `refund` are operator cautions, not automatic relist approval.

They mean:

- verify original BM Devices linkage
- verify stale sale/listing reset
- verify QC re-pass
- verify current final grade and SKU

### Current known caution case

BM 1541 / Muhab Saed is currently SKU-ready but listing-cautioned.

Current reports map it to:

- Main item: `11778286649`
- BM Devices item: `11778297586`

Do not live-list it until the original BM Devices linkage/reset is re-verified. If `11778297586` is wrong, correct the linkage before any relist.

## Data-Linkage Rules

These rules are mandatory for automation and manual ops alike:

1. The BM Devices item is the canonical device record.
2. The Main item represents the current operational cycle.
3. Returned/refunded devices do not get a second BM Devices identity.
4. Serial / IMEI mismatch always stops the flow.
5. Relist writes must land on the same canonical BM Devices item used for the original sale history.
6. If the original BM Devices item cannot be proven, the case is blocked until manually resolved.

## Automation-Ready Checklist

Use this checklist before allowing any automation to progress a case:

- `Case detected read-only`: BM case was read without mutation.
- `BM order known`: sales order ID or equivalent case ID captured.
- `Case type known`: change-of-mind, defective, wrong-item/listing-error, warranty, or unknown.
- `Main item known`: current workflow item exists or create-needed is explicit.
- `BM Devices known`: canonical BM Devices item identified.
- `Linkage verified`: Main item links back to canonical BM Devices item.
- `Serial/IMEI verified`: physical unit matches original record.
- `Refund state known`: recorded or explicitly missing and flagged.
- `Repair notes reviewed`: prior notes read.
- `Post-return notes added`: current-cycle findings recorded.
- `QC state known`: pass, fail, pending, or not started.
- `SKU/listing state known`: stale listing state understood; current SKU state understood.
- `Approval gate state known`: which actions still need Ricky.
- `Safe next step chosen`: inspect, repair, QC, escalate, refund decision, warranty decision, or relist hold.

Suggested automation statuses:

| Status | Meaning |
|---|---|
| `AWAITING_LINKAGE` | Canonical BM Devices link not yet proven |
| `AWAITING_RECEIPT` | Case exists but unit not yet physically received |
| `AWAITING_INSPECTION` | Unit received, post-return intake not complete |
| `AWAITING_RICKY_DECISION` | Refund / warranty / customer-facing / replacement / relist decision pending |
| `IN_REPAIR` | Returned unit in repair flow |
| `AWAITING_QC` | Repair complete, QC pending |
| `READY_TO_RELIST_REVIEW` | QC passed, waiting for relist approval |
| `BLOCKED_FRAUD_OR_MISMATCH` | Serial / identity problem |
| `BLOCKED_DATA_GAP` | Missing required fields or linkage |

## Escalation Rules

Escalate to Ricky immediately if any of the following occur:

- original BM Devices item cannot be identified
- Main item and BM Devices item do not link cleanly
- serial / IMEI mismatch
- buyer appears to have returned a different device
- wrong model / wrong spec / wrong colour / wrong accessory complaint
- repeat return of the same physical unit
- refund, warranty, replacement, or customer-facing reply is being considered
- BER or doubtful economics on repair
- BM account-risk action is required in the portal

Escalate to workshop lead / responsible tech if:

- complaint reproduces and repair notes are missing or weak
- QC evidence is absent
- parts were logged but repair ownership is unclear
- boot / display / keyboard / battery / charger checks were skipped

## Known Gaps and Constraints

- The exact live field for return/refund state is not yet confirmed in this repo; `docs/PLAN.md` proposes one, but this SOP does not assume it already exists.
- The exact data model for replacement shipments in after-sales cases is not fully confirmed in the current rebuild docs.
- BM after-sales API remains documented as unavailable / under construction, so seller-portal handling remains necessary.
- Portal automation for returns and warranty is still intended as read-only / human-gated first, not autonomous execution.

## Open Questions for Ricky

- Which exact Monday field is the current production truth for return/refund state, if any?
- On approved replacement cases, do we keep the same Main item or create a separate replacement-cycle Main item?
- For seller-decided return accept/reject cases, who is the intended day-to-day approval delegate when Ricky is unavailable?
- Do we want repeat-return devices to require Ricky approval on every relist, or only from the second return onward?
- Should warranty cases have a distinct Monday status separate from normal returns, or is note-based handling enough for now?
- When BM auto-refunds before physical receipt, what is the required ops state transition on Monday before the unit arrives back?
- Is BM 1541 definitely linked to BM Devices `11778297586`, or does that need a fresh verification before it is treated as canonical?
- Do we want a hard commercial threshold for repairing returned/warranty stock versus BER / refund escalation, or keep that fully manual for now?

# 11 Systems Deep Map

Date: 2026-04-06
Scope: deep mapping of the 11 systems in Ricky's 2026-04-05 systems dump against the automation blueprint, current Monday schemas, current SOP/ops research, current journey maps, and current team/company context
Method: read-only synthesis only

## Cross-System Read First

### Current source-of-truth reality

- Monday is still the live operational backbone for repairs, BM flow, customer status, shipping, and QC.
- Supabase is the target bridge layer in the systems vision, but the live verified database is still mostly agent/telemetry infrastructure plus `bm_price_history`, not a real operations mirror yet.
- For C12, any Supabase tables named below are split into:
  - `Current live`: verified today in `/home/ricky/kb/system/supabase-schema.md`
  - `Planned / required`: explicitly specced in intake or pricing docs, or required by the system design but not live business truth yet

### Current live Supabase that matters here

- `bm_price_history` exists live.
- `business_state` exists but is empty.
- No verified live operational queue, intake, QC, shipping, or parts tables exist yet.

### Common Monday surfaces across the 11 systems

- Main Board `349212843`
- BM Devices Board `3892194968`
- Main Board core columns repeatedly reused:
  - `status4` main repair status
  - `status24` repair type / BM lifecycle
  - `color_mkypbg6z` trade-in status
  - `person` technician
  - `board_relation5` device relation
  - `connect_boards__1` parts used
  - `text4` IMEI/SN
  - `date4` received date
  - `date36` deadline
  - `date6` booking time
  - `text5` email
  - `text_mky01vb4` BM trade-in ID
  - `text_mkydhq9n` listing ID
  - `multiple_person_mkyp2bka` QC by
  - `date_mkypt8db` QC time
  - `text53` outbound tracking

### Common blockers across almost every system

- The live Monday queue is polluted by stale debt. Operations research shows only a small minority of non-terminal rows look like real current WIP.
- Intake ownership is weak after Adil's dismissal. Andres is covering some intake with no verified SOP.
- There is no true bench-state field yet, only tech-group/queue proxies.
- Parts reservation/allocation is still a gap. The live parts service handles `Parts Used`, but reservation is still a stub.
- QC has no dedicated state model or structured checklist yet.
- Payment truth is unreliable, so any "job complete" surface that depends on paid-state is operating on weak data.
- BM has strong machine checks in intake, payout, sale detection, and shipping confirmation, but still has manual gaps at listing publication, return detection, and some operator handoffs.

## System 1: Client Intake Form

### Data model

- Reads:
  - customer identity, contact details, device, fault, service path, appointment/drop-off intent
  - current Typeform flows and webhook payloads
  - pricing/turnaround context where available
- Writes, current live:
  - Monday Main Board item or lookup/update
  - Intercom ticket/contact context on the walk-in path
  - Slack intake notifications
- Writes, planned / required:
  - Supabase `intake_sessions`
  - Supabase `intake_responses`
  - Supabase `intake_checks`
  - Supabase `intake_photos`
  - Supabase `turnaround_times`
  - Supabase `corporate_profiles`
- APIs / systems:
  - Typeform today
  - Monday GraphQL
  - Intercom
  - Slack
  - Shopify/Xero only for lookup context, not mutation, in intake specs

### User roles

- Client
- Intake/front-desk operator
- Ferrari for follow-up/comms context
- Ricky for exceptions/policy

### Integration points

- Upstream into Systems 2, 3, and 5
- Creates or enriches the operational repair record in Monday
- Feeds customer context into Intercom and Slack intake notifications
- Later should become the first write into Supabase for downstream workshop systems

### Existing components

- `builds/intake-system/SPEC.md`
- `builds/intake-system/react-form/`
- `builds/intake-notifications/REBUILD-BRIEF.md`
- `builds/intake-notifications/specs/slack-intake-2026-03-31/slack-intake-specs/00-MASTER-PLAN.md`
- Existing Typeform/n8n walk-in/drop-off/collection flows documented in intake-notifications specs

### Dependencies

- Verified field and column mapping for the current intake forms
- Customer matching engine across Monday + Intercom
- Turnaround/pricing lookup table ownership
- Supabase intake schema if the form is to become the real first-party source of truth

### Overlap with automation blueprint

- Intake form processor
- Intake completeness validator

### Phase 1 definition

- Replace Typeform with a custom form that preserves the current questions, logic, and Slack/Monday handoff exactly, without trying to redesign the whole intake state model yet.

## System 2: Workshop Intake System

### Data model

- Reads:
  - structured client intake payload from System 1
  - Monday item identity, booking, service type, email, serial, device relation, and existing updates
  - Intercom conversation context
- Writes:
  - confirmed device details
  - serial lookup results
  - intake images
  - operator notes and structured free-text extraction
- Supabase requirement:
  - reuses the intake tables above
  - needs the workshop screen to read/write the same intake session package, not create a second disconnected intake store
- APIs / systems:
  - Monday
  - Intercom
  - device/spec lookup service
  - Supabase Storage for photos

### User roles

- Tech going upstairs to see the client
- Intake/front-desk coverage
- Ferrari for prior conversation context
- Ricky only for edge-case escalation

### Integration points

- Direct consumer of System 1 output
- Hands a verified intake package into System 3
- Should reduce repeat-question friction called out by Andres/Nahid in the dump

### Existing components

- `builds/intake-system/flows/client-ipad-flow.md`
- `builds/intake-system/integrations.md`
- `builds/intake-system/SPEC.md`
- Walk-in journey map showing current Monday + Intercom + Typeform path

### Dependencies

- System 1 must create a structured intake package first
- Shared customer/device identity model
- Image upload/storage path
- Reliable device/spec lookup
- Clear permission model for team-facing edits

### Overlap with automation blueprint

- Intake form processor
- Intake completeness validator

### Phase 1 definition

- One iPad-first team view that surfaces the already-submitted intake, lets staff confirm missing facts, run serial/spec lookup, add photos/notes, and hand the case cleanly into the checklist flow.

## System 3: Device Intake Checklist

### Data model

- Reads:
  - intake package from Systems 1 and 2
  - service type and queue context from Monday
  - parts availability status
- Writes:
  - checklist completion state
  - ammeter/basic pre-check evidence
  - label/condition/timeline confirmation
  - operator assignment and notes
  - queue-entry handoff to repair/diagnostic
- Monday surfaces:
  - `status4`
  - `person`
  - `text4`
  - `date4`
  - device/service context from the main board
  - additional notes/updates and intake fields already used in current practice
- Supabase requirement:
  - primarily `intake_checks` plus linked photos/evidence

### User roles

- Intake operator
- Tech receiving the physical device
- Coordinator monitoring queue entry

### Integration points

- Shared handoff point into System 7 repair queue
- Shared gating point before diagnostic work starts
- Should also trigger customer receipt/update flows where appropriate

### Existing components

- `builds/intake-system/flows/standard-repair-flow.md`
- `builds/intake-system/flows/diagnostic-intake-flow.md`
- `kb/operations/intake-flow.md`
- `builds/monday/services/status-notifications/templates.js`

### Dependencies

- Verified hard-gate rules
- Parts stock check integration
- Explicit operator ownership at intake
- Queue model that distinguishes real live WIP from stale debt

### Overlap with automation blueprint

- Intake completeness validator
- Queue status builder
- Intake-to-diagnostic lag tracker

### Phase 1 definition

- Hard-gated checklist before queue entry: no missing passcode verification, stock check, turnaround confirmation, or intake evidence on eligible paths.

## System 4: BackMarket Intake System

### Data model

- Reads:
  - Main Board BM repair item
  - BM Devices item
  - BM order/public ID
  - serial/spec/iCloud state
  - parts required and pre-grade evidence
- Main Board columns in live use:
  - `status4`
  - `status24`
  - `color_mkypbg6z`
  - `text4`
  - `date4`
  - `text_mky01vb4`
  - `color_mkp5ykhf`
  - `status_2_mkmc4tew`
  - `status_2_mkmcj0tz`
  - `status_2_Mjj4GJNQ`
  - QC fields when the item progresses downstream
- Additional BM intake fields from SOPs:
  - iCloud status `color_mkyp4jjh`
  - parts required `board_relation_mm01yt93`
  - intake notes `long_text_mkqhfapq`
  - BM diag tech `multiple_person_mkyp6fdz`
- BM Devices columns in live use:
  - `text_mkyd4bx3`
  - `text_mkye7p1c`
  - `text_mkqy3576`
  - spec columns (`status__1`, `status7__1`, `status8__1`, `color2`)
  - mirror/lookup grade and condition fields
- APIs / systems:
  - Back Market buyback APIs
  - SickW
  - Apple Self Service Repair API
  - Slack/Telegram alerts
- Supabase:
  - no verified live BM intake operational tables today
  - likely needs BM intake shadow tables later, but the current working backend is Monday + services

### User roles

- Intake/front-desk receiver
- Roni as BM diagnostics owner today
- Refurb/repair techs after handoff
- Ricky for counter-offers, margin exceptions, and payout thresholds

### Integration points

- Fed by `sent-orders.js`
- Uses `icloud-checker`, `bm-grade-check`, and `bm-payout`
- Connects directly to Inventory (System 8), Diagnostics (System 6), Repair Dashboard (System 7), QC (System 11), and later resale/shipping

### Existing components

- `builds/backmarket/sops/01-trade-in-purchase.md`
- `builds/backmarket/sops/02-intake-receiving.md`
- `builds/backmarket/sops/03-diagnostic.md`
- `builds/backmarket/sops/03b-trade-in-payout.md`
- `builds/icloud-checker/`
- `builds/buyback-monitor/`
- `builds/backmarket/scripts/sent-orders.js`

### Dependencies

- Parts reservation/allocation model is still missing
- Arrival alerting and auto-move into Today's Repairs are still flagged gaps
- Guided pre-diagnostic logic for non-functional power faults is not built yet
- Custom UI still needs a stable backend contract around existing services

### Overlap with automation blueprint

- BM sent-orders ingestion
- BM intake checks
- BM grade/profit check
- BM trade-in payout validator
- Buyback daily monitor

### Phase 1 definition

- Custom intake UI on top of the existing BM webhook/services estate: serial, spec check, iCloud, grading, parts-required capture, and clear can-repair/can't-repair output, without rebuilding the underlying BM services first.

## System 5: Mail-In Intake

### Data model

- Reads:
  - pre-existing booking/intake record
  - customer notes from intake form and Intercom
  - package receipt/discrepancy information
- Writes:
  - `status4 = Received`
  - `date4`
  - discrepancy notes
  - queue allocation outcome
  - shipping/courier-related customer updates
- Main Board surfaces:
  - `status4`
  - `service`
  - `date4`
  - booking/group context from Incoming Future into active work
- Supabase requirement:
  - same intake tables as walk-in, but with a mail-in receipt/discrepancy branch

### User roles

- Receiving/intake operator
- Coordinator
- Ferrari for customer follow-up if discrepancies are found

### Integration points

- Same intake engine as Systems 1 to 3
- Pulls from courier/booking/customer context
- Hands the device into the same repair/diagnostic queue as walk-ins

### Existing components

- `kb/operations/sop-mail-in-repair.md`
- `kb/operations/sop-mail-in-diagnostic.md`
- `kb/operations/sop-mail-in-corporate.md`
- `kb/operations/intake-flow.md`
- Mail-in journey map
- Status notification templates for courier and return-courier paths

### Dependencies

- Shared intake engine with clear branch logic
- Reliable customer matching to the existing Monday item
- Mandatory discrepancy capture on receipt
- Ownership/SLA rules for mail-in items stalled before or after arrival

### Overlap with automation blueprint

- Intake form processor
- Intake completeness validator
- Queue status builder
- Intake-to-diagnostic lag tracker

### Phase 1 definition

- Shared intake surface with a mail-in entry point that forces receipt confirmation, discrepancy recording, and queue handoff without needing a separate mail-in application.

## System 6: Interactive Diagnostic System

### Data model

- Reads:
  - structured intake history
  - symptom/fault path
  - existing pre-checks and prior notes
  - parts availability/allocation context
- Writes:
  - structured diagnostic results
  - test-point readings
  - liquid-damage image evidence
  - severity/fault classification
  - repair-ready or escalation-ready output
- Monday today:
  - diagnostic timestamps and time-tracking fields exist
  - BM diagnostic path already writes detailed diagnostic fields in SOP 03
  - notes and updates remain a major current output surface
- Supabase requirement:
  - no explicit live diagnostic tables exist
  - this system needs dedicated diagnostic-result tables if it is to become more than Monday notes plus timing fields

### User roles

- Techs
- Roni on the BM diagnostic side
- Systems / Elek as reasoning support, not as the primary deterministic engine

### Integration points

- Consumes Systems 3, 4, and 5 output
- Feeds Systems 7 and 11
- Connects to Inventory when parts become diagnosable requirements

### Existing components

- `builds/intake-system/flows/diagnostic-intake-flow.md`
- `builds/backmarket/sops/03-diagnostic.md`
- `kb/operations/qc-workflow.md` as downstream reference
- Diagnostics / Elek role in the automation blueprint

### Dependencies

- Diagnostic schema and media model
- Structured test-path content
- Parts allocation model
- Separated diagnostic state from the overloaded main Status column

### Overlap with automation blueprint

- Intake completeness validator
- Queue status builder
- Technician capacity snapshot
- Intake-to-diagnostic lag tracker

### Phase 1 definition

- Guided structured diagnostics for the highest-value branches first: liquid damage and non-power/power-fault paths, with results attached to the repair record in a consistent format.

## System 7: Tech Repair Dashboard

### Data model

- Reads:
  - assigned queue by `person`
  - repair stage by `status4`
  - repair type by `status24`
  - device relation and context
  - intake package
  - diagnostic outputs
  - parts allocated/used
  - deadlines and history
- Writes:
  - repair notes
  - delay reasons
  - actual parts used via `connect_boards__1`
  - testing module results
  - handoff into QC
- Supabase requirement:
  - blueprint assumes shadow operational tables, but none are live business truth yet

### User roles

- Safan
- Misha
- Andreas
- Other techs added later
- Coordinator as viewer/allocator

### Integration points

- Consumes Systems 3 to 6
- Feeds Systems 8, 9, and 11
- Should become the primary tech interface replacing Monday board usage

### Existing components

- Monday main board itself
- `kb/operations/queue-management.md`
- `builds/icorrect-parts-service/` for live parts-used deduction
- repair-flow traces and timing analysis from operations research

### Dependencies

- Queue cleanup first, otherwise the dashboard will inherit zombie debt
- Split status model for repair/comms/QC/shipping
- Parts allocation/reservation, not just parts-used deduction
- Testing module schema and write-back path

### Overlap with automation blueprint

- Queue status builder
- Aging item detector
- Bottleneck detector
- Technician capacity snapshot
- Workstation allocation tracker
- Daily ops summary

### Phase 1 definition

- A filtered active-WIP tech workspace: assigned jobs, repair detail, notes, parts-used logging, and basic testing handoff, while Monday remains the backend.

## System 8: Inventory Management System

### Data model

- Reads:
  - Monday Parts Board `985177480`
  - Main Board `connect_boards__1` Parts Used
  - future `board_relation_mm01yt93` Parts Required reservation signal
  - current parts service SQLite data
- Current local DB:
  - `parts.db`
  - `audit_log` table with deduct/restore/skip/error history
- Writes:
  - live stock quantity updates back to Monday today
  - low-stock notifications
  - later reservation state, reorder candidates, and supplier-order state
- APIs / systems:
  - Monday GraphQL
  - parts service webhook on Main Board column changes
  - supplier/Xero integrations later
- Supabase:
  - planned mirror target in the systems dump
  - not the current live store for parts

### User roles

- Roni as parts manager
- Techs consuming/reserving parts
- Coordinator needing stock/blocker visibility
- Ricky for supplier/order decisions

### Integration points

- Receives consumption from System 7
- Should receive reservation signals from Systems 3, 4, and 6
- Feeds queue prioritisation in System 9 and BM profitability in System 4

### Existing components

- `builds/icorrect-parts-service/src/webhook.js`
- `builds/icorrect-parts-service/src/deduction.js`
- `builds/icorrect-parts-service/src/reservation.js` stub
- `builds/icorrect-parts-service/dashboard/index.html`
- `update_usage_columns.py`
- `populate_60d_usage.py`

### Dependencies

- Reservation/allocation model is not implemented yet
- Reorder thresholds and demand forecasting rules are not formalised
- Supplier/pricing truth is weak
- Parts Board needs to function as a real operating surface, not just a reference list

### Overlap with automation blueprint

- Stock level checker
- Low-stock alert generator
- Reorder list builder
- Usage trend calculator
- Demand forecast builder
- Parts reservation checker
- China shipment intake helper

### Phase 1 definition

- Replace ad-hoc parts lookups with a stock-and-commitments surface first: live quantity, low-stock risk, recent usage, and basic reservation visibility.

## System 9: Coordinator Dashboard

### Data model

- Reads:
  - live queue state
  - age and deadline data
  - tech ownership
  - parts blockers
  - QC blockers
  - customer approval/comms blockers
- Writes:
  - repair-dependent tasks
  - standalone tasks
  - updates back to Monday
  - later predicted completion times and escalations
- Monday sources:
  - `status4`
  - `person`
  - `date36`
  - `date4`
  - group placement
  - relevant linked-device and parts context
- Supabase:
  - blueprint assumes shadow operational/metrics tables
  - not live yet for operations

### User roles

- Head coordinator
- Ferrari in the sub-coordinator/task-management role
- Ricky as final escalation owner

### Integration points

- Central control layer over Systems 7, 8, 10, and 11
- Should expose where work is, what is blocked, and what needs customer/team action next

### Existing components

- `kb/operations/queue-management.md`
- operations research:
  - `monday-data-quality-audit.md`
  - `monday-zombie-triage.md`
  - `handoff-failure-matrix.md`
  - `timing-mapping.md`
- Monday groups as the current weak proxy for ownership and queue state

### Dependencies

- Queue cleanup is non-negotiable
- Explicit owner assignment and SLA timers
- A task model, because today tasks are implicit in statuses and updates
- Better separation of blocked/customer-wait states from true workshop work

### Overlap with automation blueprint

- Queue status builder
- Aging item detector
- Bottleneck detector
- Technician capacity snapshot
- Zombie queue triage
- Today board / daily ops summary
- `/queue`, `/status`, `/aging`, `/ops-summary`

### Phase 1 definition

- A coordinator control surface for the real active subset only: owner, stage, blocker, age, deadline, and next action, plus a simple linked/unlinked task board.

## System 10: Shipping Interface

### Data model

- Reads:
  - ready-to-ship items
  - `text53` outbound tracking
  - `text4` serial
  - shipping/dispatch status on Main Board
  - linked BM Devices order context
  - BM Sales Order ID `text_mkye7p1c`
- Writes:
  - label purchase output
  - shipping checklist completion
  - `status4 = Shipped`
  - BM shipment confirmation
  - Slack/Telegram dispatch outputs
- APIs / systems:
  - Royal Mail
  - Back Market orders ship endpoint
  - Monday
  - Slack
- Supabase:
  - no live shipping tables verified

### User roles

- Dispatch/packing operator
- Coordinator
- Tech/QC handoff owner
- Ferrari for customer-facing courier context where relevant

### Integration points

- Fed by QC completion in System 11
- Uses current BM dispatch and shipment-confirmation services
- Closes the loop back to BM and customer shipping communication

### Existing components

- `builds/royal-mail-automation/dispatch.js`
- `builds/royal-mail-automation/DISPATCH-TASK.md`
- `builds/backmarket/sops/09-shipping.md`
- `builds/backmarket/sops/09.5-shipment-confirmation.md`
- BM resale journey map

### Dependencies

- Clean ready-to-ship queue
- Physical verification checklist model
- Reliable serial/tracking/order linkage
- Clear distinction between label bought and physically shipped

### Overlap with automation blueprint

- Dispatch automation
- Shipment confirmation
- Tuesday cutoff monitor

### Phase 1 definition

- Checklist-first shipping screen on top of existing dispatch automation: verify label, serial, and physical pack check before allowing `Shipped` and BM confirmation.

## System 11: QC System

### Data model

- Reads:
  - repair type
  - repair/testing context
  - diagnostic evidence
  - final grade requirements for BM
  - downstream shipping/listing readiness
- Monday fields:
  - `multiple_person_mkyp2bka`
  - `date_mkypt8db`
  - `status_2_Mjj4GJNQ`
  - `status4` for current pass/fail routing
- Writes:
  - pass/fail decision
  - rejection reason
  - rework handoff
  - later ETA back to QC queue
- Supabase requirement:
  - no live QC result/checklist tables today
  - this system needs structured checklist/result tables if it is to stop depending on experience plus notes

### User roles

- Roni
- Repair techs receiving rejected items back
- Coordinator monitoring QC backlog

### Integration points

- Consumes System 7 testing output and full repair record
- Feeds System 10 shipping and BM listing/sale flow
- Should create a cleaner rework loop back into System 7

### Existing components

- `kb/operations/qc-workflow.md`
- Main Board QC fields
- Team metrics showing QC/rework performance
- BM SOP chain that assumes QC as a gate before listing or payout decisions downstream

### Dependencies

- Dedicated QC state model or column
- Structured checklists by repair type
- Rejection routing rules
- ETA logic for re-QC planning
- Reduced role overload on Roni, or at least better queue visibility

### Overlap with automation blueprint

- QC checklist validator
- Rework / QC proxy tracker
- Queue status builder
- Bottleneck detector

### Phase 1 definition

- Structured conditional QC checklist with explicit pass/fail capture and rejection notes, still writing back into Monday while the richer predictive ETA layer waits for cleaner queue data.

## Cross-System Dependency Order

1. Clean the live queue enough that active WIP is distinguishable from zombie debt.
2. Lock the intake data contract: customer matching, hard gates, and one canonical intake package.
3. Build parts reservation/allocation, not just parts-used deduction.
4. Split state models that are currently overloaded into the main Monday status column: repair, comms, QC, and shipping.
5. Add minimal operational Supabase mirror tables only where the React systems need them first; do not assume live Supabase already solves this.

## Blueprint-to-System Concentration

- Operations blueprint scripts are the dominant feed into Systems 2, 3, 5, 7, 9, and 11.
- Parts blueprint scripts are the dominant feed into System 8 and materially affect Systems 4, 6, and 7.
- Revenue/BM blueprint scripts are the dominant feed into Systems 4 and 10.
- Customer-service and finance blueprint work are mostly indirect dependencies here, but weak comms ownership and weak payment truth still leak into the workshop systems.

## Minimum Platform Read

- The 11-system vision is coherent, but the true enabling layers are still:
  - intake structure
  - queue hygiene
  - parts commitments
  - QC structure
  - explicit ownership/SLAs
- Without those, custom React frontends would mainly re-skin messy backend truth.
- With those fixed, Monday can remain the short-term backend while each Phase 1 interface becomes useful before full Supabase cutover.

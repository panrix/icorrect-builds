# Walk-In Customer Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- Monday is the canonical customer identity and operational record once the job exists.
- The verified digital walk-in intake path is Typeform -> n8n -> Intercom + Monday.
- The current live status-notification sender is the VPS `status-notifications.service`; the old n8n sender was disabled on 2026-04-01.
- Tech groups on the main board represent technician queues / workstation proxies, but being in a tech group does not prove the device is physically on that desk.
- Existing docs do not prove that every walk-in uses the Typeform route; where that matters it is marked explicitly.

## Journey Map

1. Walk-in booking or same-day intake starts
- Customer touchpoint: customer either books a walk-in repair online through Shopify or completes the walk-in Typeform for clients without an appointment.
- Internal handoff: booking/intake context is handed from the customer-facing form into customer-service and operations records.
- Systems involved: Shopify order workflow for paid walk-ins, or Typeform form `LtNyVqVN`; n8n Cloud; Intercom; Monday main board `349212843`.
- Automation state: automated record creation in the verified digital paths.
- Delay points and failure modes: the audit does not prove that all walk-ins use the digital form path; older intake docs also say there is no verified company-wide intake SOP, so some walk-ins may still rely on manual reception handling.
- Sources: `data_flows.md`; `platform_inventory/typeform.md`; `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/kDfU2wWWv207T24J.json`; `/home/ricky/kb/operations/intake-flow.md`.

2. Intercom and Monday records are created
- Customer touchpoint: customer does not usually see this directly, but this is the first point where their enquiry becomes traceable across systems.
- Internal handoff: intake/front desk hands the job into the customer-service record in Intercom and the workshop record in Monday.
- Systems involved: Intercom ticket type `2985889`; Monday group `new_group70029`; Slack `walk-in-form-responses`.
- Automation state: automated in the Typeform workflow. The workflow searches/creates the Intercom contact, creates a ticket titled `Your Repair with iCorrect`, creates a Monday item, adds a Monday update, and posts a Slack notification.
- Delay points and failure modes: if the form path is bypassed, there is no confirmed equivalent fully-structured automated handoff. Intake docs also say context is often lost between customer conversations and workshop execution.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/kDfU2wWWv207T24J.json`; `team-operations-summary.md`; `/home/ricky/builds/intake-system/SPEC.md`.

3. Booking confirmation and pre-arrival messaging
- Customer touchpoint: booking-confirmation email/reply through Intercom, including appointment timing and, for standard customers, the pre-repair Typeform link.
- Internal handoff: Monday status changes trigger the outbound comms service; Ferrari/customer-service owns the comms side while the workshop owns readiness.
- Systems involved: Monday `status4`; VPS `status-notifications` service on port `8014`; Intercom conversation ID in `text_mm087h9p`; Typeform pre-repair form `sDieaFMs`.
- Automation state: automated once the Monday item has the right status and Intercom ID.
- Delay points and failure modes: if the Intercom ID is missing or the wrong status is used, the customer update can be missed. The board also has `232` stale `Booking Confirmed` items with median age `835.5` days, so this status cannot be treated as a clean live queue by itself.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`; `findings.md`; `timing-mapping.md`.

4. Device is physically received at the desk
- Customer touchpoint: in-person handover, passcode sharing, condition discussion, and expectation-setting on turnaround/payment.
- Internal handoff: front desk / intake coverage hands the device into the workshop queue.
- Systems involved: Monday main board; intake fields such as email, phone, passcode, issue notes, service type, received date, and booking time; local intake design docs.
- Automation state: manual physical handoff and data completion; Monday date population and some follow-on notifications are automated.
- Delay points and failure modes: intake remains a known weak point. The intake spec says missing passcode verification, missing stock checks, missing turnaround confirmation, and missing intake photos should block progression, but KB marks this as `needs-operator-confirmation`, not a proven live SOP.
- Sources: `/home/ricky/kb/operations/intake-flow.md`; `/home/ricky/builds/intake-system/SPEC.md`; `/home/ricky/builds/intake-system/flows/standard-repair-flow.md`.

5. Pre-repair questionnaire enriches the job
- Customer touchpoint: customer fills in the pre-repair Typeform linked from booking-confirmation / courier comms.
- Internal handoff: the form response is written back onto the Monday item and optionally posted to the linked Intercom conversation so the technician and customer-service both see the same context.
- Systems involved: Typeform `sDieaFMs`; n8n workflow `Typeform To Monday Pre-Repair Form Responses (v2)`; Monday; Intercom; Slack alerts for bad submissions.
- Automation state: automated enrichment, validation, and optional movement to `Received` and `Today's Repairs`.
- Delay points and failure modes: wrong or missing hidden fields lead to Slack exceptions (`item not found`, `wrong group`, duplicate submission). If the form is not completed or cannot be matched, the technician receives weaker context and the intake-to-tech handoff degrades.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/AubY0Rvhhvgp4GJ1.json`; `data_flows.md`; `/home/ricky/kb/operations/intake-flow.md`.

6. Technician queue assignment and bench work
- Customer touchpoint: usually none unless extra information is needed.
- Internal handoff: job moves from intake/front desk into a technician queue group, then to the assigned tech.
- Systems involved: Monday groups (`Today's Repairs`, `Safan`, `Andres`, `Mykhailo`); technician column; main repair statuses.
- Automation state: queue movement is mixed. Some group moves are automated, but queue-management docs say nobody has a clear inventory of which automations do what.
- Delay points and failure modes: queue selection is not tightly managed; techs can self-select, and queue docs call out cherry-picking, no SLA tracking, and no bottleneck detection. Stale open work obscures true live bench load.
- Sources: `/home/ricky/kb/operations/queue-management.md`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `findings.md`.

7. Diagnostics, quote, and approval loop
- Customer touchpoint: customer receives quote communication by email via Intercom and may need to answer password / approval questions.
- Internal handoff: technician diagnoses; Ferrari/customer-service sends quote and chases approval; approved jobs hand back to the workshop.
- Systems involved: Monday statuses `Diagnostics`, `Diagnostic Complete`, `Quote Sent`, `Invoiced`, `Queued For Repair`; Intercom; Xero draft-invoice path when invoicing is used.
- Automation state: diagnosis itself is manual; quote communication is manual but lives in Intercom; Xero draft creation is automated only when the `Create Invoice` action is triggered in Monday.
- Delay points and failure modes: overall `Diagnostic Complete -> Quote Sent` median is `1 day`, but `75` open items have `Diag. Complete` with no `Quote Sent` date. Ricky confirmed the intended path is `Diagnostic Complete -> Quote Sent -> Invoiced -> Queued For Repair`, but quote acceptance itself is not tracked cleanly.
- Sources: `timing-mapping.md`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `findings.md`; `platform_inventory/xero.md`.

8. Repair and refurb work
- Customer touchpoint: none unless extra faults are found and the job is paused for approval.
- Internal handoff: approved jobs hand back from customer-service into the repair queue; technicians may hand failed or incomplete work back into comms or pause states.
- Systems involved: Monday `Queued For Repair`, `Under Repair`, `Under Refurb`, `Repair Paused`, `Awaiting Part`, `Client To Contact`, `Client Contacted`.
- Automation state: manual workshop execution; automated status-triggered comms only at selected milestones.
- Delay points and failure modes: the traced reality includes repeated pause loops, repeat diagnostics, and customer-wait states. Walk-in repair median `Received -> Date Repaired` is `1 day`, but walk-in diagnostic jobs have a `7 day` median, reflecting the longer approval/exception path.
- Sources: `/home/ricky/builds/monday/repair-flow-traces.md`; `timing-mapping.md`; `findings.md`.

9. QC and rework gate
- Customer touchpoint: customer usually sees this only as waiting time before completion.
- Internal handoff: technician hands repaired device to QC, primarily Roni; failed QC routes back to the technician.
- Systems involved: Monday QC-related fields; main status; QC By / QC Time; workshop physical QC queue.
- Automation state: manual QC, manual fail/pass movement; no dedicated live QC status column yet.
- Delay points and failure modes: QC is a known bottleneck because Roni spans QC, parts, and BM diagnostics. No structured QC checklist is documented. Rework burden is material in the team audits.
- Sources: `/home/ricky/kb/operations/qc-workflow.md`; `team-operations-summary.md`; `findings.md`.

10. Ready-to-collect notification
- Customer touchpoint: customer receives the `ready-walkin` or `ready-warranty` Intercom reply when the job reaches collection readiness.
- Internal handoff: workshop completion hands the job back to customer-service / front desk for collection.
- Systems involved: Monday `Ready To Collect`; VPS `status-notifications`; Intercom.
- Automation state: automated customer update if Monday status and Intercom ID are correct.
- Delay points and failure modes: the documented automation sends one completion notice, but there is no verified reminder cadence for jobs that sit in `Ready To Collect` or stale post-completion states.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`.

11. Payment and collection
- Customer touchpoint: customer pays in store if not prepaid and collects the device.
- Internal handoff: front desk / customer-service closes the loop after the workshop marks the job complete.
- Systems involved: Monday payment fields; SumUp for walk-in card payments; cash; Xero invoicing when the path is invoice-based.
- Automation state: payment collection can be digital or manual, but reconciliation back into Monday is not working reliably.
- Delay points and failure modes: Ricky confirmed the business is currently blind on payment status across Monday, Xero, Stripe, and SumUp. Monday payment fields are unreliable and there is no owner for payment-received write-back.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `platform_inventory/xero.md`; `findings.md`.

## Communication Gaps

- The walk-in form path is verified, but there is no verified evidence that every walk-in is forced through a complete structured intake, so some reception-to-tech handoffs may still rely on partial notes or memory.
- Customer updates are automated only for selected status events. There is no verified proactive reminder pattern for jobs stuck in `Awaiting Confirmation`, `Client Contacted`, `Quote Sent`, `Repair Paused`, or `Awaiting Part`.
- Quote acceptance timing is not tracked cleanly in Monday. Ricky confirmed Intercom conversation timing and Xero invoice creation are the best current proxies.
- Payment closure is opaque to the customer-service and ops teams because paid state does not reliably write back into Monday.

## Delay Points

- Walk-in repair is not slow in the median case: `Received -> Date Repaired` median is `1 day`.
- Walk-in diagnostics are the longer path: `Received -> Diagnostic Complete` median is `1 day`, but `Received -> Date Repaired` median is `7 days`.
- The long tail is the real problem: `75` open items already have `Diag. Complete` but no `Quote Sent`, and the board carries `900` non-terminal items with heavy stale debt.
- Queue hygiene, customer-wait states, and rework/QC loops are stronger delay drivers than raw workstation count.

## Improvement Opportunities

- Enforce one intake entry standard for walk-ins so every device has verified passcode, stock check, turnaround, and pre-check evidence before it reaches a technician.
- Add ageing rules and ownership for `Diagnostic Complete` without quote, `Quote Sent` without response, and `Repair Paused` / `Awaiting Part` cases.
- Split repair status, comms status, QC status, and shipping status as already proposed in the Monday target-state design so customer waiting and workshop work are visible separately.
- Make payment write-back into Monday a first-class rebuild track; walk-in closure cannot stay dependent on unreliable manual finance fields.

## Unknowns And Assumptions

- [ASSUMPTION] A human front-desk/intake operator still supplements the digital walk-in form in person; the current named owner is unresolved after Adil's dismissal.
- [ASSUMPTION] Some walk-in jobs may start from Shopify-paid walk-in products rather than the Typeform path; both routes are evidenced, but their live usage split is unknown.
- Unknown: whether any automated no-show, dormant-ready, or unpaid-collection follow-up exists for walk-in jobs.

## Sources

- `timing-mapping.md`
- `findings.md`
- `team-operations-summary.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `/home/ricky/kb/operations/intake-flow.md`
- `/home/ricky/kb/operations/queue-management.md`
- `/home/ricky/kb/operations/qc-workflow.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/kDfU2wWWv207T24J.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/AubY0Rvhhvgp4GJ1.json`
- `/home/ricky/builds/monday/repair-flow-traces.md`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`

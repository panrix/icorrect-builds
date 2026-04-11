# Mail-In / Send-In Customer Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- Verified entry paths include Shopify order creation, Intercom/email-led intake, and telephone orders that can become manual Monday items but should still link back to Intercom.
- Monday is the canonical operational record after the case is created.
- Current status notifications send through the VPS `status-notifications` service, not the legacy n8n sender.
- Mail-in customers are charged a flat `£20`; iCorrect absorbs any shipping cost above that. Warranty returns are fully absorbed by iCorrect.

## Journey Map

1. Customer starts the mail-in journey
- Customer touchpoint: customer either buys a mail-in repair through Shopify, contacts the business through Intercom/email, or starts via phone and is later converted into a Monday item.
- Internal handoff: customer-service creates or confirms the operational case before any packaging / courier action begins.
- Systems involved: Shopify; Intercom; Monday; phone-to-Slack intake for telephone orders.
- Automation state: Shopify path is automated; Intercom/email/manual paths remain mixed and partly manual.
- Delay points and failure modes: Ricky confirmed the non-Shopify mail-in path is mixed. If it does not originate in Intercom or email, it becomes a manual Monday item, which increases the chance of fragmented context.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `data_flows.md`; `platform_inventory/shopify.md`; `/home/ricky/builds/telephone-inbound/server.py`.

2. Shopify mail-in order is operationalised
- Customer touchpoint: immediate post-checkout confirmation lives in Shopify; behind the scenes the order is pushed into Intercom and Monday.
- Internal handoff: ecommerce order becomes a support ticket and a workshop job.
- Systems involved: Shopify trigger `orders/create`; n8n Cloud; Intercom ticket; Monday main board `349212843`; Slack `shopify-orders`.
- Automation state: fully automated for the Shopify path.
- Delay points and failure modes: if duplicate detection or downstream creation fails, the order can remain siloed in Shopify. The draft workflow defaults to `Mail-In` unless the line items explicitly indicate `Walk-In`, so product naming quality matters.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `data_flows.md`; `platform_inventory/shopify.md`.

3. Monday item is created with remote-service details
- Customer touchpoint: customer does not see this directly, but this step determines whether future updates work.
- Internal handoff: customer-service and operations now share one Monday job linked to the Intercom conversation.
- Systems involved: Monday group `new_group77101__1`; `status4 = Awaiting Confirmation`; `service = Mail-In`; payment/source/address fields; Intercom URL and conversation ID.
- Automation state: automated in the Shopify order flow; manual in the mixed non-Shopify path.
- Delay points and failure modes: if the Intercom ID is missing or the item is created manually without the same fields, later automated messaging and traceability degrade. The main board also contains `127` stale `Awaiting Confirmation` items with median age `810` days.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`; `findings.md`; `timing-mapping.md`.

4. Booking confirmation and packaging / courier instructions are sent
- Customer touchpoint: customer receives booking confirmation and then either packaging / Royal Mail instructions or courier updates, depending on the remote path.
- Internal handoff: Monday status changes trigger the status-notification sender; customer-service owns the messaging layer.
- Systems involved: Monday `status4`; VPS `status-notifications` service; Intercom; Typeform pre-repair link; Royal Mail tracking field `text53`; optional Gophr fields.
- Automation state: automated for the documented status/template routes.
- Delay points and failure modes: the templates only fire for documented states and require the Intercom ID. Missing or incorrect status usage means the customer waits without a proactive update. The service was cut over on 2026-04-01, so stale docs that describe only the old n8n sender are no longer current.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`; `findings.md`.

5. Customer completes pre-repair questions
- Customer touchpoint: standard non-corporate mail-in customers receive the pre-repair Typeform link asking for issue, passcode, previous repairs, backup, and consent information.
- Internal handoff: completed form responses are written back into Monday and optionally into Intercom so the workshop gets structured context before the device arrives or before work starts.
- Systems involved: Typeform `sDieaFMs`; n8n workflow `Typeform To Monday Pre-Repair Form Responses (v2)`; Monday; Intercom; Slack exception alerts.
- Automation state: automated enrichment with exception handling.
- Delay points and failure modes: if hidden fields are missing or the item is in the wrong group, the workflow sends Slack alerts instead of silently fixing the record. If the form is not matched, the workshop starts with weaker context.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/AubY0Rvhhvgp4GJ1.json`; `platform_inventory/typeform.md`.

6. Device arrives and is marked received
- Customer touchpoint: customer may receive the `received-remote` notification once the job is marked `Received`.
- Internal handoff: inbound logistics hands the parcel into intake/front desk, then into the workshop queue.
- Systems involved: Monday `status4 = Received`; `date4`; main board groups such as `Incoming Future` and `Today's Repairs`.
- Automation state: physical receipt is manual; date population and customer notification are automated once the right status is set.
- Delay points and failure modes: no verified live trigger has been found for the exact moment packaging is sent, only for the related customer notification. Intake docs also say there is no consistent live intake SOP, so receipt quality varies.
- Sources: `/home/ricky/kb/operations/intake-flow.md`; `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/intake-system/SPEC.md`.

7. Diagnostics, quote, and invoice path
- Customer touchpoint: customer receives diagnosis/quote emails via Intercom and may receive Xero-backed invoice requests.
- Internal handoff: technician diagnoses; Ferrari/customer-service communicates the quote; approved jobs move back into the technician queue.
- Systems involved: Monday statuses `Diagnostics`, `Diagnostic Complete`, `Quote Sent`, `Invoiced`, `Queued For Repair`; Intercom; Xero draft invoice workflow.
- Automation state: workshop work and quote sending are manual; Xero draft creation is automated only after a Monday-triggered `Create Invoice` action.
- Delay points and failure modes: overall quote lag is not the main issue, but mail-in diagnostics are slower than walk-ins. Median `Received -> Diagnostic Complete` is `4 days` for mail-in diagnostic jobs, and `Received -> Date Repaired` is `8 days`. The post-diagnostic exception set and poor payment-state visibility remain major failure points.
- Sources: `timing-mapping.md`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `platform_inventory/xero.md`; `findings.md`.

8. Repair, paused states, and QC
- Customer touchpoint: customer may only hear from the business if status automation fires or staff manually follow up.
- Internal handoff: approved work moves from Ferrari/customer-service back to the technician queue, then to QC.
- Systems involved: Monday technician groups; `Repair Paused`; `Awaiting Part`; `Client To Contact`; QC fields; parts board relations.
- Automation state: manual repair and QC; selected customer updates automated from status changes only.
- Delay points and failure modes: mail-in traces show repeated pause loops, courier statuses mixed into the main status history, and cases that bounce between customer-wait and repair stages. Queue docs explicitly say there is no SLA tracking or bottleneck detection.
- Sources: `/home/ricky/builds/monday/repair-flow-traces.md`; `/home/ricky/kb/operations/queue-management.md`; `/home/ricky/kb/operations/qc-workflow.md`.

9. Return courier is booked
- Customer touchpoint: customer receives the `return-courier` or `return-courier-warranty` message with Royal Mail tracking when the return is booked.
- Internal handoff: workshop completion hands the job into outbound logistics / customer-service for shipment back.
- Systems involved: Monday `status4 = Return Booked`; outbound tracking `text53`; VPS status-notification service; Royal Mail.
- Automation state: customer notification is automated once tracking and status are present; physical label purchase / dispatch for standard repairs is not otherwise fully mapped in this audit.
- Delay points and failure modes: if tracking is not written back into Monday, the return notification cannot carry a valid link. The business also absorbs shipping cost above the customer’s flat `£20` fee, so remote jobs can look healthier than they are unless logistics cost is included.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `findings.md`.

10. Delivery, completion, and payment closure
- Customer touchpoint: customer receives the repaired device back and may need to settle invoice balances if the job was not prepaid.
- Internal handoff: outbound logistics closes the physical journey; finance/payment closure should update the Monday job but currently does not reliably do so.
- Systems involved: Royal Mail / courier; Monday payment fields; Xero; Stripe / SumUp where relevant.
- Automation state: shipping comms are partially automated; payment reconciliation back into Monday is currently broken.
- Delay points and failure modes: Ricky confirmed there is no reliable reconciliation loop between Xero, Stripe, SumUp, and Monday. For remote jobs, this means customer-facing completion can be clear while internal paid-state remains uncertain.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `platform_inventory/xero.md`; `findings.md`.

## Communication Gaps

- Mixed non-Shopify entry means some mail-in jobs begin with less structure than the Shopify-triggered path.
- The customer gets proactive updates only at documented status checkpoints; there is no verified automated chase flow for `Awaiting Confirmation`, `Client Contacted`, `Quote Sent`, `Awaiting Part`, or long-delayed returns.
- Quote-acceptance timing is not tracked cleanly, so customer-service cannot see a trustworthy end-to-end wait time from quote to approval.
- Payment closure remains opaque after shipment or return because Monday paid-state is not trustworthy.

## Delay Points

- Mail-in diagnostic jobs are materially slower than walk-ins in the current evidence: median `Received -> Diagnostic Complete` is `4 days`, and median `Received -> Date Repaired` is `8 days`.
- Mail-in repair jobs are faster than mail-in diagnostics but still slower than simple walk-ins: median `Received -> Date Repaired` is `4 days`.
- Remote journeys carry extra logistics dependencies before and after workshop work, and shipping spend is large enough to erode margin if not tracked explicitly.
- Stale Monday queue debt means remote jobs can disappear into non-terminal states that are not being actively managed.

## Improvement Opportunities

- Standardise the non-Shopify mail-in intake path so email, Intercom, phone, and Shopify create the same minimum Monday + Intercom package.
- Add ageing and owner rules for `Awaiting Confirmation`, `Quote Sent`, `Awaiting Part`, and `Return Booked` remote jobs.
- Tie packaging dispatch, device receipt, and outbound return into one visible remote-job timeline rather than separate partial surfaces.
- Fix payment write-back into Monday before adding more remote volume; the business cannot manage profitable remote operations while paid-state is blind.

## Unknowns And Assumptions

- [ASSUMPTION] Manual Monday-created mail-ins should include the same Intercom linkage and address fields as the Shopify path; Ricky confirmed that they should link back to Intercom, but the exact current manual checklist is undocumented.
- Unknown: the exact live trigger that sends packaging, beyond the customer-facing mail-in template.
- Unknown: whether there is any consistent outbound-dispatch runtime for standard repair returns comparable to the BM resale dispatch path.

## Sources

- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `timing-mapping.md`
- `findings.md`
- `data_flows.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/fuVSFQvvJ1GRPkPe.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/AubY0Rvhhvgp4GJ1.json`
- `/home/ricky/kb/operations/intake-flow.md`
- `/home/ricky/kb/operations/queue-management.md`
- `/home/ricky/kb/operations/qc-workflow.md`
- `/home/ricky/builds/monday/repair-flow-traces.md`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`

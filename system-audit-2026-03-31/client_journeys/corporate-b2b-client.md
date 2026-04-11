# Corporate / B2B Client Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- Ricky confirmed that corporate/B2B currently relies only on `Client = Corporate`; there are no hidden corporate-only boards or automations evidenced in this audit.
- The verified live corporate web-enquiry path is the Shopify contact-form workflow that creates/reuses Intercom contact + company records, creates a corporate ticket, and sends Slack.
- Once a repair exists in Monday, corporate jobs follow the same main-board workflow shape as other jobs, with a few different notification rules and finance implications.

## Journey Map

1. Corporate enquiry begins
- Customer touchpoint: website corporate form, direct email/Intercom, or other account-led contact. The live website path is the best-verified one.
- Internal handoff: the enquiry moves from the website/contact surface into customer-service.
- Systems involved: Shopify contact-form endpoint `shopify-contact-form`; n8n Cloud; Intercom; Slack.
- Automation state: automated for the verified website path.
- Delay points and failure modes: the workflow returns browser success before all downstream Intercom and Slack side effects are guaranteed complete. That is acceptable for user UX but weak for deterministic ops.
- Sources: `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/tNQphRiUo0L8SdBn.json`; `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`.

2. Intercom contact, company, and ticket are created
- Customer touchpoint: the customer’s enquiry is now associated with their company in Intercom.
- Internal handoff: customer-service gets a structured company-linked record instead of just a free-text email.
- Systems involved: Intercom contact; Intercom company with fields such as `Payment Method`, `Company Address`, `Corporate Account Item ID`; ticket type `2985889`; Slack `#corporate-onboarding`.
- Automation state: automated in the corporate website path.
- Delay points and failure modes: the contact-form estate is mixed-mode. Corporate has the strongest direct-ticket proof, but the workflow still depends on asynchronous side effects after the HTTP success response.
- Sources: `platform_inventory/intercom.md`; `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`; `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/tNQphRiUo0L8SdBn.json`.

3. Corporate job is created or classified in Monday
- Customer touchpoint: none directly.
- Internal handoff: customer-service converts the account enquiry into an operational repair item, flagged as corporate.
- Systems involved: Monday main board; `Client = Corporate`; company field `text15`.
- Automation state: mixed. The corporate contact-form proves Intercom-side setup, but current docs do not prove one dedicated automated Monday item-creation path after that step.
- Delay points and failure modes: because there is no separate corporate workflow layer beyond `Client = Corporate`, corporate jobs compete in the same overloaded board as other work and depend on staff correctly classifying them.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `/home/ricky/kb/monday/main-board.md`; `data_flows.md`.

4. Booking / intake handling differs slightly from retail
- Customer touchpoint: booking confirmation, courier details, or account-specific intake steps.
- Internal handoff: customer-service passes the job into intake/workshop while preserving account context.
- Systems involved: Monday; status notifications; intake specs with `corporate_profiles` concept and passcode exceptions.
- Automation state: status-triggered customer notifications are automated, but the actual account-rule handling is more policy-driven than system-enforced today.
- Delay points and failure modes: status-notification templates suppress the standard Typeform link for `Corporate`, but there is no separate proven structured intake replacement in the live journey. That creates a risk of skipping consumer-only friction without replacing it with a better corporate handoff packet.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `/home/ricky/builds/intake-system/SPEC.md`; `/home/ricky/builds/webhook-migration/verification/status-notifications-live-cutover-2026-04-01.md`.

5. Repair follows the main workshop flow
- Customer touchpoint: customers see normal progress only through manual comms or the standard status-notification checkpoints that apply to their service type.
- Internal handoff: intake/front desk -> technician queue -> technician -> QC -> account/customer-service.
- Systems involved: Monday main board; tech groups; QC; Intercom.
- Automation state: workshop execution is manual; selected messaging is automated from Monday statuses.
- Delay points and failure modes: corporate work shares the same main-board queue debt and communication bottlenecks as retail work. There is no dedicated corporate WIP view in the audited estate.
- Sources: `/home/ricky/kb/operations/queue-management.md`; `/home/ricky/kb/operations/qc-workflow.md`; `findings.md`.

6. Quotes and approvals are handled through the same comms layer
- Customer touchpoint: quote email, follow-up, approval, and invoice discussion.
- Internal handoff: technician diagnoses; Ferrari/customer-service handles quote and approval; approved work returns to the bench.
- Systems involved: Monday quote statuses; Intercom email path; Xero draft invoice creation when used.
- Automation state: quote sending is manual in Intercom; draft invoice creation is automated only when the relevant Monday action is triggered.
- Delay points and failure modes: quote acceptance is not tracked cleanly, and corporate jobs are explicitly part of the broader “no clean payment/reconciliation loop” problem. This is worse for B2B because accounts receivable stays open after work is finished.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `platform_inventory/xero.md`; `findings.md`.

7. Corporate invoice is created in Xero
- Customer touchpoint: corporate customer receives an invoice / payment request rather than retail-style pay-on-collection in many cases.
- Internal handoff: operations hands the financial closure step into Xero.
- Systems involved: Monday `Invoice Action`; active n8n workflow `Xero Invoice Creator`; Xero draft invoices; Monday Xero invoice ID / URL fields.
- Automation state: draft creation is automated; downstream send/payment write-back is not deployed as a working live loop.
- Delay points and failure modes: this is the biggest corporate journey gap. Current evidence shows draft invoices can be created, but there is no current owner for payment-received write-back, and Ricky confirmed the business is blind on payment status.
- Sources: `platform_inventory/xero.md`; `MASTER-QUESTIONS-FOR-JARVIS.md`; `findings.md`.

8. Job completion, collection/return, and receivables follow-up
- Customer touchpoint: device is collected or returned; invoice may still be outstanding afterward.
- Internal handoff: workshop completes the job, but finance collections remain partly manual and weakly tied back into the ops record.
- Systems involved: Monday completion statuses; shipping/status notifications where relevant; Xero receivables.
- Automation state: mixed. Operational completion exists; finance closure is incomplete.
- Delay points and failure modes: live Xero shows corporate receivables are real and current, but there is no closed loop from Xero payment back into Monday. This creates both customer-service ambiguity and AR risk.
- Sources: `platform_inventory/xero.md`; `findings.md`.

## Communication Gaps

- Corporate customers skip the normal pre-repair Typeform link, but there is no verified replacement structured intake workflow that guarantees the workshop receives equivalent context.
- Browser success on the corporate contact form does not guarantee all downstream Intercom/company/ticket/Slack side effects have completed.
- There is no evidenced corporate-only SLA/reporting surface once the job is on Monday; account work shares the same noisy queue and comms bottlenecks as everyone else.
- Invoice/payment follow-up is the largest gap: finance state is not reliably written back into ops.

## Delay Points

- Corporate repair jobs are not obviously slow in the median simple case: current metrics show median `Received -> Date Repaired` of `0 days` for the corporate repair slice and `7 days` for corporate diagnostic work.
- The real delay risk is in quote/comms exceptions, invoicing, and receivables follow-up rather than bench time alone.
- Because there is no separate corporate ops layer, corporate jobs can sit in generic stale states that do not reflect account urgency or contractual expectations.

## Improvement Opportunities

- Build a minimum corporate intake / account-handoff standard to replace the skipped consumer Typeform path.
- Add a guaranteed Monday item-creation step from the corporate contact-form flow so company-linked enquiries cannot stay only in Intercom.
- Make Xero send + payment-received write-back an owned corporate workflow, not just a draft-invoice creation step.
- Add corporate-specific ageing and account-owner views for quote pending, invoice pending, and outstanding receivables.

## Unknowns And Assumptions

- Unknown: the exact current operational path for corporate jobs that begin outside the verified website form.
- [ASSUMPTION] The same frontline staff who manage retail comms also manage much of the corporate day-to-day because no separate corporate workflow team is evidenced.
- Unknown: whether any standing customer-specific passcode or billing rules are actually stored and reused today, beyond the design intent in the intake spec and the company attributes visible in Intercom.

## Sources

- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `timing-mapping.md`
- `findings.md`
- `team-operations-summary.md`
- `platform_inventory/intercom.md`
- `platform_inventory/xero.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/n8n/active/tNQphRiUo0L8SdBn.json`
- `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`
- `/home/ricky/builds/intake-system/SPEC.md`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/kb/monday/main-board.md`
- `/home/ricky/kb/operations/queue-management.md`
- `/home/ricky/kb/operations/qc-workflow.md`

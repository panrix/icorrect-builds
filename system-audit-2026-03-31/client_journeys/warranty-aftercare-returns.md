# Warranty, Aftercare, And Returns Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- This file covers three distinct but overlapping paths:
  - website-origin warranty claims for iCorrect customers
  - warranty-specific status-notification flows on the main board
  - BM buyer returns / aftercare after resale
- The live website warranty workflow still uses the older SMTP-to-Intercom pattern and then repairs attribution with a delayed contact-swap step.
- BM returns and aftercare remain mostly manual; BM `/ws/sav` is not currently functional.

## Journey Map

1. Customer raises a warranty or aftercare issue
- Customer touchpoint: website warranty page/form, direct email/Intercom follow-up, or BM buyer return request through BM.
- Internal handoff: the issue is routed into Intercom (website path) or manual BM/ops handling (BM return path).
- Systems involved: website warranty form; n8n `Warranty Claim Form`; Intercom; BM dashboard/email.
- Automation state: website warranty intake is automated; BM return detection is not.
- Delay points and failure modes: website and BM aftercare do not share one canonical system. This is the core fragmentation problem in the current state.
- Sources: `data_flows.md`; `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`; `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`.

2. Website warranty claim is parsed and acknowledged
- Customer touchpoint: customer submits name, contact, repair date, device, and issue; the webhook returns a success message promising review within `24 hours`.
- Internal handoff: the website hands the claim into the support mailbox / Intercom ingress.
- Systems involved: n8n webhook `warranty-claim`; validation code; SMTP send from `michael.f@icorrect.co.uk` to `support@icorrect.co.uk`.
- Automation state: automated on receipt.
- Delay points and failure modes: the customer promise is explicit, but the current measured Intercom response layer is inconsistent, so the promise is not strongly backed by the ops data. Warranty still rides the old SMTP-authored conversation pattern.
- Sources: `/home/ricky/builds/webhook-migration/discovery/n8n-exports/warranty-claim.json`; `timing-mapping.md`; `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`.

3. Intercom conversation is repaired after the email send
- Customer touchpoint: none directly, but this decides whether the conversation is linked to the real customer rather than the sender mailbox.
- Internal handoff: delayed workflow logic swaps the original sender contact for the real customer contact in Intercom.
- Systems involved: n8n wait node (`45` seconds); Intercom conversation search; contact search/create; add/remove conversation customer calls.
- Automation state: automated, but asynchronous and fragile.
- Delay points and failure modes: the workflow returns success before the delayed reconciliation finishes. If the conversation is not found or the contact swap fails, attribution remains weak.
- Sources: `/home/ricky/builds/webhook-migration/discovery/n8n-exports/warranty-claim.json`; `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`.

4. Human support handles the warranty case in Intercom
- Customer touchpoint: email/Intercom back-and-forth to assess the claim, ask for more information, and arrange the next step.
- Internal handoff: support/customer-service takes ownership after automated intake.
- Systems involved: Intercom; manual support process.
- Automation state: mostly manual after intake.
- Delay points and failure modes: broader Intercom metrics still show too many unanswered conversations and inconsistent response times. Warranty claims are therefore exposed to the same coverage risk as other support work.
- Sources: `timing-mapping.md`; `findings.md`; `platform_inventory/intercom.md`.

5. Warranty job moves into the main repair flow if physical work is required
- Customer touchpoint: the customer may receive warranty-specific booking, courier, ready, or return messages.
- Internal handoff: support/customer-service creates or updates the Monday job and passes it into intake/workshop.
- Systems involved: Monday `Client = Warranty` where relevant; status-notification templates `booking-confirmed-warranty`, `courier-warranty`, `ready-warranty`, and `return-courier-warranty`; Intercom.
- Automation state: selected customer messages automated once the Monday item exists and statuses are maintained.
- Delay points and failure modes: the website warranty workflow itself is separate from the Monday-triggered comms path, so warranty handling can start in Intercom without a clean operational repair record yet.
- Sources: `/home/ricky/builds/monday/services/status-notifications/templates.js`; `data_flows.md`.

6. BM buyer raises a return / aftercare issue
- Customer touchpoint: BM buyer submits a return request or complaint through BM notifications, dashboard, or email.
- Internal handoff: BM-side issue enters iCorrect’s manual aftercare loop.
- Systems involved: BM dashboard; BM notifications/email; manual checks; Telegram.
- Automation state: manual detection in current state.
- Delay points and failure modes: SOP 12 explicitly says there is no automated return detection. This makes it easy to miss buyer issues or handle them too slowly.
- Sources: `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`; `findings.md`.

7. BM return is acknowledged and the device is awaited back
- Customer touchpoint: buyer expects acknowledgement within BM SLA and a clear return path.
- Internal handoff: support/ops acknowledges the return, then waits for the device to come back physically.
- Systems involved: BM dashboard / messaging; manual internal coordination.
- Automation state: manual.
- Delay points and failure modes: because `/ws/sav` is not functional, there is no reliable API-backed aftercare workflow. This is one of the least systematised parts of the BM estate.
- Sources: `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`.

8. Returned device is received and re-assessed
- Customer touchpoint: buyer may be waiting for refund/replacement resolution while the device is inspected.
- Internal handoff: inbound returns handling passes the device into reassessment, grading, and disposition.
- Systems involved: BM Devices `BM Returns` group `new_group_mkmybfgr`; Main Board final grade; Monday comments; Telegram.
- Automation state: manual move and manual reassessment.
- Delay points and failure modes: every return requires human reassessment before relist/repair/BER. There is no automatic relisting or structured checklist enforced by the current tools.
- Sources: `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`.

9. Return disposition is decided
- Customer touchpoint: refund, replacement, or resolution depends on what reassessment finds.
- Internal handoff: reassessment hands the case into relist, repair, BER, or dispute handling.
- Systems involved: Monday `status24`; BM Devices fields cleared or updated; later listing or repair systems.
- Automation state: manual decisioning.
- Delay points and failure modes: if the wrong device was shipped or buyer fraud is suspected, escalation goes directly to Ricky and BM support. These are high-friction exception loops with little automation support.
- Sources: `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`.

10. Related exception path: trade-in counter-offer after receipt
- Customer touchpoint: the original BM seller may be asked to accept a lower payout if the received device does not match the declared condition/spec.
- Internal handoff: automated mismatch detection hands the case into human approval and then BM counter-offer submission.
- Systems involved: `icloud-checker`; Slack buttons; BM counter-offer API; Monday `status24 = Counteroffer`.
- Automation state: partial automation with human decision gate.
- Delay points and failure modes: customer can take up to `7` days to respond; if no response arrives, BM auto-accepts. This is a seller-side aftercare/exception path, not a smooth operational flow.
- Sources: `/home/ricky/builds/backmarket/sops/02-intake-receiving.md`; `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`.

## Communication Gaps

- Website warranty claims still enter through the older SMTP-authored pattern, not a clean direct Intercom ticket path.
- The warranty webhook promises a `24 hour` review window, but broader Intercom evidence shows response consistency is still weak.
- There is no unified case-management surface covering warranty intake, physical repair handling, and finance/closure.
- BM aftercare has the largest gap of all: return detection is manual and `/ws/sav` is non-functional.

## Delay Points

- Warranty claims can stall between the initial Intercom email thread and creation/update of the operational Monday repair.
- BM buyer returns stall at the monitoring and acknowledgement stage because detection is manual.
- Returned devices require full human reassessment before any relist/repair/BER action, so aftercare ties up skilled attention.
- Counter-offers can freeze seller resolution for up to `7` days.

## Improvement Opportunities

- Replace the warranty SMTP-to-Intercom hack with direct ticket creation tied immediately to the real customer contact.
- Add a mandatory Monday linkage step for warranty cases that require physical work so warranty service can be aged and owned like other operations.
- Build BM return detection into Monday/Slack/Telegram so aftercare stops depending on manual dashboard checks.
- Create one aftercare owner map and SLA set across warranty, BM returns, and trade-in disputes.

## Unknowns And Assumptions

- Unknown: the exact live rate at which website warranty claims are converted into Monday repair items.
- [ASSUMPTION] Some non-BM aftercare also enters via ordinary Intercom/email threads outside the dedicated warranty form; the dedicated form is the best-verified path, but not necessarily the only one.
- Unknown: whether any hidden manual spreadsheet, queue, or Slack convention is being used to track open warranty cases.

## Sources

- `data_flows.md`
- `timing-mapping.md`
- `findings.md`
- `platform_inventory/intercom.md`
- `/home/ricky/builds/webhook-migration/discovery/n8n-exports/warranty-claim.json`
- `/home/ricky/builds/webhook-migration/research-shopify-intercom-phase0-2026-04-01.md`
- `/home/ricky/builds/monday/services/status-notifications/templates.js`
- `/home/ricky/builds/backmarket/sops/02-intake-receiving.md`
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`

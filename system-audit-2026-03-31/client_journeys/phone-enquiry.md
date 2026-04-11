# Phone Enquiry Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- The verified phone-intake path is Slack `/call` -> `telephone-inbound` on port `8003`.
- Phone orders can go directly into Monday, but Ricky confirmed that phone-led mail-ins should still link back to Intercom.
- The phone intake tool is an operator router, not a full customer-service workflow: staff choose whether to create Slack-only, Intercom-only, or Intercom+Monday records.

## Journey Map

1. Customer phones the business
- Customer touchpoint: live phone call.
- Internal handoff: whoever answers the phone captures the call into the Slack-based intake tool.
- Systems involved: phone call; Slack slash command `/call`; `telephone-inbound`.
- Automation state: manual start by staff, then automated modal rendering.
- Delay points and failure modes: if the call is not logged, there is no verified backup system that automatically creates the customer-service or ops record.
- Sources: `data_flows.md`; `/home/ricky/builds/telephone-inbound/server.py`.

2. Staff completes the Slack modal
- Customer touchpoint: none directly, but this determines whether the enquiry is actionable later.
- Internal handoff: call context is formalised into structured fields for customer-service and/or ops.
- Systems involved: Slack modal fields for name, email, phone, device category, model, fault, notes, and action choice.
- Automation state: automated modal, manual data entry.
- Delay points and failure modes: the quality of follow-up depends entirely on the operator’s manual capture. There is no evidence of mandatory validation beyond the modal inputs themselves.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`.

3. Staff chooses the record-creation path
- Customer touchpoint: none directly.
- Internal handoff: the operator chooses how far the call propagates into business systems.
- Systems involved: action values `log_only`, `intercom_only`, `intercom_monday`.
- Automation state: manual decision by operator; downstream branching automated.
- Delay points and failure modes: `log_only` deliberately leaves the enquiry out of Monday and Intercom until a later human action. `intercom_only` creates customer-service context but no ops job. This is a built-in lead-loss risk.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`; `MASTER-QUESTIONS-FOR-JARVIS.md`.

4. Slack summary is posted to the phone-enquiries channel
- Customer touchpoint: none directly.
- Internal handoff: the call becomes visible to the wider team in Slack.
- Systems involved: Slack channel `C09TBEMJA2H`.
- Automation state: automated posting after form submission.
- Delay points and failure modes: Slack visibility does not equal ownership. A Slack-only record can be forgotten if nobody triggers the deferred actions later.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`.

5. Intercom lead/contact is optionally created
- Customer touchpoint: future follow-up can now happen through Intercom if this branch is selected.
- Internal handoff: phone enquiry moves into the customer-service system.
- Systems involved: Intercom contact search/create using email or phone.
- Automation state: automated if `intercom_only` or `intercom_monday` is selected.
- Delay points and failure modes: if the operator chooses `log_only`, the customer never gets an Intercom record at this stage. Broader Intercom response performance is still inconsistent, with `27` of `58` March-window customer-facing conversations unanswered in the live sample.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`; `timing-mapping.md`; `findings.md`.

6. Monday repair item is optionally created
- Customer touchpoint: none directly, but this is the point where the enquiry becomes workshop-visible.
- Internal handoff: customer-service intake becomes an ops job on the main board.
- Systems involved: Monday board `349212843`; attempted target group `new_group` (`Today's Repairs` in the current server code comment); fields including `status4 = New Repair`, `service = Unconfirmed`, `status = Unconfirmed`, source `Phone`, and `Not Filled` info-capture flag.
- Automation state: automated if `intercom_monday` is selected.
- Delay points and failure modes: the server code comment still says the group ID “will verify”, so the group target is operationally fragile. If only Intercom is created, the enquiry can progress in customer-service without an ops object.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`; `data_flows.md`.

7. Optional device and repair-product linkage happens
- Customer touchpoint: none directly.
- Internal handoff: the phone enquiry is enriched with device/product references that can later reduce workshop ambiguity.
- Systems involved: Monday Devices board `3923707691`; Products & Pricing board `2477699024`; fuzzy matching in the phone server.
- Automation state: automated lookup after operator entry.
- Delay points and failure modes: device and product matching are fuzzy. Weak model text can lead to no link or a poor match, leaving the Monday item under-specified.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`; `/home/ricky/kb/monday/board-relationships.md`.

8. Deferred action buttons appear for follow-up
- Customer touchpoint: none directly; these buttons shape internal follow-up.
- Internal handoff: the enquiry can later be converted from Slack into customer-service or ops actions.
- Systems involved: Slack buttons for creating Monday and/or Intercom later, plus buttons labeled `Send Quote`, `Book Appointment`, `Send Follow-up`, and `Resolved` when a Monday item is created.
- Automation state: button rendering is automated.
- Delay points and failure modes: the audit has not yet traced the downstream business effect of the follow-up buttons. This is a live observability gap.
- Sources: `/home/ricky/builds/telephone-inbound/server.py`; `platform_inventory/vps-webhooks.md`.

9. Enquiry enters the normal repair/comms pipeline only if promoted
- Customer touchpoint: quote, appointment, or follow-up happens only after someone pushes the phone enquiry into the standard Intercom/Monday process.
- Internal handoff: phone intake must hand off into Ferrari/customer-service and then, if relevant, to the workshop.
- Systems involved: Intercom; Monday; later walk-in/mail-in journey surfaces.
- Automation state: mostly manual after the initial capture.
- Delay points and failure modes: there is no verified automatic no-touch path from phone call to booked repair. The operator’s initial action choice controls whether the lead is actionable or stranded.
- Sources: `MASTER-QUESTIONS-FOR-JARVIS.md`; `walk-in-customer.md`; `mail-in-send-in-customer.md`.

## Communication Gaps

- `log_only` intentionally creates a gap: the customer enquiry exists only in Slack until someone converts it.
- The follow-up buttons are visible, but their downstream handling has not been fully traced in this audit.
- Phone-originated enquiries inherit the same Intercom response-speed problem as other channels once they enter Intercom.
- There is no verified canonical SLA or chase rule for unconverted phone enquiries sitting only in Slack.

## Delay Points

- The main delay is before the repair journey even starts: operator choice can leave the enquiry in Slack only.
- If the item is created in Intercom but not Monday, the customer-service side can move while workshop scheduling does not.
- Once promoted into Intercom, the broader customer-response problem still applies: the March-window sample showed a median reply time of `6.39h` for email and a `45%` unanswered rate overall.

## Improvement Opportunities

- Remove or heavily constrain `log_only` for revenue-bearing phone calls so every real enquiry gets at least an Intercom record and usually a Monday item.
- Verify and document the real target Monday group and downstream button handlers.
- Add SLA / ageing alerts for phone enquiries that remain Slack-only or Intercom-only beyond a short threshold.
- Standardise phone-led mail-in and walk-in creation so the same minimum data package reaches Monday and Intercom every time.

## Unknowns And Assumptions

- Unknown: exact downstream handlers for `Send Quote`, `Book Appointment`, `Send Follow-up`, and `Resolved`.
- [ASSUMPTION] Staff use `/call` consistently for inbound repair enquiries; the audit verifies the tool exists and is live, but not total adoption rate.
- Unknown: whether any phone-originated payment-link or booking-link flow exists beyond manual follow-up.

## Sources

- `data_flows.md`
- `timing-mapping.md`
- `findings.md`
- `MASTER-QUESTIONS-FOR-JARVIS.md`
- `platform_inventory/vps-webhooks.md`
- `/home/ricky/builds/telephone-inbound/server.py`

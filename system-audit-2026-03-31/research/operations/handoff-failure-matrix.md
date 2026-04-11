# Cross-Journey Handoff Failure Matrix

Date: 2026-04-02

Scope: all 8 journey files in `client_journeys/`, `client_journeys/_meta.md`, `findings.md`, `team-operations-summary.md`, `timing-mapping.md`, `systems-architecture.md`, `MASTER-QUESTIONS-FOR-JARVIS.md`, `/home/ricky/kb/operations/intake-flow.md`, `/home/ricky/kb/operations/queue-management.md`, `/home/ricky/kb/operations/qc-workflow.md`, `/home/ricky/builds/monday/automations.md` lines 1-150, and `/home/ricky/builds/monday/repair-flow-traces.md`.

## Method

- This matrix normalizes repeated handoffs across journeys into one control inventory.
- `Automated acknowledgement` means the receiving system or owner gets a deterministic recorded receipt, not just passive visibility in Slack or Monday.
- `SLA / deadline` means a documented or externally enforced timing rule exists for that handoff.
- `Escalation` means a stall or failure produces a documented automated alert, retry, or routed exception path.
- `ASSUMPTION`: frequency and journey health scoring are directional when the audit has queue/timing evidence but not direct event-volume counts for that exact handoff.

Journey key:
- `WI` = Walk-In
- `MI` = Mail-In / Send-In
- `SH` = Shopify / Online Store
- `PH` = Phone Enquiry
- `CO` = Corporate / B2B
- `BT` = Back Market Trade-In
- `BR` = Back Market Resale
- `WA` = Warranty / Aftercare / Returns

## 1. Handoff Inventory

| ID | From -> To | Journeys | Trigger | System of record | Automated acknowledgement | SLA / deadline | Escalation if it stalls | Evidence |
|---|---|---|---|---|---|---|---|---|
| H01 | Shopify checkout -> Monday + Intercom operational records | SH, MI, WI | Shopify `orders/create` | Shopify, n8n, Monday, Intercom, Slack | Yes | No | No | `shopify-online-purchase.md:30-60`; `mail-in-send-in-customer.md:22-36`; `systems-architecture.md:23`; `findings.md:142-149` |
| H02 | Walk-in Typeform -> Monday + Intercom records | WI | Typeform submit | Typeform, n8n, Monday, Intercom, Slack | Yes | No | Partial | `walk-in-customer.md:15-29`; `_meta.md:31-35`; `systems-architecture.md:25`; `intake-flow.md:148-156` |
| H03 | Corporate web form -> Intercom company/ticket | CO | Shopify contact form submit | Shopify contact form, n8n, Intercom, Slack | Partial | No | No | `corporate-b2b-client.md:13-27`; `systems-architecture.md:27`; `corporate-b2b-client.md:77-82` |
| H04 | Website warranty form -> Intercom claim thread | WA | Warranty webhook submit | n8n webhook, SMTP, Intercom | Yes | Yes | No | `warranty-aftercare-returns.md:24-30`; `warranty-aftercare-returns.md:96-101`; `timing-mapping.md:153-165` |
| H05 | Phone call -> Slack phone-enquiry record | PH | Staff uses `/call` and submits modal | Slack, `telephone-inbound` | Yes | No | No | `phone-enquiry.md:13-43`; `systems-architecture.md:28` |
| H06 | Phone Slack record -> Intercom and/or Monday promotion | PH, MI | Operator chooses `intercom_only` or `intercom_monday` | Slack, Intercom, Monday | Partial | No | No | `phone-enquiry.md:29-59`; `_meta.md:35`; `findings.md:77-84` |
| H07 | Mixed non-Shopify enquiry -> manual Monday repair item | MI, PH, CO | Human converts email/Intercom/phone context into ops item | Intercom, email, Monday | No | No | No | `mail-in-send-in-customer.md:14-20`; `MASTER-QUESTIONS-FOR-JARVIS.md:251-265`; `corporate-b2b-client.md:29-35` |
| H08 | Newly created Monday item / Slack alert -> named human follow-up owner | SH, WI, MI, CO, PH | Item lands in `Awaiting Confirmation`, `Booking Confirmed`, or equivalent new-work state | Monday, Slack | No | No | No | `shopify-online-purchase.md:62-76`; `findings.md:32-39`; `timing-mapping.md:284-320` |
| H09 | Customer-service case -> classified Monday operational job | WA, CO, MI, PH | Human decides physical work is required | Monday, Intercom | No | No | No | `warranty-aftercare-returns.md:48-54,103-115`; `corporate-b2b-client.md:29-35,90-95`; `mail-in-send-in-customer.md:30-36` |
| H10 | Front desk / inbound receiving -> complete intake packet | WI, MI, CO, BT | Device physically arrives and is marked received | Monday, intake notes | No | No | No | `walk-in-customer.md:39-45`; `mail-in-send-in-customer.md:54-60`; `intake-flow.md:24-45,148-156`; `team-operations-summary.md:69-80` |
| H11 | Intake packet -> technician queue / bench-ready job | WI, MI, CO | Status/group move into repair queues | Monday groups, technician column | Partial | No | No | `walk-in-customer.md:55-61`; `mail-in-send-in-customer.md:70-76`; `queue-management.md:52-72`; `MASTER-QUESTIONS-FOR-JARVIS.md:25-38` |
| H12 | Pre-repair form -> shared workshop + customer-service context | WI, MI | Typeform pre-repair submission | Typeform, n8n, Monday, Intercom, Slack | Yes | No | Yes | `walk-in-customer.md:47-53`; `mail-in-send-in-customer.md:46-52`; `_meta.md:31-35` |
| H13 | Technician queue -> actual work start / priority ownership | WI, MI, CO, BT, BR | Tech selection from queue | Monday groups, workshop | No | No | No | `walk-in-customer.md:55-61`; `queue-management.md:40-72`; `findings.md:232-247,286-293` |
| H14 | Diagnostic Complete -> Quote Sent | WI, MI, CO | Tech marks `Diagnostic Complete`; customer-service must send quote | Monday, Intercom | Partial | No | No | `walk-in-customer.md:63-69`; `mail-in-send-in-customer.md:62-68`; `corporate-b2b-client.md:53-59`; `timing-mapping.md:270-320`; `findings.md:178-185` |
| H15 | Quote / invoice sent -> customer response / approval / decision | WI, MI, CO | Quote email / invoice request goes out | Intercom, Xero, Monday proxies | No | No | No | `MASTER-QUESTIONS-FOR-JARVIS.md:54-77`; `walk-in-customer.md:103-108`; `mail-in-send-in-customer.md:96-99`; `timing-mapping.md:360-375` |
| H16 | Approved / invoiced job -> workshop queue | WI, MI, CO | Approval or invoice step completed | Monday | Partial | No | No | `walk-in-customer.md:71-77`; `mail-in-send-in-customer.md:62-76`; `corporate-b2b-client.md:53-67`; `MASTER-QUESTIONS-FOR-JARVIS.md:63-67` |
| H17 | Repaired device -> QC | WI, MI, CO, BT, BR | Status changes to `Repaired` | Monday, QC group | Yes | No | Partial | `qc-workflow.md:35-46`; `automations.md:77-82,120-149`; `walk-in-customer.md:79-85` |
| H18 | QC result -> rework, front desk, return logistics, or listing queue | WI, MI, CO, BT, BR | QC pass/fail decision | Monday, workshop physical queue | Partial | No | No | `qc-workflow.md:35-46,69-87`; `walk-in-customer.md:79-93`; `backmarket-resale-order.md:14-20` |
| H19 | Completion / return-booked milestone -> customer-facing ready / courier communication | WI, MI, CO, WA, SH | Monday status changes to ready / return-booked / booking-confirmed / received | Monday, VPS status notifications, Intercom | Yes | No | No | `walk-in-customer.md:87-93`; `mail-in-send-in-customer.md:38-44,78-84`; `corporate-b2b-client.md:37-43`; `systems-architecture.md:39,63` |
| H20 | Payment taken / invoice paid -> Monday paid-state truth | WI, MI, CO, SH, WA | Payment rail event or Xero payment | Monday, Xero, Stripe, SumUp, Shopify | No | No | No | `findings.md:68-75,160-167,313-338`; `systems-architecture.md:37-39,76-90`; `MASTER-QUESTIONS-FOR-JARVIS.md:122-148` |
| H21 | Monday `Create Invoice` -> Xero draft -> sent/paid write-back | CO, MI, WI | `Invoice Action` on Monday | Monday, n8n, Xero | Partial | No | No | `corporate-b2b-client.md:61-75`; `platform_inventory/xero.md` via cited journey sources; `systems-architecture.md:37-39,78-81`; `findings.md:313-320` |
| H22 | BM `SENT` order -> linked Main Board + BM Devices records | BT | Scheduled poll at `06:00 UTC` | BM API, `sent-orders.js`, Monday, Telegram | Yes | Yes | Yes | `backmarket-tradein.md:22-29`; `systems-architecture.md:34`; `findings.md:340-347` |
| H23 | BM parcel receipt + serial entry -> automated iCloud/spec validation | BT | Staff enters serial into Monday | Monday, `icloud-checker`, Slack | Yes | No | Yes | `backmarket-tradein.md:38-52`; `systems-architecture.md:29`; `backmarket-tradein.md:123-128` |
| H24 | Automated BM exception detection -> human decision | BT, WA | iCloud lock, mismatch, profitability warning, counter-offer | Slack, Monday, BM API | Partial | Yes | Yes | `backmarket-tradein.md:54-84`; `warranty-aftercare-returns.md:88-94`; `team-operations-summary.md:48-54` |
| H25 | BM diagnostic / review complete -> manual `Pay-Out` trigger -> payout service | BT | Human sets `status24 = Pay-Out` | Monday, `bm-payout`, BM, Slack, Telegram | Partial | Yes | Yes | `backmarket-tradein.md:86-108`; `systems-architecture.md:31`; `backmarket-tradein.md:123-128` |
| H26 | Purchased inventory -> `To List` queue -> operator publishes listing | BT, BR | Item reaches `To List`; operator runs `list-device.js` | Monday, BM Devices, listing script | No | No | No | `backmarket-tradein.md:102-108`; `backmarket-resale-order.md:14-36`; `systems-architecture.md:33,61`; `findings.md:358-365` |
| H27 | BM sale accepted -> dispatch / packing ownership | BR | `sale-detection.js` accepts order and writes `Sold` | BM API, Monday, BM Devices, Telegram | Yes | Yes | Partial | `backmarket-resale-order.md:46-60`; `systems-architecture.md:35`; `backmarket-resale-order.md:100-112` |
| H28 | Label bought / parcel packed -> manual `Shipped` status on Monday | BR | Human physically ships device and updates Monday | Royal Mail flow, Monday | No | No | No | `backmarket-resale-order.md:62-84,94-112`; `systems-architecture.md:36`; `findings.md:358-365` |
| H29 | Monday `Shipped` -> BM shipment confirmation | BR | Monday `status4 = Shipped` webhook | Monday, `bm-shipping`, BM, Slack, Telegram | Yes | Yes | Yes | `backmarket-resale-order.md:78-84`; `systems-architecture.md:32`; `platform_inventory/vps-webhooks.md` via cited journey evidence |
| H30 | BM buyer return / aftercare issue -> manual detection and acknowledgement | WA, BR | Buyer raises issue in BM | BM dashboard/email, manual checks, Monday BM Returns group | No | Yes | No | `warranty-aftercare-returns.md:56-70,96-115`; `backmarket-resale-order.md:86-92`; `findings.md:367-374` |
| H31 | Returned BM device -> reassessment / disposition / relist / repair / BER | WA, BR | Returned device physically received | Monday BM Returns group, comments, Telegram | No | No | No | `warranty-aftercare-returns.md:72-86`; `findings.md:223-230`; `repair-flow-traces.md:167-219` |

## 2. Failure Classification

| ID | Failure class | Why it fails today |
|---|---|---|
| H01 | Data loss, ownership gap | Ingress is automated, but Shopify trigger ownership is opaque and a Monday write can fail after Intercom succeeds. |
| H02 | Data loss, ownership gap | Strong digital path exists, but not all walk-ins are proven to use it, and Slack visibility is not equivalent to accepted ownership. |
| H03 | Ownership gap, silent drop | Browser success returns before downstream side effects are guaranteed complete. |
| H04 | Silent drop, ownership gap | Customer gets success and `24 hour` promise before the human support layer actually picks up the case. |
| H05 | Manual only, silent drop | If staff do not log the call, no backup system creates the record. |
| H06 | Ownership gap, silent drop, manual only | Operator choice can leave revenue-bearing calls in Slack only or Intercom only. |
| H07 | Manual only, data loss, ownership gap | Mixed manual creation means context quality depends on the human creating the Monday item. |
| H08 | Silent drop, no deadline, no escalation, ownership gap | Monday item creation and Slack alerts create awareness without accepted ownership. |
| H09 | Ownership gap, silent drop, manual only | Warranty/corporate/support work can live in Intercom without a clean Monday job. |
| H10 | Data loss, manual only, ownership gap | No verified intake SOP; required information is routinely at risk of being lost before workshop work starts. |
| H11 | No deadline, no escalation, ownership gap | Some group moves are automated, but queue ownership and SLA tracking are not defined. |
| H12 | Data loss, partial mitigation | The enrichment path is good, but bad hidden fields still drop to Slack exceptions rather than guaranteed recovery. |
| H13 | Ownership gap, no deadline, no escalation | Techs self-select, cherry-pick, and there is no queue-control or bottleneck detection. |
| H14 | No deadline, no escalation, ownership gap | Quote creation speed is acceptable in the median but the long-tail exceptions are ownerless. |
| H15 | Silent drop, no deadline, no escalation | Quote acceptance is not tracked cleanly, and the customer-service layer is still inconsistent. |
| H16 | Ownership gap, manual only | Approved jobs hand back to the bench through status use, not a controlled acknowledgement step. |
| H17 | Partial mitigation, ownership gap | Monday can route some repaired devices to QC, but QC itself is still mostly a human queue. |
| H18 | Ownership gap, no deadline, manual only | QC pass has no dedicated status surface, and fail routing depends on Roni plus manual notes. |
| H19 | Partial mitigation | Customer updates exist at milestone statuses, but nothing checks dormant ready / return-booked items afterward. |
| H20 | Ownership gap, data loss, no deadline, no escalation | Paid-state write-back is broken and ownerless across non-Shopify channels. |
| H21 | Ownership gap, no escalation, manual only | The loop stops at draft invoice creation; send and payment closure are not live-owned. |
| H22 | Partial mitigation | BM ingress is strong, but partial creation failure still leaves split ownership across boards. |
| H23 | Partial mitigation | Serial entry reliably triggers checks, but parcel matching and serial capture are still manual. |
| H24 | Ownership gap, no deadline | Automation can detect exceptions, but a human must still decide and act on them inside a fixed window. |
| H25 | Ownership gap, manual only | Payout remains dependent on a human status change before the automation can fire. |
| H26 | Silent drop, no deadline, no escalation, manual only | `To List` is an operator-gated queue with no scheduler owner. |
| H27 | Partial mitigation | Sale acceptance is automated, but dispatch ownership after that is not tightly controlled. |
| H28 | Silent drop, ownership gap, manual only | Label purchase is not shipment confirmation; a human must close the loop in Monday. |
| H29 | Partial mitigation | BM shipping confirmation is strong once `Shipped` is set, but blocked upstream by missing fields or absent status updates. |
| H30 | Silent drop, manual only, no escalation | BM returns are still detected manually and `/ws/sav` is non-functional. |
| H31 | Ownership gap, no deadline, manual only | Returned-device disposition is a human reassessment queue with no enforced checklist or timer. |

## 3. Risk Scoring

Scoring notes:
- `ASSUMPTION`: frequency is inferred from journey prevalence, queue counts, scheduler cadence, and channel volume where no direct per-handoff event count exists.
- `Current mitigation` is judged on whether the handoff has deterministic receipt, data checks, and enforced follow-up.

| ID | Frequency | Customer impact | Revenue impact | Current mitigation | Overall risk |
|---|---|---|---|---|---|
| H01 | Daily | Medium | Medium | Partial | Medium |
| H02 | Daily | Medium | Medium | Partial | Medium |
| H03 | Weekly | Medium | Medium | Weak | Medium |
| H04 | Weekly | High | Medium | Partial | High |
| H05 | Daily | Medium | Medium | Weak | Medium |
| H06 | Daily | High | High | Weak | Critical |
| H07 | Daily | High | High | None | High |
| H08 | Daily | High | High | None | Critical |
| H09 | Weekly | High | High | None | High |
| H10 | Daily | High | High | None | Critical |
| H11 | Daily | High | High | Weak | High |
| H12 | Daily | Medium | Medium | Strong | Medium |
| H13 | Daily | Medium | High | None | High |
| H14 | Daily | High | High | Weak | Critical |
| H15 | Daily | High | High | None | Critical |
| H16 | Daily | Medium | High | Weak | High |
| H17 | Daily | Medium | Medium | Partial | Medium |
| H18 | Daily | Medium | Medium | Weak | High |
| H19 | Daily | Medium | Medium | Partial | Medium |
| H20 | Daily | High | High | None | Critical |
| H21 | Weekly | Medium | High | Weak | High |
| H22 | Daily | Low | Medium | Strong | Medium |
| H23 | Daily | Low | Medium | Partial | Medium |
| H24 | Weekly | Medium | High | Partial | High |
| H25 | Weekly | Medium | High | Partial | High |
| H26 | Weekly | Low | High | None | High |
| H27 | Weekly | Medium | High | Partial | Medium |
| H28 | Weekly | High | High | None | Critical |
| H29 | Weekly | High | High | Partial | High |
| H30 | Weekly | High | High | None | Critical |
| H31 | Weekly | Medium | High | None | High |

## 4. Top 10 Most Dangerous Handoffs

### 1. H20: Payment taken / invoice paid -> Monday paid-state truth

- What goes wrong: payment lands on Shopify, Stripe, SumUp, or Xero, but the operational job does not reliably show that it is paid. Ownership is explicitly `Nobody`.
- Quantified impact: the business is "currently blind on payment status" across Monday/Xero/Stripe/SumUp (`findings.md:68-75`; `MASTER-QUESTIONS-FOR-JARVIS.md:122-148`). Separate finance cleanup work shows `343` ghost invoices and roughly `£91k` of fake debt with no proven live owner (`findings.md:322-338`).
- Specific fix: build one canonical payment-received service with a named owner, channel-specific adapters for Shopify/Stripe/SumUp/Xero, write-back into one Monday paid-state model, and a daily exception queue for unmatched payments.

### 2. H08: Newly created Monday item / Slack alert -> named human follow-up owner

- What goes wrong: the record exists, but nobody explicitly accepts the next action. Work sits in `Awaiting Confirmation`, `Booking Confirmed`, or `Client Contacted` with no SLA clock.
- Quantified impact: the main board holds `900` non-terminal items; `127` `Awaiting Confirmation` items have median age `810` days, `232` `Booking Confirmed` items median `835.5` days, and `120` `Client Contacted` items median `317.5` days (`findings.md:32-39`; `timing-mapping.md:286-313`).
- Specific fix: auto-assign a named owner on creation, add an ageing timer per intake state, move stale debt out of live WIP, and escalate to Ricky or queue owner when the first-response SLA is missed.

### 3. H15: Quote / invoice sent -> customer response / approval / decision

- What goes wrong: quotes leave the workshop, but the business does not track acceptance cleanly and too much customer-service work remains unanswered.
- Quantified impact: March-window Intercom sample shows `27` of `58` customer-facing conversations unanswered, with median reply time `6.39h` and `p90` `45.42h` (`timing-mapping.md:151-165`). `Quote Sent` is also a stale queue with `22` open items at median age `239.5` days (`timing-mapping.md:300-306`).
- Specific fix: split quote/comms status from repair status, start an approval SLA timer when `Quote Sent` is populated, trigger automatic reminders, and escalate unanswered quotes to a named customer-service owner.

### 4. H14: Diagnostic Complete -> Quote Sent

- What goes wrong: diagnostic work completes, but the quote handoff into customer-service is not deterministically owned in the long tail.
- Quantified impact: `75` open items already have `Diag. Complete` populated but no `Quote Sent` date; oldest examples sit `111-176` days after diagnostics (`walk-in-customer.md:63-69`; `timing-mapping.md:315-320`; `findings.md:178-185`).
- Specific fix: create an automatic quote task on `Diagnostic Complete`, enforce a one-business-day target, and escalate exceptions into a separate post-diagnostic queue.

### 5. H10: Front desk / inbound receiving -> complete intake packet

- What goes wrong: the device reaches the business, but the workshop does not reliably inherit verified passcode, stock, turnaround, condition, or prior-repair context.
- Quantified impact: intake KB says there is "No verified company-wide intake SOP" and that information is lost between customer conversations and workshop execution (`intake-flow.md:24-30,148-156`). The journey files repeat that this is one of the highest-leverage failure points (`walk-in-customer.md:39-45`; `mail-in-send-in-customer.md:54-60`).
- Specific fix: enforce one intake checklist before queue entry, require passcode verification and stock checks, and block technician handoff until the checklist is complete.

### 6. H06: Phone Slack record -> Intercom and/or Monday promotion

- What goes wrong: the operator decides whether a phone enquiry becomes actionable. `log_only` leaves it outside both Intercom and Monday.
- Quantified impact: the phone journey explicitly makes `log_only` a lead-loss risk (`phone-enquiry.md:29-35,85-103`). Monday source data currently shows `0` items labeled `Phone` despite confirmed phone-to-Monday intake (`findings.md:77-84`).
- Specific fix: remove or heavily restrict `log_only`, default every commercial phone call to `intercom_monday`, and add ageing alerts for Slack-only and Intercom-only phone enquiries.

### 7. H30: BM buyer return / aftercare issue -> manual detection and acknowledgement

- What goes wrong: BM buyer problems are still found by humans watching dashboards and emails rather than by a reliable event feed.
- Quantified impact: SOP 12 says there is no automated return detection and `/ws/sav` is non-functional (`warranty-aftercare-returns.md:56-70,96-115`; `findings.md:367-374`). This leaves BM aftercare as the least systematized handoff in the estate.
- Specific fix: pull BM return exceptions into Monday and Slack daily at minimum, attach an owner and SLA at detection time, and treat non-response as an escalation case.

### 8. H21: Monday `Create Invoice` -> Xero draft -> sent/paid write-back

- What goes wrong: Monday can create a draft invoice, but the send and payment loops do not return operational truth to the job.
- Quantified impact: the live Xero loop is one-way at draft stage (`findings.md:313-320`; `systems-architecture.md:37-39,78-81`). Corporate receivables are real and current, but payment write-back is absent (`corporate-b2b-client.md:61-75`).
- Specific fix: either formally keep Xero as draft-only and stop pretending otherwise, or deploy owned send + payment webhooks that write canonical invoice status back into Monday.

### 9. H28: Label bought / parcel packed -> manual `Shipped` status on Monday

- What goes wrong: dispatch can buy a label and even physically ship, but BM is not told anything until a human marks `Shipped` in Monday.
- Quantified impact: the resale journey states label buying is not shipment confirmation and the buyer can wait even after the parcel is prepared (`backmarket-resale-order.md:62-84,94-105`). Findings also call the dispatch-to-confirmation boundary a mixed-ownership failure point (`findings.md:358-365`).
- Specific fix: add a reconciliation view for `label bought but not shipped`, use scan-based or packaging-complete confirmation to update Monday automatically, and alert when BM confirmation is missing after label purchase.

### 10. H26: Purchased inventory -> `To List` -> operator publishes listing

- What goes wrong: capital becomes iCorrect-owned at payout, then waits in an operator-gated listing queue with no scheduler owner.
- Quantified impact: the resale journey states there is no live cron for `list-device.js`, so items can sit in `To List` waiting for human action (`backmarket-resale-order.md:14-28,100-112`). Findings tie unfinished BM work and stuck inventory directly to the loss picture (`findings.md:5-12,358-365`).
- Specific fix: assign one daily owner for `To List`, add a same-day listing SLA for payout-complete devices, and either schedule publishing safely or create an explicit exception queue for listing blockers.

## 5. Handoff Heat Map by Journey

Scoring method:
- `Total handoffs` = numbered journey-map steps in each journey file.
- `Automated acknowledgement` counts only hard `Yes`, not `Partial`.
- `Journey handoff health score` = (`auto ack yes` + `SLA yes` + `escalation yes`) / (`3 * total handoffs`) * 100.
- `ASSUMPTION`: this is a control-health score, not a throughput score.

| Journey | Total handoffs | Automated acknowledgement | SLA / deadline | Escalation | Journey handoff health score |
|---|---:|---:|---:|---:|---:|
| Walk-In | 11 | 5 | 0 | 1 | 18 |
| Mail-In / Send-In | 10 | 6 | 0 | 1 | 23 |
| Shopify / Online Store | 10 | 6 | 0 | 0 | 20 |
| Phone Enquiry | 9 | 2 | 0 | 0 | 7 |
| Corporate / B2B | 8 | 3 | 0 | 0 | 13 |
| Warranty / Aftercare / Returns | 10 | 3 | 2 | 1 | 20 |
| Back Market Trade-In | 12 | 6 | 2 | 6 | 39 |
| Back Market Resale | 10 | 5 | 1 | 2 | 27 |

Readout:
- Worst control surface: Phone, because operator choice can prevent the enquiry from ever becoming an owned case.
- Most operationally mature: BM trade-in, because its API/webhook checks do create real acknowledgements and alerts, even though several human approval gates still remain.
- Broad pattern: all customer-service-heavy journeys have poor SLA and escalation coverage even where record creation is automated.

## 6. Cross-Journey Patterns

### A. Record creation is not the same thing as ownership acceptance

- Shopify, walk-in Typeform, phone Slack logging, corporate web forms, and BM polling all create records quickly, but the next human owner is often implicit rather than explicit.
- The clearest proof is the stale Monday queue: `900` non-terminal items, including `127` `Awaiting Confirmation`, `232` `Booking Confirmed`, and `120` `Client Contacted` (`findings.md:32-39`; `timing-mapping.md:286-313`).

### B. Customer-service handoffs are the weakest shared control layer

- Quote sending, quote follow-up, warranty handling, phone follow-up, and corporate account comms all depend on the same weak comms surface.
- Intercom response performance improved versus February, but March still shows `27/58` unanswered customer-facing conversations (`timing-mapping.md:151-165`; `findings.md:169-176`).
- This means many handoffs fail not at system ingress, but between "record exists" and "customer got a timely answer".

### C. Intake-to-tech is still a hidden data-loss seam

- Walk-in, mail-in, and corporate all rely on an intake handoff that is not protected by a verified live SOP.
- Intake KB is explicit: no company-wide SOP, inconsistent passcode verification, information lost between customer conversations and workshop execution, and undocumented automations (`intake-flow.md:24-30,148-156`).

### D. Queue management fails to bridge ownership between intake, bench, and exceptions

- Monday group moves exist, but queue priority, workstation allocation discipline, SLA tracking, and bottleneck detection do not.
- Queue docs explicitly call out self-selection, cherry-picking, no bottleneck detection, and no SLA tracking (`queue-management.md:65-94`).
- The result is that the board records movement, but does not guarantee someone owns the stalled state.

### E. Payment closure is broken across multiple journeys, not one

- Walk-in, mail-in, corporate, warranty, and invoice-driven work all hit the same dead zone: payment happens somewhere, but Monday does not become trustworthy.
- Ricky explicitly confirmed the intended state is automatic reconciliation back to Monday, and that no one owns it today (`MASTER-QUESTIONS-FOR-JARVIS.md:122-148`).

### F. BM has better machine checks than retail, but still fails at manual edge handoffs

- BM trade-in has the strongest automated acknowledgement stack: `sent-orders.js`, `icloud-checker`, `bm-grade-check`, `bm-payout`, `bm-shipping`.
- BM still breaks at manual detection or operator-gated edges:
  - return detection
  - listing publication
  - manual `Shipped` update
  - human counter-offer / profitability decisions

### G. Roles that repeatedly appear as bottlenecks

- Ferrari: quote sending, customer comms, invoice coordination, corporate/client follow-up (`team-operations-summary.md:55-62`).
- Roni: QC, parts, and BM diagnostics converge on one person (`team-operations-summary.md:48-54`; `qc-workflow.md:80-87`).
- Intake/front desk: ownership became weaker after Adil's dismissal, and Andres is covering some intake with no SOP (`intake-flow.md:26-30`; `queue-management.md:27-31`).
- Ricky: final escalation point across Monday, BM, finance, automation, and unresolved exceptions (`team-operations-summary.md:23-27`).

### H. Systems that fail to bridge the handoffs cleanly

- Monday -> owner: records exist, but accepted ownership is often missing.
- Intercom -> Monday: weak in warranty, mixed mail-in, and corporate case conversion.
- Monday -> Xero -> Monday: draft-only loop, no live paid-state closure.
- Slack / Telegram -> human owner: alerts create visibility, not guaranteed action.
- BM aftercare API: effectively absent, forcing manual detection.

## Bottom Line

- The highest-risk handoffs are not the ones where iCorrect lacks any automation.
- They are the points where the business creates a record, message, or alert, then assumes that means the next owner has accepted the work.
- The recurring failure pattern is: `visibility without acknowledgement`, then `no SLA`, then `no escalation`, then stale debt.

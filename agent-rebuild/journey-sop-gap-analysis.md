# Client Journey vs SOP Gap Analysis

Prepared: 2026-04-06

## 1. Journey-to-SOP coverage

| Journey | Matching SOPs | Coverage | Gap summary |
|---|---|---|---|
| `walk-in-customer.md` | `sop-walk-in-simple-repair.md`, `sop-walk-in-diagnostic.md`, `sop-walk-in-corporate.md` | Partial | SOPs cover physical intake, repair, QC, and collection, but skip most intake automation, Intercom/Monday handoff, pre-repair form enrichment, status-notification logic, queue debt, and payment-reconciliation issues described in the journey. |
| `mail-in-send-in-customer.md` | `sop-mail-in-repair.md`, `sop-mail-in-diagnostic.md`, `sop-mail-in-corporate.md` | Partial | SOPs cover workshop-side flow, but skip Shopify/n8n operationalisation, automated Monday/Intercom linkage, status-triggered messaging, stale `Awaiting Confirmation` handling, and payment write-back failures. |
| `phone-enquiry.md` | No direct SOP | None | There is no SOP for the Slack `/call` intake flow, the `log_only` / `intercom_only` / `intercom_monday` branching, deferred Slack actions, or lead-conversion ownership. |
| `corporate-b2b-client.md` | `sop-walk-in-corporate.md`, `sop-mail-in-corporate.md`, plus underlying walk-in/mail-in repair SOPs | Partial | SOPs capture intake-policy differences, but skip the live corporate web-enquiry workflow, Intercom company/ticket creation, weak Monday item-creation evidence, and receivables follow-up gaps. |
| `warranty-aftercare-returns.md` | `sop-bm-return.md`, `sop-bm-return-repair.md` | Weak partial | The BM return branch has partial SOP support, but the website warranty path, SMTP-to-Intercom intake, delayed Intercom contact-swap step, and Monday-linkage gap have no direct SOP. |
| `backmarket-tradein.md` | `sop-bm-trading.md`, with dependency on `sop-walk-in-diagnostic.md` for non-functional devices | Partial | The SOP covers the business flow, but the journey is much richer on live automation: `sent-orders.js`, iCloud/spec validation, Slack-approved counter-offers, profitability checks, payout controls, and failure modes when Monday/BM writes diverge. |
| `backmarket-resale-order.md` | `sop-bm-sale.md` | Partial | The SOP covers QC -> listing -> ship at a high level, but skips sale acceptance automation, label-buy vs shipped distinction, BM shipment confirmation, and the manual post-sale aftercare gap. |

Direct no-match journeys:

- `phone-enquiry.md`

Directly uncovered journey segments:

- The website warranty intake and complaint-handling portions of `warranty-aftercare-returns.md`
- The corporate web-enquiry and Intercom company-creation portions of `corporate-b2b-client.md`

## 2. SOP steps not represented in the journey maps

All ten SOPs map to at least one journey domain, but several SOP-only steps do not appear in any of the seven journey maps:

- `sop-bm-return.md`: warranty-sticker verification, replacement-unit bottom-cover swap, and mandatory avoidable-return logging are not present in the journeys.
- `sop-bm-return-repair.md`: explicit covered-vs-not-covered warranty assessment, the 3 working day deadline, the high-value-device absorb-cost exception, and mandatory preventable-fault logging do not appear in the journeys.
- `sop-walk-in-corporate.md` and `sop-mail-in-corporate.md`: the explicit rule that corporate jobs are always top-of-queue is not evidenced in any journey map.
- `sop-walk-in-simple-repair.md`: record-the-reason-if-client-does-not-leave, ask the client what to do if an extra fault is found, and the hard rule against arguing QC rejections are not surfaced in the journeys.
- `sop-walk-in-diagnostic.md`: diagnostic fee taken upfront, the rule that Saf always completes the logic-board repair before quote, and the quote cap on older devices are not captured in the journeys.
- `sop-mail-in-repair.md`: same-day packaging dispatch and explicit return-address confirmation before outbound shipping are not clearly represented in the journeys.

## 3. Journey steps that SOPs skip

- `walk-in-customer.md`, `mail-in-send-in-customer.md`, and `corporate-b2b-client.md` all describe automated intake creation across Typeform or Shopify into Slack, Intercom, and Monday. The SOPs mostly start after a client has arrived or a device is already booked.
- `walk-in-customer.md` and `mail-in-send-in-customer.md` describe the pre-repair Typeform enrichment flow, hidden-field matching problems, and Slack exception alerts. No SOP defines how that enrichment should be monitored or what to do when it fails.
- `walk-in-customer.md`, `mail-in-send-in-customer.md`, `corporate-b2b-client.md`, and `warranty-aftercare-returns.md` depend on the VPS `status-notifications` service and specific Monday status / Intercom-ID conditions. The SOPs do not tell operators which status changes are operationally required to trigger customer messaging.
- `phone-enquiry.md` documents a live intake system with `log_only`, `intercom_only`, and `intercom_monday` branches, fuzzy device/product matching, and deferred Slack actions. There is no SOP for this funnel at all.
- `warranty-aftercare-returns.md` describes website warranty intake through an SMTP-to-Intercom workflow, delayed contact reconciliation, and a separate handoff into Monday when physical work is needed. No SOP covers this front half of the warranty journey.
- `corporate-b2b-client.md` describes Intercom company creation, corporate ticket creation, and the lack of a guaranteed Monday item-creation path. The corporate SOPs do not cover this enquiry-to-ops handoff.
- `backmarket-tradein.md` describes live services and control points that the SOP only implies: automated sent-order ingestion, iCloud/spec validation, Slack counter-offer approval, profitability warnings on `Diagnostic Complete`, payout hard-blocks, and partial-ingestion / partial-sync failure modes.
- `backmarket-resale-order.md` describes a four-stage fulfilment control chain that the SOP compresses away: listing publication, automated sale acceptance, label purchase, manual shipped confirmation, and BM shipment confirmation.
- Multiple journeys describe stale-state risk and measurable delay states such as `Awaiting Confirmation`, `Diagnostic Complete` without quote, `Quote Sent`, `Awaiting Part`, `Repair Paused`, `Ready To Collect`, and `Return Booked`. The SOPs are mostly happy-path documents and do not define ageing, chasing, or escalation rules for those states.
- `walk-in-customer.md`, `mail-in-send-in-customer.md`, and `corporate-b2b-client.md` describe broken payment-state visibility across Monday, Xero, Stripe, and SumUp. The SOPs mention payment or invoicing, but they do not define a reliable closeout control when the systems disagree.

## 4. Missing edge cases

- Returns and complaints: there is no unified SOP for website warranty complaints, no direct SOP for BM buyer complaint intake before a return is received, and no documented complaint-escalation path that joins Intercom, Monday, and BM SLA handling.
- Warranty conversion: the journeys show warranty issues starting in Intercom and only later becoming operational jobs. No SOP defines when a warranty conversation must become a Monday item, who owns that conversion, or how the 24-hour warranty promise is enforced.
- Delay management: no SOP defines chase rules for `Awaiting Confirmation`, `Quote Sent`, `Awaiting Part`, `Repair Paused`, dormant `Ready To Collect`, or `Return Booked` states, even though the journeys repeatedly identify these as real stall points.
- Phone lead loss: the `log_only` and `intercom_only` branches in the phone journey create explicit stranded-lead scenarios, but there is no SOP saying when those branches are allowed, who owns follow-up, or when escalation should occur.
- Parts issues: the journeys repeatedly call out missing stock checks, missing parts reservation/allocation, and `Awaiting Part` loops. The SOPs acknowledge the lack of an allocation system, but they do not define a fallback control, owner, or ageing rule when parts are missing.
- BM aftercare: the journeys show manual BM return detection, non-functional `/ws/sav`, wrong-device or fraud escalations, and counter-offer wait states. The SOPs only partially cover these exception paths and do not define monitoring ownership.
- Finance closure: the journeys show unresolved payment write-back and receivables ambiguity, especially for corporate and mail-in work. No SOP defines how to close a job when the customer has the device back but Monday, Xero, and payment systems disagree.
- Preventable-failure logging: both BM return SOPs require avoidable-fault logging, but the journeys do not show where that logging actually happens or who reviews it, so the feedback loop into QC and process improvement is still missing in practice.

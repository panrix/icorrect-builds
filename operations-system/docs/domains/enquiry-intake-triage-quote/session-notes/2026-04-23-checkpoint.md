# Enquiry / Intake / Triage / Quote Handoff Session Summary
Date: 2026-04-23
Last updated: 2026-04-23 13:46 UTC
Status: checkpoint summary

## Purpose
This summary captures the main conclusions from today’s ops truth-capture session with Ricky on the enquiry -> intake -> triage -> quote-handoff domain.

This is the clean checkpoint layer above the larger working draft:
- `/home/ricky/.openclaw/agents/operations/workspace/docs/domain-enquiry-intake-triage-quote.md`

---

## 1. What was clarified today

### Intake ownership
- Current front-desk / intake owner is **Naheed**.
- Naheed is the physical intake edge.
- Andres backs up Naheed for physical walk-ins / office handling.
- This replaces stale assumptions that Adil still owns intake/front desk.

### Ferrari’s real role in this domain
Ferrari currently owns a large amount of the remote progression layer:
- email first response
- phone first response
- remote intake capture
- remote triage
- quoting
- chasing acceptance/payment
- making accepted diagnostics move into repair

This confirms Ferrari as a major coordination bottleneck in the current system.

### Core channel view
Strongest current channels:
- walk-ins
- Back Market

Weakest current channel:
- phone enquiries, because they are not tracked properly

Other key channel truths:
- email should be treated under Intercom
- WhatsApp exists in Intercom but is not a meaningful intake path operationally
- Slack is weakening as an internal layer; Ricky prefers future movement toward Telegram + bots

---

## 2. Current-state intake logic

### What details are truly needed
Core identity / contact package:
- name
- phone number
- email address
- device type
- exact model
- serial
- IMEI

Core issue package:
- fault / what is wrong
- enough context to know whether this is straightforward or diagnostic

### Intake is really story capture
This was one of the most important insights today.

For diagnostics especially, intake needs the story of the device, including:
- Apple Store history
- previous repairs
- bought new or used
- suspicious history / dodgy source
- how it broke
- liquid type / circumstances
- charger context
- when it last worked
- whether someone else has already looked at it
- whether the data is important

This means future-state intake is not just a form. It is a guided evidence-gathering flow.

---

## 3. Triage logic clarified

### Current practical triage rules
Diagnostic if:
- device does not turn on
- liquid damage or suspected liquid damage exists
- hidden complexity is likely

Normal repair if:
- issue appears straightforward
- no liquid-damage red flags
- device can be tested normally

Not fit / decline if:
- poor commercial fit (for example older devices, especially pre-2016)
- customer fit is poor relative to value / time burden

### Who decides today
- Ferrari on calls / enquiries and often at intake stage
- Naheed on physical intake edge
- technicians can escalate when technical reality changes
- quote wizard can partly self-sort customers

Important truth:
- much of the triage logic is still tribal knowledge rather than explicit rule logic

---

## 4. Current-state handoff flow

### Normal repair
Typical reality:
- booked, often via Shopify / website
- Monday record created
- if mail-in, packaging sent
- Naheed or Ronnie receives and marks in
- part should be reserved, but this is not a true process yet
- job is added to repair queue
- physically sits in small storage room until tech is ready
- goes to tech
- usually prepaid on walk-in / website
- repaired, pre-tested, then QC

### Diagnostic
Typical reality:
- may start from website or email
- customer usually spoken to first
- missing info chased manually
- customer pays £49 diagnostic upfront
- physically marked in
- sits in small storage room
- enters Saf’s queue
- target deadline usually 2 working days
- Saf writes diagnostic notes
- Ferrari translates those notes into quote in Intercom
- customer accepts / declines / discusses
- invoice issued if accepted
- after payment, it enters repair queue

---

## 5. Main failure modes
Two dominant failure classes emerged:

### A. Information capture failure
- good conversations happen but do not become durable records
- intake is not consistently structured enough for decisions
- key context is lost between phone/email/in-person and Monday
- techs do not always see what customers actually said

### B. Progression-control failure
- triage often depends on tagging Ferrari and hoping he sees it
- quote creation is manual and slow
- customer follow-up after quote is weak
- accepted diagnostics do not move tightly into repair
- parts are not checked early enough
- there is no real parts reservation process

Specific stage failures captured today:
- first response: info not taken
- intake capture: conversation not converted into decision-ready record
- triage: depends on Ferrari seeing tags
- physical mark-in: unclear device/info linkage
- queue assignment: deadlines missing, tech overloaded, engineer off
- diagnostic write-up: poor language/clarity, though improved template has now been given to Saf
- quote creation: fully manual
- customer acceptance/payment: no strong follow-up loop
- movement into repair: can stall after acceptance/payment
- parts readiness: no real stock-check / reservation discipline at intake stage

---

## 6. Clean pre-receipt state model
One of the most useful shifts today was separating real business states from current Monday-state thinking.

Pre-receipt states now visible:
- inquiry received
- inquiry answered
- lead identified
- lead being progressed
- awaiting booking decision
- booked in / expected
- non-fit / declined

This is important because Monday is not the true enquiry-state system. In practice, Monday only becomes the real record once a customer is physically booked in, in some form.

---

## 7. Practical definition of a lead
Ricky’s definition:
An inquiry becomes a lead when the customer is no longer just browsing and is moving toward booking.

Lead indicators:
- they seem happy
- they want to book
- they have shared device details
- if asked for serial, they provide it
- they have asked for the price
- they have asked the questions they need answered
- they are asking about appointments
- they have enough information to make a decision

Interpretation:
A lead is intent-based and information-based, not merely someone who contacted the company.

---

## 8. Future-state design rules that emerged today
The strongest future-state principle Ricky gave was:

**This is about speed.**

### Non-negotiable direction
- emails replied to immediately
- missed calls returned within 1 hour
- customers actively called, not just passively awaited
- every client reassured that iCorrect is the right company
- parts reserved
- passcodes/access confirmed, or NDA equivalent in place
- corporate jobs complete in the details they need before progression

### Speed standards captured
- email enquiry -> first reply: within 1 hour
- missed phone call -> callback: within 1 hour
- website booking -> confirmed / visible to team: immediately
- customer booking confirmation: immediately
- physical walk-in -> seen in a few minutes
- diagnostic received -> pre-diagnostic same day
- diagnostic complete: 1 working day target, 2 day max
- diagnostic complete -> quote sent: within 1 hour
- customer accepts -> invoice/payment request: immediately
- customer accepts -> part reservation: immediately
- payment received -> moved into repair queue: immediately
- waiting on parts -> customer updated: immediately
- ready repair -> customer notified: immediately

Important nuance:
- AI should be fast, but not so unnaturally immediate that it harms trust

---

## 9. Key structural truths now visible
- Intake is not just form capture, it is story capture.
- The domain breaks mainly because of poor information capture and weak progression control.
- Ferrari is a bottleneck because too much remote progression depends on him.
- Naheed is now the physical intake edge and needs to be modeled properly going forward.
- Diagnostic note quality is still not a closed-loop controlled system.
- Parts readiness / reservation is a major unresolved control gap.
- Monday is contaminating thinking, so current-state and future-state models must be kept separate.

---

## 10. Best next session starting point
Next session should continue this domain by focusing on:
1. a cleaner post-receipt state model
2. the exact difference between inquiry, lead, booking, and expected arrival
3. explicit future-state rule logic for lead conversion
4. control rules for accepted diagnostics -> repair progression
5. parts-check / reservation logic
6. Naheed’s deeper role definition inside intake

## Visible copy
This summary should be mirrored to:
- `/home/ricky/builds/operations-system/docs/`

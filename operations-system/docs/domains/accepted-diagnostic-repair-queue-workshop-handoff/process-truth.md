# Domain Capture: Accepted Diagnostic -> Repair Queue -> Workshop Handoff
Last updated: 2026-04-24 02:10 UTC
Status: active working draft
Owner: Ops / Ricky
Scope: current-state truth capture and future-state rule clarification for accepted diagnostics moving into repair readiness, queue assignment, and workshop handoff

## Purpose
This file captures the current-state and future-state understanding of the accepted diagnostic -> repair queue -> workshop handoff domain.

It is a process-truth capture file, not a final SOP.
Its job is to separate:
- what actually happens today
- what breaks today
- what the clean governing model should be
- what future SOP and KB outputs need to exist

Rule: document continuously during sessions with Ricky. Do not wait until the end of a long conversation.

### Confirmed boundary for this domain
Included:
- client says go ahead
- invoice sent
- payment confirmed
- parts availability checked
- queued to repair
- deadline assigned
- handed into workshop execution

Excluded:
- diagnostic investigation itself
- writing and sending the quote itself
- actual repair work on the bench
- QC after repair
- customer collection or dispatch

---

## Current State, Reality Today

### Confirmed upstream entry condition into this domain
This domain begins when the customer explicitly says they want to go ahead with the quoted diagnostic repair.

In Ricky’s current-state wording:
- the client says go ahead
- this usually happens by email or by phone call
- very rarely it may happen by physical walk-in
- the business then invoices the client
- once payment is confirmed, the job moves from quote accepted / invoiced toward the repair queue

Important state distinction:
- **domain start trigger:** customer explicitly accepts the quote
- **repair-queue progression trigger:** payment is confirmed

This is not the quote-writing domain.
This is the progression-control domain that should turn accepted work into an actually ready repair job.

### Confirmed practical meaning of customer acceptance
In current practice, customer acceptance means an explicit yes, most commonly:
- email saying go ahead
- phone call saying go ahead

Less common but possible:
- physical walk-in confirmation after the customer has missed or not seen the email

Important clarification:
- acceptance itself is generally just the client saying yes, please go ahead
- there may be some follow-up questions or clarifications before that yes is fully locked
- special payment routes such as Pay in 3 belong to the invoicing / payment side, not to the acceptance definition itself

Important communication implication:
- customers can miss quote emails or have them land in junk
- if the business does not proactively chase or prompt them, some customers may physically walk in frustrated because they believe they have not heard back
- Ricky’s target-state direction is that a follow-up prompt such as text or WhatsApp should nudge the customer to check their email and ask questions if needed

### Confirmed current readiness requirements already captured
Ricky has already clarified that an accepted diagnostic should only move into repair queue when:
- parts are available or reserved
- a technician repair slot is available
- payment is confirmed
- customer deadline / expectation is confirmed

This means accepted diagnostic is not itself a queue-ready state.
There is a separate control gate between accepted and repair-ready.

### Current practical progression shape visible so far
Based on the prior intake pass plus Ricky’s clarification, the current practical flow appears to be:
1. Saf completes diagnostic
2. Ferrari translates the diagnostic into a customer quote
3. customer explicitly says they want to go ahead, either by email or verbally on the phone
4. the customer is invoiced through Xero
5. payment is confirmed
6. at that point, the business treats the repair as accepted and moves it toward repair queue
7. Monday status is changed to something like `queue for a repair`
8. the job goes into a technician queue, for example Saf’s queue
9. parts should already have been checked so the business understands when the repair can actually be completed
10. an updated turnaround should be confirmed from the point payment is received, not blindly inherited from an older quote message
11. parts should be reserved at acceptance / invoicing stage so the job is genuinely ready when it reaches the technician
12. once it is queued with parts checked and a strict deadline, it has crossed into workshop execution territory

### Important current-state truth
Today, this movement appears to depend heavily on Ferrari noticing, chasing, translating, invoicing, changing statuses, and pushing the next step.
That means the domain is currently person-dependent rather than state-controlled.

### Current digital progression, based on Ricky’s current-state description
This still needs confirmation against actual Monday/Xero evidence, but the described digital flow is:
- Ferrari watches for email replies and sees when a client says yes, go ahead
- invoice is then created manually
- the invoice should ideally be automated, but currently is not
- Monday status is changed to `invoiced`
- there should be a note that the quote has been accepted
- there should be a note that parts need to be allocated
- if acceptance comes by phone or physical walk-in, Naheed is likely to write an update on Monday and Ferrari then sends the invoice by email
- payment is treated as confirmed when Ferrari manually sees it paid in Xero, or in the relevant payment route such as Shopify, or when a bank transfer has been received
- if Ferrari sees the payment, he tells the customer the repair will now be received / progressed
- he writes a note to show the part has been accepted and paid
- he then queues the item for repair
- after payment confirmation, there is currently no automatic system trigger pushing the next operational step

Important current-state truth:
- this is largely managed by Ferrari end to end
- the rest of the team does not appear to have a strong state-controlled workflow here
- parts-allocation signalling appears to happen blindly to the team rather than through a reliable enforced step
- payment confirmation is still a manual monitoring task, which creates dangerous lag

### Confirmed practical end boundary for this domain
Ricky’s current-state definition is that this domain ends when:
- parts availability has been checked
- the job is queued for repair in the technician queue
- the job has a strict deadline

At that point, the work is no longer just accepted-diagnostic progression.
It has become workshop execution.

### Important physical-location clarification
For this domain, the device is already physically at the workshop before the quote is accepted.
That is because this is the post-diagnostic path for devices that were dead, liquid-damaged, or otherwise needed real workshop investigation before a detailed quote could be produced.

So there is an important distinction:
- **physically in the workshop:** already true before quote acceptance
- **in workshop execution / active repair flow:** only true once the accepted job has moved through payment, queue, parts, and deadline progression

### Working interpretation of current queue-readiness reality
The current system likely has several loosely coupled truths at once:
- the customer may have accepted
- the invoice may have been sent
- payment may have landed
- the part may or may not exist
- the device may still be physically sitting in the same storage position after digital progression
- Monday may or may not reflect the true state
- the technician may or may not know the job is actually ready

That is a classic hidden-queue problem rather than a clean handoff system.

### Current physical progression, based on Ricky’s current-state description
- once a diagnostic is completed, the device goes to the small storage room
- it then sits there physically pending customer acceptance
- the device is already physically at the workshop during this whole stage
- when the quote is accepted, the device still does not immediately move physically
- physical movement happens later, when it digitally moves into Saf’s queue and Saf comes to collect it
- Saf collects the device from the quote area / storage-side holding area and takes it through for repair

Target-state direction already visible from Ricky:
- once the quote is accepted, the business should be preparing the parts and boxes ready for Saf
- physical storage should already have moved so the device is sitting with the required part ready to go
- Saf should collect the prepared job from Ronnie once it is in his queue

### Main waiting states visible so far
Current waiting points appear to include:
- waiting for Ferrari to physically write up and send the quote after diagnostic completion
- waiting for customer acceptance
- waiting for payment after invoicing
- waiting for parts availability / allocation
- waiting for technician queue slot if Saf’s queue is large
- waiting physically in the small storage room / quote holding area
- waiting digitally in Saf’s queue before real workshop start

Important current-state interpretation:
- one of the biggest waits may be the diagnostic-complete -> quote-written / invoiced gap, because Ferrari must manually write and send the quote
- Ricky wants this domain measured against recorded timing data rather than treated as guesswork

---

## Current Failure Modes

### Failure pattern already visible from upstream evidence
The dominant failure modes inherited into this domain are:
- accepted diagnostic does not cleanly move into repair queue
- payment may still be unclear or unconfirmed
- parts may be out of stock after acceptance
- customer may chase because the device has not visibly progressed
- physical movement and system-state movement can drift apart
- Ferrari remains a manual bottleneck for progression

### Emerging domain-specific failure modes to confirm
These are the likely failure points now visible, pending deeper capture:

#### 1) Quote acceptance is not a true operational trigger
What goes wrong:
- customer says yes, but no immediate next-step control fires
- payment, parts, slot, and queue preparation do not move as one linked state change
- digital notes and status changes exist, but they do not yet form a robust operational control system for the wider team
- the broader domain also suffers upstream from diagnostic-complete -> quote-written delay because Ferrari must manually produce the quote before acceptance can even occur

#### 2) Payment-confirmed does not mean repair-ready
What goes wrong:
- payment can be complete while parts are still missing
- payment can be complete while no technician slot exists
- accepted work can therefore look commercially closed while still being operationally blocked
- there is no automatic trigger after payment confirmation to drive the next step
- because payment monitoring is manual, jobs can sit unnoticed after payment, especially over weekends or overnight periods
- Ricky gave a live failure pattern: customer pays on Friday night, nobody picks it up, and days later the customer chases while the team rushes and backtracks

#### 3) Parts availability is discovered too late
What goes wrong:
- parts check only becomes real after customer acceptance, or worse, not until the technician is ready to start
- accepted work can stall because stock is missing or ETA is unclear
- customer expectation can already be mis-set by the time the blockage becomes visible
- example given by Ricky: the job sits in Saf’s queue, Saf comes to do the repair, then discovers a needed keyboard is not actually in stock
- in some cases the technician ends up going into the back room to search for parts because the allocation step never really happened
- even when the part is in stock, nothing meaningful happens beforehand and the tech still goes and grabs it themselves when starting repair

#### 4) Queue assignment is not capacity-grounded enough
What goes wrong:
- job can be considered ready without a realistic technician slot
- workshop load and actual bench capacity may not be reflected early enough
- promised timing can drift from repair reality

#### 5) Physical and digital handoff can diverge
What goes wrong:
- Monday may say one thing while the device is still elsewhere physically
- accepted work may be digitally in Saf’s queue while still physically sitting in the quote/storage area
- technician may not have the device, or may not have the final instruction clarity
- real readiness is therefore invisible or misleading

#### 6) Customer communication may lag behind the actual block
What goes wrong:
- customer accepts and pays, but delay communication may not happen fast enough if parts or slot are blocked
- the customer experiences silence between agreement and repair start
- quoted turnaround may also become stale if the customer pays days later and nobody resets the real turnaround from payment-confirmed date
- even before acceptance, customers may miss quote emails and believe they have not heard back unless there is an active follow-up prompt

### Failure pattern summary
This domain appears to fail when the business confuses:
- accepted
- paid
- parts-ready
- queue-ready
- workshop-started

Those are not the same state.
The future model needs to keep them explicitly separate.

---

## Target-State / Governing Rules

### Core governing principle
An accepted diagnostic should only move into the repair queue when the business can actually start or schedule it with confidence.

That means the governing rule is not:
- customer said yes

It is:
- the job is commercially accepted and operationally ready.

### Strong target-state shape already visible
Ricky’s target-state direction is:
- diagnostic outcome should drive an automated quote draft
- quote should be approved and sent without Ferrari becoming a long manual wait point
- when the customer accepts, invoice generation and send should be near one-click
- quote acceptance should message Ronnie that the job has been accepted and that the required parts should be made ready for that device
- by acceptance / invoicing stage, parts should already be allocated
- repair queue slot should already be set up so payment can trigger immediate progression
- payment confirmation should generate an automated notification to Telegram and trigger the next Monday steps automatically
- physical prep should already have the device sitting with the part ready for Saf
- Saf’s queue should be digitally organized against real turnaround SLAs
- the notification layer needs to be strong enough that paid jobs do not go stale over weekends or after-hours periods

### Non-negotiable progression rules already visible
- quote acceptance must trigger immediate progression checks
- payment state must be explicit, not inferred
- parts readiness must be explicit, not assumed
- technician slot / capacity must be explicit, not socially guessed
- customer deadline / expectation must be re-confirmed against real capacity and from the actual payment-confirmed moment
- the wider team should be able to see a clear note including paid state, parts state, and deadline state
- if any required control is missing, the job should move into a visible blocked state, not silently sit in limbo

### Handoff integrity rules
Before workshop handoff, the business should know:
- the approved repair scope
- the approved price / payment status
- the required parts and their readiness state
- who is doing the work
- when the work is expected to start
- what expectation has been set with the customer
- where the device physically is, and whether it has actually been prepared for technician pickup

### Communication rule
If acceptance has happened but repair cannot start as expected, customer communication should be immediate and explicit.
Silence after payment is operationally unacceptable.

The target-state expectation Ricky has described is:
- delays should already be known before the customer has to ask
- the business should notify proactively, not reactively

---

## Stage Model / Decision Model

### Clean state model emerging for this domain
The following state sequence is now visible and should remain explicit:

1. **Diagnostic complete**
- technical findings exist
- quote can be built

2. **Quote issued**
- customer has been told the outcome and the next commercial decision

3. **Quote accepted**
- customer has agreed to proceed
- this does not yet mean repair-ready

4. **Payment confirmed**
- commercial commitment is closed enough to progress under the service rule
- in current practice, this means Ferrari has seen the payment land in Xero, Shopify, or an equivalent confirmed payment route such as bank transfer
- important current-state gap: payment confirmation does not automatically trigger the next operational action

5. **Current business queue-entry marker: Monday status changed to `queued for repair`**
- in current practice, this is the point where the business would say the job is in the repair queue
- this appears to mean payment has been received from the customer
- important warning: this status change does not itself confirm parts readiness or full operational readiness

6. **Parts ready**
- required parts are in stock or reserved with a trusted ETA and decision

7. **Repair slot ready**
- a real technician slot exists
- expected start timing is not fiction

8. **Repair queue ready**
- payment, parts, slot, and expectation all align
- job can now properly enter active repair queue

9. **Workshop handoff complete**
- the correct technician / workshop queue has the device, the instruction, and the readiness context

10. **Repair in progress**
- technician has actually started work

### Core decision rule
The critical control decision in this domain is:
- does this accepted diagnostic become repair-queue ready now, or does it enter a visible hold/blocked state?

That decision should not rely on memory or casual tagging.
It should be explicit and auditable.

### Confirmed current-state business definition of "in repair queue"
Ricky’s current-state definition is:
- the job is considered in the repair queue when Monday status is changed to `queued for repair`
- this reflects that customer payment has been received
- it does **not** reliably confirm that parts are ready or that the job is truly startable

### Acceptance-channel rule so far
- acceptance does not always happen in the same channel
- usually: email
- sometimes: phone
- rarely: in person
- the core rule is not the channel, but the explicit customer yes

---

## Ownership

### Current owner picture visible so far
From upstream capture, the current practical owner map appears to include:
- Ferrari:
  - receives the diagnostic handoff from Saf
  - watches for customer acceptance, especially in email
  - quote issue
  - chasing acceptance / payment
  - sends the invoice / payment request
  - manual invoicing
  - physically checking for payment confirmation
  - digitally seeing the accepted job and initiating the parts-allocation step
  - Monday status changes
  - note-writing around acceptance and parts allocation
  - making sure accepted diagnostics actually move toward repair
  - effectively stitching together the whole progression chain by hand
- Ronnie:
  - parts readiness owner in practice
  - likely key owner for stock confirmation / reservation reality
  - office-side physical checker for whether the required parts are actually there and can be allocated
  - the person who should be told when a quote is accepted so the required parts can be made ready for the device
- Saf or assigned technician:
  - upstream diagnostic completion handoff into Ferrari
  - downstream repair execution once the job is truly ready
  - sometimes managing needed parts directly themselves
- Naheed:
  - if acceptance comes by phone call or physical walk-in, he is likely to record that on Monday
  - Ferrari then follows by sending the invoice
  - earlier intake and physical receipt ownership, with less evidence yet in this domain
- Ricky:
  - quality owner where translation, timing, and operational truth are weak

### Main handoff points visible so far
Current-state handoff points appear to include:
- Saf -> Ferrari when the diagnostic is completed
- Ferrari -> client when quote / go-ahead is handled
- Ferrari -> Xero/payment request when invoice is created
- payment state back into ops when Ferrari physically checks whether payment has landed
- Ferrari -> office / Ronnie when the accepted job needs parts checked and allocated physically
- parts -> Saf when the job is prepared for repair
- digital queue handoff when the job is placed into Saf’s queue
- physical handoff when Saf actually collects the device and starts repair

Important current-state truth:
- Ferrari is currently managing most of these handoffs manually
- Ronnie is managing much of the parts side
- sometimes that parts-allocation step does not happen at all before the job reaches a technician
- in those cases, the technician has to physically go into the back room and look for parts themselves
- there are no robust automated procedures controlling these handoffs today, even though there should be

### Important owner-map truth
This domain is a cross-functional handoff point.
That means owner ambiguity is especially dangerous here.

The likely clean ownership split to test is:
- Ferrari owns customer-side commercial progression
- Ronnie owns parts-readiness truth
- workshop lead / technician owner owns slot-readiness truth
- system gate decides whether the job is truly repair-queue ready

This needs confirmation in later capture.

### Automation direction already confirmed by Ricky
Ricky’s stated direction is that these handoffs should be heavily automated.
The ideal pattern is not Ferrari manually shepherding each job through the chain.
It is a system where the relevant user mainly confirms yes or no at the right control points.

---

## Exceptions, Holds, and Escalations

### Holds already implied by prior capture
An accepted diagnostic should not silently drift when any of these are false:
- payment confirmed
- parts available or reserved
- technician slot available
- customer timing / expectation confirmed

### Confirmed payment rule, corrected
Default rule:
- accepted diagnostic work should not progress before payment is fully confirmed

Real current-state exceptions Ricky then clarified:
- some walk-in customers may be allowed to pay on collection if the team knows them
- corporate jobs are normally invoiced after repair, so the device may be returned before payment is received

Operational implication:
- payment-first is the standard control rule for this domain, but trusted walk-in exceptions and corporate terms exist in practice

### Current parts reality now clearer
If the required part is in stock today:
- nothing meaningful happens in advance digitally
- nothing meaningful happens in advance physically
- when it is time to start the repair, the technician goes and grabs the part themselves
- Ricky considers this fundamentally flawed, like making the head chef go and pick their own ingredients

If the required part is not in stock today:
- the failure may not be discovered until the job has already reached a technician
- the job may already have lost one or two days sitting in the repair queue
- the technician then flags the issue back to Ferrari
- chaos follows while the team tries to get the missing part in stock

### Confirmed reservation truth
- there is no real reservation process today
- Ricky wants the future rule to be simple: as soon as the client says they want to go ahead, the part is reserved
- target-state should include physically taking the part out of stock, allocating it to that repair, and making pending allocations visible across repairs

### Likely blocked-state model for this domain
Visible blocked reasons likely include:
- awaiting payment
- part unavailable
- part ETA misses expectation
- no technician slot
- repair scope still unclear after acceptance
- customer expectation needs reset
- physical device not yet in the right handoff position

### Governing rule for blocked work
If the job is accepted but not repair-ready, it should sit in an explicit blocked state with:
- one visible reason
- one visible owner
- one visible next action
- customer communication status visible where relevant

### Escalation principle
If the blockage affects promised timing, customer trust, or queue capacity, escalation should happen before the promised time is missed, not after.

---

## Open Questions
- what is the exact current sequence from quote acceptance to technician pickup in live workshop reality?
- what system state changes happen today, and which are manual versus automated?
- who actually decides technician slot readiness?
- when is a device physically moved, and by whom?
- what are the real current blocked statuses used after diagnostic acceptance?
- what customer communications are sent today when an accepted repair cannot start on time?
- who in practice decides reserve versus order versus wait when parts are not immediately obvious?
- what evidence in Monday / Intercom best confirms the real owner map?
- exactly how should visible stock allocation and reserved-stock tracking work in the future model?

## System Implications
- accepted is not the same as ready
- paid is not the same as ready
- the future system needs a distinct repair-readiness gate after diagnostic acceptance
- blocked accepted repairs need visible reason, owner, and next action
- digital queue movement should not outrun physical reality
- customer communication needs to be linked to blocked-state logic
- AI/system enforcement should eventually determine readiness rather than relying on Ferrari as a manual progression engine

## Future SOP / KB Outputs
This domain should ultimately split into:
1. accepted diagnostic progression check
2. payment-confirmed to repair-readiness check
3. parts reservation / parts-readiness confirmation after diagnostic acceptance
4. technician slot assignment and queue-readiness check
5. workshop handoff SOP for accepted diagnostics
6. blocked accepted-repair handling and customer communication
7. accepted diagnostic owner map
8. accepted diagnostic state model
9. repair-ready gate definition
10. physical versus digital handoff control rules

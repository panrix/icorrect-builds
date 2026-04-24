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

---

## Current State, Reality Today

### Confirmed upstream entry condition into this domain
This domain begins after all of the following are true for a diagnostic job:
- diagnostic has been completed
- quote has been issued
- customer has accepted
- payment is confirmed or otherwise in the correct state for progression

This is not the quote-writing domain.
This is the progression-control domain that should turn accepted work into an actually ready repair job.

### Confirmed current readiness requirements already captured
Ricky has already clarified that an accepted diagnostic should only move into repair queue when:
- parts are available or reserved
- a technician repair slot is available
- payment is confirmed
- customer deadline / expectation is confirmed

This means accepted diagnostic is not itself a queue-ready state.
There is a separate control gate between accepted and repair-ready.

### Current practical progression shape visible so far
Based on the prior intake pass, the current practical flow appears to be:
1. Saf completes diagnostic
2. Ferrari translates the diagnostic into a customer quote
3. customer accepts or discusses the quote
4. Ferrari issues invoice / payment request
5. payment is received
6. parts need to be checked or reserved
7. job needs a real technician slot and queue position
8. job should then move into active repair queue
9. device should physically and digitally reach the correct technician handoff state

### Important current-state truth
Today, this movement appears to depend heavily on Ferrari noticing, chasing, translating, and pushing the next step.
That means the domain is currently person-dependent rather than state-controlled.

### Working interpretation of current queue-readiness reality
The current system likely has several loosely coupled truths at once:
- the customer may have accepted
- the invoice may have been sent
- payment may have landed
- the part may or may not exist
- the device may or may not have been physically moved
- Monday may or may not reflect the true state
- the technician may or may not know the job is actually ready

That is a classic hidden-queue problem rather than a clean handoff system.

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

#### 2) Payment-confirmed does not mean repair-ready
What goes wrong:
- payment can be complete while parts are still missing
- payment can be complete while no technician slot exists
- accepted work can therefore look commercially closed while still being operationally blocked

#### 3) Parts availability is discovered too late
What goes wrong:
- parts check only becomes real after customer acceptance
- accepted work can stall because stock is missing or ETA is unclear
- customer expectation can already be mis-set by the time the blockage becomes visible

#### 4) Queue assignment is not capacity-grounded enough
What goes wrong:
- job can be considered ready without a realistic technician slot
- workshop load and actual bench capacity may not be reflected early enough
- promised timing can drift from repair reality

#### 5) Physical and digital handoff can diverge
What goes wrong:
- Monday may say one thing while the device is still elsewhere physically
- technician may not have the device, or may not have the final instruction clarity
- real readiness is therefore invisible or misleading

#### 6) Customer communication may lag behind the actual block
What goes wrong:
- customer accepts and pays, but delay communication may not happen fast enough if parts or slot are blocked
- the customer experiences silence between agreement and repair start

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

### Non-negotiable progression rules already visible
- quote acceptance must trigger immediate progression checks
- payment state must be explicit, not inferred
- parts readiness must be explicit, not assumed
- technician slot / capacity must be explicit, not socially guessed
- customer deadline / expectation must be re-confirmed against real capacity
- if any required control is missing, the job should move into a visible blocked state, not silently sit in limbo

### Handoff integrity rules
Before workshop handoff, the business should know:
- the approved repair scope
- the approved price / payment status
- the required parts and their readiness state
- who is doing the work
- when the work is expected to start
- what expectation has been set with the customer

### Communication rule
If acceptance has happened but repair cannot start as expected, customer communication should be immediate and explicit.
Silence after payment is operationally unacceptable.

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

5. **Parts ready**
- required parts are in stock or reserved with a trusted ETA and decision

6. **Repair slot ready**
- a real technician slot exists
- expected start timing is not fiction

7. **Repair queue ready**
- payment, parts, slot, and expectation all align
- job can now properly enter active repair queue

8. **Workshop handoff complete**
- the correct technician / workshop queue has the device, the instruction, and the readiness context

9. **Repair in progress**
- technician has actually started work

### Core decision rule
The critical control decision in this domain is:
- does this accepted diagnostic become repair-queue ready now, or does it enter a visible hold/blocked state?

That decision should not rely on memory or casual tagging.
It should be explicit and auditable.

---

## Ownership

### Current owner picture visible so far
From upstream capture, the current practical owner map appears to include:
- Ferrari:
  - quote issue
  - chasing acceptance / payment
  - making sure accepted diagnostics actually move toward repair
- Ronnie:
  - parts readiness owner in practice
  - likely key owner for stock confirmation / reservation reality
- Saf or assigned technician:
  - downstream repair execution once the job is truly ready
- Naheed:
  - earlier intake and physical receipt ownership, with less evidence yet in this domain
- Ricky:
  - quality owner where translation, timing, and operational truth are weak

### Important owner-map truth
This domain is a cross-functional handoff point.
That means owner ambiguity is especially dangerous here.

The likely clean ownership split to test is:
- Ferrari owns customer-side commercial progression
- Ronnie owns parts-readiness truth
- workshop lead / technician owner owns slot-readiness truth
- system gate decides whether the job is truly repair-queue ready

This needs confirmation in later capture.

---

## Exceptions, Holds, and Escalations

### Holds already implied by prior capture
An accepted diagnostic should not silently drift when any of these are false:
- payment confirmed
- parts available or reserved
- technician slot available
- customer timing / expectation confirmed

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
- how are parts reserved today, if at all, for accepted diagnostic repairs?
- what evidence in Monday / Intercom best confirms the real owner map?

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

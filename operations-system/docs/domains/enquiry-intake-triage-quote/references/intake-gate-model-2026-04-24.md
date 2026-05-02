# Intake Gate Model
Date: 2026-04-24
Last updated: 2026-04-24 01:08 UTC
Status: working draft

## Purpose
This file captures the cleaned-up intake gate model clarified with Ricky on 2026-04-24.

It is intended to become the reference layer for:
- KB promotion
- SOP drafting
- intake-system build requirements
- downstream queue / automation design

---

## 1. Core design principle
The intake problem is not mainly that staff forget details.

The deeper failure is that the current process allows incomplete jobs to pass through intake and reach technicians, who then become the first people to discover missing information.

That creates:
- interruption
- delay
- technician dependency on memory-based follow-up
- customer expectation drift
- queue chaos

Future-state principle:
- intake must be guided, not memory-based
- submission must be blocked when required information is missing
- the system must decide whether a job is truly ready to move forward
- customer communication must branch correctly when a device is received but not actually ready for repair flow

---

## 2. Ricky’s test for intake complete
The strongest readiness test is:

> If a technician picks up this device, do they have all the information they need to proceed without asking intake any follow-up questions?

If the answer is no, intake is not complete.

---

## 3. What intake complete means at physical receipt
Before a job should leave intake, these things must be true where relevant:
- customer notes are present and clear
- required pre-testing is completed
- power meter / basic power check is completed
- passcode or access status is confirmed
- device is labelled correctly
- accessory / screw box / related handling items are labelled where needed
- received device matches expected device and booked job
- repair instruction or diagnostic framing is clear enough for technician pickup without clarification

---

## 4. Hard-required minimum gate
Hard-required minimum to submit into active repair or diagnostic flow:
- default repair description exists
- received device matches the expected / booked device
- passcode or access is available if testing is required
- payment state is correct for the service type
  - example: diagnostic payment taken where required

Additional rule:
- if testing is required and no valid access is available, the job must not enter active repair flow

---

## 5. Intake hold model
The business currently has blocked Monday statuses, but these are mostly downstream damage states rather than clean intake controls.

Cleaner rule:
- if technician-critical information is missing, the job should be held before workshop touch
- technician should not be the first error detector
- hold reason should be explicit and visible

Likely intake-hold reasons:
- missing repair notes
- missing or incorrect passcode / testing access
- parts not checked
- parts not available
- intake checks not completed
- customer clarification required

---

## 6. Core intake structure
The intake system should not be one flat checklist.

It should contain:
- shared intake core for every device
- conditional question sets based on:
  - device type
  - repair type
  - fault type
  - service path
- wider CRM/context capture as a separate layer

Useful layers:
1. core identity
2. repair-operational data
3. control / risk data
4. CRM / relationship context

Important distinction:
- some data is useful enrichment
- some data is readiness-critical and must block submission if missing

---

## 7. Simple repair gate
For simple / known repairs:
- parts check is a hard intake control

Rules:
- part availability must be known before accepting the job into active repair flow
- if part is not in stock, expected arrival date must be known
- intake must determine whether repair can still meet the customer deadline / expectation
- if not, customer expectation must be reset before or at handoff
- in some cases, the correct outcome is not to accept the device yet and instead rebook

Decision tree:
- part in stock -> proceed
- part not in stock, ETA known, still inside customer expectation -> proceed with clear timing
- part not in stock, ETA misses expectation -> inform customer and decide delay / rebook / hold with consent
- part status unknown -> intake cannot be complete

Operational implication:
- if customer is booked to come in, the business should ideally already know whether the part is available and warn or rebook before arrival if needed

---

## 8. Diagnostic gate
For diagnostics:
- parts check is not an intake gate
- exact parts may not be knowable until diagnostic completion
- parts reservation / check happens after diagnostic completion, at quote acceptance

Diagnostic intake-complete hard requirements:
- default problem description captured
- device received matches expected device
- passcode / access available if needed for testing
- diagnostic payment taken where required
- enough fault/context information captured for a technician to begin diagnosis without chasing intake

---

## 9. Post-diagnostic gate
Quote accepted should move into repair queue only when:
- parts are available or reserved
- technician repair slot is available
- payment is confirmed
- customer deadline / expectation is confirmed

This is the second major readiness gate after diagnostic completion.

---

## 10. Ownership
Current reality:
- Naheed is the practical human owner of intake signoff

Current likely owner map for common gaps:
- missing repair notes:
  - walk-in: Naheed
  - mail-in / courier: Ferrari
- missing or incorrect passcode:
  - walk-in: Naheed
  - mail-in / courier: Ferrari
- unclear repair scope:
  - primarily Ferrari, with Naheed input at intake edge
- parts check:
  - currently ownerless in practice
  - should likely sit with Ronnie or a defined stock/intake role

Important rule:
- ownerless checks are not real checks

Future clean-state model:
- AI validation / signoff should own readiness to move jobs into queue
- humans provide and confirm source information
- the system enforces completeness and readiness

---

## 11. Clean flow now visible
High-level flow:
- inquiry
- booked incoming job
- device received
- intake complete
- diagnostic in progress, if needed
- quote issued
- quote accepted
- repair queue ready
- repair in progress

Key split:
- simple / known repair -> parts check at intake
- diagnostic repair -> parts check at quote acceptance

---

## 12. Immediate outputs this creates
### KB additions needed
- intake gate definition
- simple repair vs diagnostic gate split
- parts-check timing rules
- intake-hold concept and hold reasons
- intake signoff ownership model
- customer communication branching for ready vs on-hold received jobs

### SOPs needed
- physical device receipt and mark-in
- intake completeness check
- simple-repair parts check and expectation-setting
- diagnostic intake completeness check
- intake hold handling and customer communication
- accepted diagnostic -> repair queue readiness check
- device labelling standard by device type / handling container

### System requirements now visible
- guided intake, not memory-based intake
- conditional question logic by device / repair / fault / service path
- submission blocking when required fields are missing
- different gate logic for simple repairs vs diagnostics
- explicit intake holds before workshop touch
- customer notification branching for off-path / blocked jobs
- parts-availability awareness early enough to shape booking and expectation decisions
- AI readiness validation before queue movement

# Business Problem Frame
Last updated: 2026-04-23 10:27 UTC

## Purpose
This document frames the actual business problem we are trying to solve.

It exists to stop us reducing the situation to “we just need SOPs” or “we just need to clean Monday.”

Those are both true, but neither is the full problem.

---

## 1. Short version
The business is not stuck only because documentation is weak.
It is stuck because the **operating system of the business is fragmented, person-dependent, and running on a contaminated workflow substrate.**

Current reality:
- Monday is the live operational backbone
- Monday is also overloaded, unreliable, and structurally hard to trust
- process truth lives partly in people’s heads, partly in scattered docs, partly in extracted data, and partly in broken system states
- ownership is concentrated in a few key people and several roles are acting as bottleneck middleware
- because of that, automation cannot be safely layered on top without first clarifying the operating model

So the work is bigger than SOP writing.
It is an **operations system rebuild**.

---

## 2. The real problem stack

### Layer 1: System substrate problem
Monday is doing too much and representing too many different concerns at once.

Observed issues:
- repair, comms, shipping, QC, BM, payment, and admin concerns are mixed together
- stale queue debt contaminates live queue visibility
- source attribution is broken
- payment fields are not trustworthy
- update threads contain real knowledge but are noisy and hard to turn into clean state
- automations and webhooks are layered onto an already overloaded board design

Meaning:
- Monday is useful as evidence
- Monday is poor as a clean operating model
- if we design the future by copying Monday, we will reproduce the mess in a new system

### Layer 2: Ownership design problem
The business depends too heavily on specific people as translators, escalators, and bottlenecks.

Observed patterns:
- Safan is a primary throughput engine
- Misha and Andreas are the next real production base
- Roni is overloaded across QC, parts, and BM diagnostics
- Ferrari acts as a customer/admin/workshop translation layer
- Ricky remains the implicit exception owner and system integrator

Meaning:
- too much operational continuity lives in human memory and ad hoc coordination
- role boundaries are not clean enough
- several workflows are stable only because the right person is manually bridging gaps

### Layer 3: Process-definition problem
The business does not have a sufficiently complete, current, trusted SOP layer.

Observed patterns:
- some domains are well developed, especially BM relative to the rest
- many core workshop/customer-service handoffs are missing, thin, or outdated
- historical docs often exist, but live truth is mixed with stale assumptions

Meaning:
- people are forced to improvise
- measurement is weak because expected process is unclear
- onboarding, delegation, and automation all become fragile

### Layer 4: Measurement and control problem
The business cannot cleanly trust several core management surfaces.

Observed gaps:
- queue truth is contaminated
- payment truth is broken
- source attribution is broken
- per-person attribution is partially blurred by shared accounts and automation tokens
- response, quote, and closure metrics are hard to read end to end

Meaning:
- the business cannot reliably see where value is created or lost
- decisions get made through narrative and intuition more than clean control surfaces

### Layer 5: Automation readiness problem
You cannot safely automate chaos.

Observed pattern:
- there are many workflows that look partially automatable
- but the rule layer beneath them is often unclear, inconsistent, or person-dependent

Meaning:
- agent workflows should not be built by mirroring current mess blindly
- first the process has to be made explicit enough that automation is an extension of clarity, not a faster version of confusion

---

## 3. What SOPs are, and what they are not
SOPs are necessary because they:
- capture operational truth
- reduce person-dependence
- define handoffs and expected actions
- make ownership visible
- create the rule layer required for automation

But SOPs alone are not enough.

Why not:
- if the underlying system state is contaminated, SOPs will describe workarounds rather than clean control
- if ownership remains overloaded, SOPs won’t remove bottlenecks by themselves
- if the future-state system is not defined, SOPs may accidentally canonize Monday’s bad structure

So SOPs should be treated as one layer inside a broader rebuild.

---

## 4. The rebuild frame
The real program is:

### A. Extract current-state truth
We need to know how the business actually works today.

Inputs:
- Ricky’s lived knowledge
- VPS evidence and extracted data
- Monday activity and item threads
- audits, reports, journey files, and system research

Outputs:
- current-state workflow maps
- real owner map
- exception classes
- dependency points
- hidden manual translation work

### B. Define target-state operations
We need to define how the business should work in a cleaner future system.

Outputs:
- cleaner state model
- cleaner ownership model
- cleaner platform boundaries
- explicit process rules
- what belongs in software vs human judgment vs agent workflows

### C. Build the control layer
This is where SOPs, KB, and reference docs come in.

Outputs:
- SOP tree
- KB articles
- role guides
- handoff rules
- decision trees
- escalation rules

### D. Build the execution layer
Only after the first three layers are stable enough.

Outputs:
- automations
- agents
- integrations
- dashboards
- replacement system components beyond Monday

---

## 5. Why moving beyond Monday matters
Ricky’s current view is explicit:
- Monday is a mess
- Monday cannot be fully trusted
- the business wants to move toward a completely new system away from Monday

This changes how we should document.

We should not document only:
- “how Monday currently works”

We should document both:
1. **current-state reality** — including broken Monday-dependent workarounds
2. **target-state operating model** — how the business should function in a system designed correctly

That distinction matters because:
- current-state documentation prevents knowledge loss
- target-state documentation prevents re-embedding the mess in the next platform

---

## 6. The major business problem areas now visible

### Problem area 1: Revenue leakage at the top of the funnel
Symptoms:
- slow response times
- unanswered leads
- weak lead-to-quote-to-booking control
- phone/direct demand disappearing from attribution

### Problem area 2: Queue and workflow contamination
Symptoms:
- stale non-terminal work cluttering board truth
- mixed queue, bench, blocked, admin, and historical states
- too many implicit exceptions

### Problem area 3: Human bottleneck middleware
Symptoms:
- Ferrari translating and pushing many next steps
- Ricky handling cross-domain ambiguity
- Roni carrying multiple critical control roles

### Problem area 4: Throughput drag on core producers
Symptoms:
- true workshop output concentrated in a few people
- rework and QC burden reduce effective capacity
- parts and queue issues add lifecycle delay beyond active bench time

### Problem area 5: Broken financial/control closure
Symptoms:
- payment state unreliable
- quote/payment lag surfaces contaminated
- reconciliation owner unclear

### Problem area 6: Documentation and system drift
Symptoms:
- incomplete SOPs
- stale references
- scattered knowledge across builds, docs, tools, and human memory

---

## 7. What success looks like
A successful rebuild would produce:

### Operationally
- clear owner per workflow stage
- clean live queue truth
- reduced dependence on human translators
- less stalled work and fewer hidden exceptions

### Systemically
- a target-state platform model beyond Monday
- cleaner source-of-truth boundaries
- trustworthy state and payment surfaces
- measurable journey performance end to end

### Documentation-wise
- durable SOP tree
- evidence-backed KB
- current-state and target-state process maps
- explicit decision trees and escalation rules

### Automation-wise
- agent workflows built on stable rules
- repetitive admin/translation work removed from people
- humans reserved for actual judgment, edge cases, and customer trust moments

---

## 8. What this means for how we should work next
We should continue in this order:

1. keep indexing and structuring the evidence already on the VPS
2. run daily extraction sessions with Ricky by business domain
3. write actual docs in parallel, not after the fact
4. separate current state from target state in every major domain
5. identify automation candidates only after the rules are explicit enough

---

## 9. Immediate implication
The next sessions should not be framed as:
- “tell me how Monday works”

They should be framed as:
- “tell me how the business actually works now”
- “tell me where Monday distorts that reality”
- “tell me what the cleaner future-state should be instead”

That is how we get from messy operations to a real operating system.

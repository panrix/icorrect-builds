# System Audit Working Map
Last updated: 2026-04-23 10:01 UTC
Sources:
- `/home/ricky/builds/system-audit-2026-03-31/platform_inventory/monday.md`
- `/home/ricky/builds/system-audit-2026-03-31/outputs/findings.md`
- `/home/ricky/builds/system-audit-2026-03-31/outputs/fact_ledger.md`
- `/home/ricky/builds/system-audit-2026-03-31/outputs/open_questions.md`

## Why this file exists
This is the working synthesis layer between the raw system audit and the operations build we are now doing with Ricky.

Goal:
- keep verified findings visible
- separate current evidence from open questions
- turn the audit into a usable ops program instead of a pile of research

---

## 1. Core verified truths worth carrying forward

### Operating model / system truth
- Monday.com is the operational backbone of the business.
- Back Market is approximately 60% of revenue and remains a dominant operational and revenue channel.
- There are not fully documented SOPs across the business, and this is internally recognised as a critical problem.
- The current Monday structure has workflow limitations and was already expected to be cleaned before deeper automation.
- BM operations are unusually mature relative to the rest of the business, with 12 mapped SOPs, though some steps are still manual.

### Current risk / control truth
- The business is loss-making through a combined problem of weak-margin BM volume, poor conversion, stuck work, and broken financial/control loops.
- Payment state is not trustworthy today because reconciliation and write-back ownership are broken.
- Monday source attribution is broken badly enough that phone/direct demand effectively disappears from reporting.
- Monday’s main board is structurally overloaded and not a clean source of live queue truth.
- Two active catch-all Monday webhooks still exist with unknown destinations and ongoing action burn.
- Credentials/config source of truth is split across diverging env files.

### Operational documentation truth
- There is already a large research base on the VPS.
- This means we should not rebuild operations knowledge from chat alone.
- The correct approach is: evidence layer first, Ricky clarification second, SOP/automation design third.

---

## 2. What Monday specifically tells us about the ops problem
Source emphasis: `platform_inventory/monday.md` + audit findings

### Verified Monday realities
- Main board `349212843` has `4443` items, `34` groups, `169` columns, and `51` status columns.
- Repair, comms, shipping, QC, payment, trade-in, and BM concerns are mixed into one board.
- Linked-board and mirror dependencies are heavy.
- Native automations plus webhook layers are both active.
- Main board carries a large stale non-terminal queue, so visible board state is not equal to live operational state.
- Monday free-text updates contain useful operational intelligence, but are noisy and concentrated in a few people.

### Implication for the ops rebuild
We cannot treat Monday as a clean process map.
We have to treat it as:
- a live but contaminated operational substrate
- useful for evidence extraction
- unsafe as sole process truth without interpretation

That matters because agent design based directly on today’s board without process cleanup will inherit the mess.

---

## 3. Immediate workstreams this audit implies

### Workstream A: Operations truth capture
Purpose:
- define how the business actually works now across all major journeys

Inputs:
- client journey files
- Ricky sessions
- team audit data
- Monday evidence

Outputs:
- current-state process maps
- missing SOP backlog
- ownership map
- exception classes

### Workstream B: Monday cleanup / state model
Purpose:
- reduce Monday from overloaded, stale, mixed-use board logic into a usable operational state model

Known issues to solve:
- stale queue debt
- mixed concerns in one board
- broken source attribution
- overloaded statuses
- ambiguous queue vs bench occupancy
- excessive automation/webhook complexity

Outputs:
- target state board model
- closure/archive policy
- queue ownership rules
- state transition rules
- field/source-of-truth map

### Workstream C: Payment / finance closure
Purpose:
- restore trustworthy paid/unpaid/reconciled truth

Known issues:
- ownerless payment write-back
- broken reconciliation between Monday, Stripe, SumUp, Xero
- contaminated quote/payment date logic in Monday

Outputs:
- canonical payment-state model
- owner map
- reconciliation design
- write-back rules

### Workstream D: Inquiry / conversion control
Purpose:
- stop losing high-intent work through slow or broken response/quote follow-up

Known issues:
- reply inconsistency
- unanswered leads
- source attribution gaps
- long-tail post-diagnostic exceptions

Outputs:
- response ownership
- triage and quote SOPs
- quote-decision ageing rules
- lead source capture fix

### Workstream E: Automation / agent design
Purpose:
- convert stable process segments into agent workflows

Constraint:
- only automate after rule clarity is good enough

Outputs:
- replace now list
- SOP first then automate list
- human-judgment list
- system boundary map

---

## 4. Best daily-session question areas from the open questions list
These should become our live interview prompts with Ricky.

### Highest-value ops questions
1. Who owns front-desk and intake now that older ownership assumptions are stale?
2. What is the real current path from enquiry -> quote -> decision -> repair start by channel?
3. What should count as live queue vs debt vs archive on Monday?
4. Who owns ageing and blocked post-diagnostic cases?
5. Which elapsed-time states should be excluded from operational SLA metrics?
6. What is the true payment truth model and who owns write-back?
7. What is the intended source-of-truth platform per business function?
8. What should staff document in Monday updates vs Intercom notes vs structured fields?
9. What should stay human judgment versus become agent work?
10. What should the canonical team-owner map be for each workflow now?

### Highest-value Monday questions
1. Which native Monday automations are still truly live and wanted?
2. Which webhook destinations are live, dead, or unknown?
3. What is the clean target-state split for repair/comms/QC/shipping/BM concerns?
4. What is the lowest-friction way to separate bench occupancy from queue ownership?
5. Should current `Source` be repaired or replaced?

---

## 5. Practical implication for the next week of work
We should run the next week as a structured capture sprint:

### Phase 1: establish the map
- index evidence sources
- pull verified findings into working docs
- define current owner map
- define domain order

### Phase 2: extract current-state process from Ricky
Suggested sequence:
1. enquiry / intake / triage
2. diagnostic / quote / decision
3. workshop routing / queue logic
4. parts / sourcing / stock dependency
5. QC / testing / signoff
6. payment / completion / shipping / collection
7. warranty / rework / aftercare
8. people ownership / escalation / management

### Phase 3: convert into assets
For each domain create:
- current-state note
- SOP draft
- open questions list
- automation candidate list
- source-of-truth map

---

## 6. What this means for my role as Ops Jarvis
My role is not just answering questions in chat.
My role is to become the durable operations capture layer for the business.

That means:
- using existing VPS evidence as the starting substrate
- interviewing Ricky to resolve what evidence cannot tell us
- storing the outputs continuously in workspace docs
- turning them into SOPs, KB material, and automation-ready specs
- preventing loss of operational context between sessions

---

## Recommended immediate next step
Start the first structured domain session with Ricky on:
**enquiry -> intake -> triage -> quote handoff**

Reason:
- it sits at the top of the whole business funnel
- it links directly to the revenue leakage findings
- it will expose ownership, platform boundaries, and handoff failures early
- it creates the cleanest base for later workshop and automation design

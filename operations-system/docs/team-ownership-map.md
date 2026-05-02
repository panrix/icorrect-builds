# Team Ownership Map
Last updated: 2026-04-23 10:26 UTC
Primary sources:
- `/home/ricky/kb/team/roster.md`
- `/home/ricky/builds/system-audit-2026-03-31/research/team/team-operations-summary.md`
- `/home/ricky/builds/system-audit-2026-03-31/research/team/staff-performance-analysis.md`
- `/home/ricky/builds/system-audit-2026-03-31/research/team/staff-performance-blockers.md`
- `/home/ricky/builds/team-audits/reports/safan/safan_deep_dive_2026-03-02.md`
- `/home/ricky/builds/team-audits/reports/ferrari/ferrari_complete_reference_2026-02-26.md`
- Ferrari six-month Monday exports in `builds/team-audits/reports/ferrari/`

## Purpose
This file maps the real operational ownership structure of the workshop as currently evidenced, including throughput owners, bottlenecks, fragile dependencies, and role ambiguities.

This is not a formal org chart. It is an operations control map.

---

## 1. Executive view
The business is not suffering from a simple staffing problem.
It is suffering from a **fragile ownership structure** where a small number of people carry disproportionate parts of the operational system.

Current picture:
- Safan is the primary throughput engine.
- Misha and Andreas are the next real bench contributors.
- Roni is a multi-role dependency spanning QC, parts, and BM diagnostics.
- Ferrari is a central translation and coordination node rather than a core production node.
- Ricky remains the escalation owner and implicit system integrator across almost everything.
- Older front-desk/intake ownership assumptions are partly stale because Adil is no longer current.

This means the business depends heavily on:
- a few real producers
- a few overloaded coordinators
- weakly defined handoff boundaries

---

## 2. Role map by person

### Ricky Panesar
**Role in practice:** founder, escalation owner, decision owner, cross-system integrator

**Observed ownership:**
- final decision point on process, tooling, staffing, automation, and exceptions
- de facto owner of unresolved cross-domain issues
- implicit fallback when no one else clearly owns a workflow

**Operational risk:**
- too many decisions still route back to Ricky
- business knowledge remains partially concentrated in Ricky’s head
- if systems are unclear, Ricky becomes the human reconciliation layer

**Needs from the system:**
- documented ownership beneath him
- cleaner exception routing
- fewer cases escalated only because the base process is unclear

---

### Safan Patel
**Role in practice:** lead repair technician, diagnostic engine, workshop technical coordinator

**Observed strengths:**
- clearest repair throughput owner
- highest completion count in accessible six-month data
- strong Monday reply discipline with detailed diagnostics and routed instructions
- coordinates technical work across team, not just his own jobs

**Evidence:**
- `610` unique completions in six-month staff-performance slice
- `4.49` completions per working day
- `95` update replies in 3-week deep dive
- regularly routes work to Misha, Andreas, Roni, Ferrari, and Ricky through item replies

**What he really owns:**
- standard repair throughput
- technical diagnosis
- BER / repairability judgment on many devices
- practical routing inside workshop once a device is in motion

**Risks / constraints:**
- high QC/rework proxy means throughput is partly eroded by repeat work
- parts blockers still interrupt output
- likely carrying informal coordination load beyond pure bench work

**Conclusion:**
Safan is not just a technician. He is one of the real workshop system anchors.

---

### Misha Kepeshchuk
**Role in practice:** lead refurb technician, higher-value refurb/repair contributor, secondary workshop lead

**Observed strengths:**
- second meaningful output engine after Safan
- stronger visible paid value per completed item than Safan in the usable subset
- day-to-day supervision link for Andreas

**Evidence:**
- `339` unique completions in six-month staff-performance slice
- `2.49` completions per working day
- visible paid value average `£414.05` per completed item in the measurable subset

**What he really owns:**
- refurb throughput
- higher-value paid work in some segments
- practical secondary leadership on bench side

**Risks / constraints:**
- still part of a very concentrated throughput base
- rework/QC burden remains non-trivial

**Conclusion:**
Misha is not optional spare capacity. He is one of the three real throughput pillars.

---

### Andreas Egas
**Role in practice:** refurb technician, flexible support across refurb and occasional spillover operational tasks

**Observed strengths:**
- material contributor, especially after December ramp
- relatively clean QC profile in some audits
- may absorb spillover tasks when front-desk/intake coverage is thin

**Evidence:**
- `230` unique completions in six-month staff-performance slice
- `2.45` completions per working day
- roster and older audits show both refurb work and some intake-like serial-entry touchpoints

**What he really owns:**
- refurb production
- overflow execution where process gaps force redistribution

**Risks / constraints:**
- role may be partially diluted by spillover work from weakly owned processes
- lower volume than Safan/Misha means still not broad enough to de-risk workshop concentration

**Conclusion:**
Andreas is a real contributor, but the business still should not mistake his flexible role for a solved capacity problem.

---

### Roni Mykhailiuk
**Role in practice:** QC lead, parts manager, BM diagnostics dependency

**Observed strengths:**
- spans multiple essential control functions
- likely central to workshop quality closure and stock/parts reality
- important link between BM exceptions and workshop flow

**Evidence:**
- roster explicitly says QC lead + BM diagnostics + parts manager
- audit material repeatedly treats Roni as a cross-team dependency
- Ferrari and Safan materials both route work/questions toward Roni

**What he really owns:**
- QC gatekeeping
- parts/stock dependency resolution
- BM technical decision inputs

**Operational risk:**
- too many separate functions converge on one person
- this makes Roni a likely bottleneck node
- if QC, parts, and BM decisions are all centralized here, delays compound across workflows

**Conclusion:**
Roni is a high-risk dependency concentration point. This role bundle needs separation or better system support.

---

### Michael Ferrari
**Role in practice:** customer/admin translator, workflow coordinator, comms bottleneck node

**Observed strengths:**
- central coordination presence in Monday
- handles customer-facing written comms, booking/admin transitions, quote/invoice progression, and extensive thread-level coordination
- now evidenced across 6 months of raw Monday replies and activity logs

**Observed limits:**
- not a meaningful bench-output contributor
- much activity is translation/admin/routing rather than high-skill production
- historical Intercom performance and Monday analysis both show substantial bottleneck/leakage patterns

**Evidence:**
- only `7` unique completions in six-month staff-performance slice
- `1,954` Ferrari-written Monday records in six-month raw extraction
- `881` inbound mentions/tags to Ferrari in the same window
- prior audit shows large volume of board admin and weak customer response throughput relative to time logged

**What he really owns today:**
- translating customer/workshop/admin state between people and systems
- quote and status progression in Monday
- some invoicing/payment/completion coordination
- reply-thread coordination inside Monday

**What he probably does not own well enough to justify central dependency:**
- true production throughput
- highly differentiated judgment that cannot be systematized in many of his admin flows

**Operational risk:**
- Ferrari is a human middleware layer
- large parts of workflow appear to wait on him for translation, chasing, and next-step pushing
- that makes him a bottleneck even where the work itself may be SOP-able or automatable

**Conclusion:**
Ferrari is operationally important today because the system depends on his coordination role, not because he is the main source of unique productive output.

---

### Suzy
**Role in practice:** title-only, not operationally active

**Conclusion:**
Do not model live operational ownership around Suzy.

---

### Adil Azad (historical)
**Role in practice before dismissal:** front desk + intake + some BM diagnostics / admin coverage

**Current relevance:**
- historical only
- current process assumptions that still depend on Adil are stale

**Important implication:**
there is likely an ownership gap in front-desk/intake where the old process map has not been cleanly reassigned.

---

## 3. Real ownership structure by workflow

### Workshop throughput
**Primary real owners:** Safan, Misha, Andreas

### Diagnostic decisioning
**Primary real owner:** Safan
**Secondary / dependent inputs:** Roni, Ricky on harder edge cases

### QC / release gate
**Primary real owner:** Roni

### Parts / stock resolution
**Primary real owner:** Roni
**Dependent coordination:** Ferrari, Ricky, possibly technicians when chasing specifics

### Customer/admin translation layer
**Primary real owner today:** Ferrari
**Problem:** too much workflow still depends on this human translation layer

### Front desk / intake
**Current owner:** not yet cleanly mapped after Adil
**Status:** active gap requiring clarification with Ricky

### Cross-system exceptions and final decisions
**Primary real owner:** Ricky

---

## 4. Main bottlenecks and fragilities

### Bottleneck 1: Ferrari as translation middleware
Symptoms:
- high inbound tag volume
- lots of status/admin/routing activity
- team waits for Ferrari replies/next moves

Interpretation:
- Ferrari is currently a coordination choke point
- much of this should become SOP + automation + cleaner role ownership

### Bottleneck 2: Roni as role bundle
Symptoms:
- QC + parts + BM diagnostics all converge on one person

Interpretation:
- too much control logic concentrated into one dependency node
- likely responsible for hidden queue drag and delayed closure

### Bottleneck 3: Ricky as unresolved escalation sink
Symptoms:
- unclear rules come back to Ricky
- system redesign, people issues, finance truth, and process exceptions all converge upward

Interpretation:
- business cannot scale cleanly while Ricky remains the implicit exception router for everything

### Bottleneck 4: concentrated bench throughput
Symptoms:
- workshop output depends heavily on Safan, then Misha and Andreas

Interpretation:
- throughput protection matters more than generic “everyone should do more” narratives
- admin leakage into these people is particularly costly

---

## 5. What this means for the rebuild
This team map implies the rebuild must do four things:

1. **protect true producers**
- Safan, Misha, Andreas should lose avoidable admin drag and repeat work

2. **de-bottleneck translation work**
- Ferrari-held coordination should be split into SOP, automation, and clearer ownership

3. **separate overloaded control roles**
- Roni’s QC/parts/BM bundle needs redesign support

4. **stop routing everything unresolved to Ricky**
- clearer decision trees and role boundaries are essential

---

## 6. Documentation gaps still open
- Who now owns front-desk/intake in current reality?
- Which Ferrari tasks are already partially handled by AI or automation versus genuinely manual?
- Which Roni tasks can be separated or systematized first?
- Which workshop delays are true people-capacity issues versus bad queue/state design?
- What is the clean current owner map for payment write-back and completion closure?

---

## Recommended next companion document
`business-problem-frame.md`

This should explain that the business problem is not “people need more SOPs.”
It is a wider operating-system failure involving:
- wrong system substrate
- contaminated state truth
- weak ownership design
- incomplete documentation
- blocked automation readiness

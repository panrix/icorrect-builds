# Process Document Structure Template
Last updated: 2026-04-24 01:42 UTC
Status: active template

## Purpose
Use this structure for working process-domain documents that are capturing how iCorrect currently operates, where it breaks, and what the clean target model should be.

This is not the final SOP format.
This is the truth-capture and process-clarification format that should exist before SOPs are formalised.

Rule:
- document the messy current reality
- separate it clearly from the intended operating model
- do not let current workarounds contaminate the canonical future rule set

---

## Recommended file structure

### 1. Title
Use a clear domain or process name.

Example:
- `Enquiry -> Intake -> Triage -> Quote Handoff`
- `QC Workflow`
- `Parts Reservation and Allocation`

### 2. Metadata header
Include:
- last updated
- status
- owner if helpful
- scope if helpful

Example:
```md
# Domain Capture: Enquiry -> Intake -> Triage -> Quote Handoff
Last updated: 2026-04-24 01:42 UTC
Status: active working draft
Owner: Ops / Ricky
Scope: current-state truth capture and future-state rule clarification
```

### 3. Purpose
Short section explaining:
- why this file exists
- what part of the business it covers
- whether it is a current-state capture, future-state clarification, or both

### 4. Current state, reality today
Document what actually happens now.

This section should include:
- real steps
- who currently does the work
- systems touched
- informal workarounds
- tribal logic currently relied on

Important rule:
- this section is descriptive, not prescriptive
- write what is true, not what should be true

### 5. Current failure modes
Document what breaks in reality today.

Typical sub-sections:
- information capture failures
- ownership failures
- timing/progression failures
- communication failures
- tooling/system failures

This section should make the pain visible, not hide it.

### 6. Target-state / governing rules
Document the clean operating truth that should govern this domain.

This section should include:
- what must always be true
- gates
- required checks
- signoff rules
- progression rules
- hold/block rules

Important rule:
- this is the normative layer
- it should be clean and unambiguous

### 7. Stage model or decision model
If the process moves through stages or decisions, define them explicitly.

Examples:
- inquiry -> lead -> booked -> expected -> received -> intake complete
- diagnostic accepted -> parts reserved -> repair queue ready
- pending -> in progress -> QC -> complete

If useful, also include:
- decision trees
- split logic
- branch rules by job type

### 8. Ownership
Document who owns each meaningful step.

Useful format:
- current-state owner
- target-state owner
- escalation owner

This section should answer:
- who is responsible?
- who clears a hold?
- who signs off progression?

### 9. Exceptions, holds, and escalations
Document:
- what can block the flow
- how blocked work should be labelled
- who resolves each block
- when escalation is required

This is where messy exception handling becomes explicit and controllable.

### 10. Open questions
Keep unresolved items visible.

Examples:
- unknown ownership
- unclear state boundaries
- policy not yet decided
- needs operator confirmation

Important rule:
- do not bury uncertainty inside the main rule sections
- isolate it here

### 11. System implications
Only after the process truth is clear, document what systems or agents need to support.

Examples:
- fields required
- validation logic
- notifications
- agent signoff checks
- UI implications
- automations

Important rule:
- this section is downstream of process truth
- do not let software design define operating truth by accident

### 12. Links to future SOPs / KB entries
At the end of the file, list what formal outputs should eventually be created from this process capture.

Example:
- SOP: physical intake mark-in
- SOP: intake completeness check
- KB: intake gate rules
- KB: parts-check timing rules

---

## Recommended section order
```md
# {Process or domain title}
Last updated: {timestamp}
Status: {status}

## Purpose

## Current State, Reality Today

## Current Failure Modes

## Target-State / Governing Rules

## Stage Model / Decision Model

## Ownership

## Exceptions, Holds, and Escalations

## Open Questions

## System Implications

## Future SOP / KB Outputs
```

---

## Writing rules

### Keep reality and intent separate
Never mix:
- what happens now
with:
- what should happen

If both appear in the same section, agents and humans will learn the wrong thing.

### Name the mess directly
If the process is messy, say so plainly.

Examples:
- this is currently tribal knowledge
- this owner is overloaded
- this step is currently unreliable
- this check is ownerless in practice

### Use explicit labels
Prefer labels like:
- current state
- target state
- current owner
- target owner
- hard gate
- hold reason
- escalation

This makes the documents easier for agents to parse and for humans to scan.

### Keep open questions isolated
Do not hide uncertainty inside rule sections.
Open questions should be obvious.

### Use one file per meaningful domain
Do not make one giant process dump if the domain boundaries are real.
Split by domains such as:
- enquiry/intake/triage
- workshop execution
- QC
- parts lifecycle
- customer communication

---

## Relationship to SOPs and KB
This template is for process truth capture.

Later outputs should split into:
- SOPs
  - step-by-step role instructions
  - written in a highly crawlable operational format
- KB entries
  - canonical rules, definitions, policies, and decision logic
  - also written in an agent-friendly format

Suggested long-term structure:
- working process capture docs live in build/workspace discovery areas
- approved SOPs live in a main SOP folder
- approved KB entries live in a main KB folder
- both can then be mirrored into Obsidian-ready folders if desired

---

## Core principle
Document the messy reality, but do not let the mess become the canon.

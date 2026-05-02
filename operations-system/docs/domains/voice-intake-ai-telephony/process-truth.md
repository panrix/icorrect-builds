# Voice Intake / AI Telephony
Last updated: 2026-04-25 03:17 UTC
Status: active working draft
Owner: Ops / Ricky
Scope: target-state operating model for inbound phone handling, recording, transcription, AI voice handling, CRM writeback, and human escalation

## Purpose
This document captures the target-state design for iCorrect's phone intake layer.

It exists because phone calls are currently one of the weakest evidence surfaces in the business. Valuable customer conversations happen, but the system often fails to preserve who called, why they called, what was promised, and what next step was required.

The goal is not simply to replace a basic VoIP system.
The goal is to create a voice-entry operating layer that converts phone calls into measurable, structured, and actionable operational records.

## Current State, Reality Today
- iCorrect currently runs on a basic VoIP setup
- calls are not reliably recorded
- calls are not transcribed
- many calls do not create a durable system record
- there is weak visibility into:
  - who called
  - whether the caller was a new enquiry or existing customer
  - what they needed
  - what was promised
  - whether follow-up happened
- phone is therefore one of the weakest channels for:
  - attribution
  - conversion analysis
  - customer-service quality control
  - process learning
  - SOP extraction
- current human answering path is expected to involve Ferrari and Naheed in the near term
- desired future state includes AI voice agents linked to iCorrect knowledge and workflow rules

## Current Failure Modes
### Information capture failure
- useful customer conversations happen without creating a durable record
- call reason is often not captured in a structured way
- next action can be lost after the call ends

### Attribution failure
- the business cannot cleanly distinguish between:
  - new enquiries
  - existing customer chases
  - quote chases
  - corporate enquiries
  - supplier/admin calls

### Quality-control failure
- no recording means there is no replayable evidence for training, QA, or dispute review
- no transcription means the business cannot search call content or learn systematically from call patterns

### Workflow-control failure
- phone calls do not reliably create CRM/helpdesk/intake objects
- follow-up ownership can be ambiguous
- callback and chase loops are not system-enforced

### Automation-readiness failure
- because the call surface is not structured, AI cannot safely assist, summarize, classify, or progress work reliably

## Target-State / Governing Rules
### Core rule
Every meaningful inbound call must create a durable operational record.

### Required target-state outcomes for each inbound call
For every meaningful inbound call, the system should capture:
- caller number
- time/date
- call recording
- transcript
- routed call reason
- final classified outcome
- responsible owner
- next action
- linked customer/contact record
- linked job / lead / ticket where relevant

### Call routing rule
Inbound calls should pass through a structured IVR before human or AI handling.

Minimum routing branches:
- press 1: new enquiry
- press 2: existing customer
- press 3: corporate / business
- press 4: other / supplier / accounts if needed

### Recording rule
- calls should be recorded by default where lawful and policy-approved
- caller notice should be given at the start of the call
- retention, access, export, deletion, and sensitive-data handling must be explicitly governed

### Human + AI handling rule
The system should support both:
- near-term human answering by Ferrari / Naheed / office team
- future-state AI-first answering with human escalation when confidence, policy, or exception conditions require it

### Writeback rule
A phone call is not operationally complete until its outcome is written back into the correct system of record.

### Follow-up rule
If a call creates a promised next step, the next step must become a tracked task, ticket, lead progression action, or job update.

## Stage Model / Decision Model
### Stage 1: inbound call received
- call hits main business number
- IVR message plays
- recording notice is delivered

### Stage 2: call intent routing
Caller chooses path such as:
- enquiry
- existing customer
- corporate
- other

### Stage 3: handling path selection
System decides whether to route to:
- AI voice agent
- human office handler
- fallback voicemail / callback queue

### Stage 4: call handling
During the call, the system should:
- identify caller if known
- retrieve prior customer/job context where possible
- capture or confirm call reason
- guide the conversation using iCorrect knowledge and policy
- collect missing structured information

### Stage 5: outcome classification
At call end, the system should classify the call into a controlled outcome such as:
- new lead created
- existing job updated
- quote chase logged
- callback required
- corporate opportunity created
- not a fit
- resolved with no further action

### Stage 6: writeback
System writes the outcome into the correct connected systems, for example:
- CRM/contact record
- Intercom conversation/ticket
- intake system
- Monday or future operations system

### Stage 7: escalation or follow-up
If the call created a next step, the system should create and assign it immediately.

## Ownership
### Current-state human handling owner
- Ferrari
- Naheed / office team support

### Target-state handling owner
- AI voice layer for standard flows
- human escalation owner for exceptions, ambiguity, policy risk, or high-value conversations

### Escalation owner categories
- new enquiry exception: customer-service / sales owner
- existing repair status issue: service progression owner
- corporate opportunity: Ferrari or defined corporate owner
- technical ambiguity: workshop / diagnostic owner
- policy exception / unhappy caller: Ricky or designated escalation owner depending on severity

## Exceptions, Holds, and Escalations
### Must escalate to human
- caller is upset or trust-sensitive
- technical ambiguity exceeds safe script/KB boundaries
- complaint, refund, or legal-risk surface appears
- AI confidence is below threshold
- linked job/customer record is missing or conflicting
- caller requests a human explicitly

### Hold / fallback states
- voicemail for callback
- callback queue
- unresolved identity match
- unresolved job match
- transcript failure
- CRM writeback failure

### Important control rule
A failed writeback or failed follow-up creation is a control failure, not a cosmetic issue.

## Open Questions
- what should the full call reason taxonomy be?
- what system should become the canonical writeback surface for calls long term?
- should Intercom remain the primary communications shell for phone-linked records?
- what exact data should be mandatory before a new-call enquiry becomes a lead?
- which calls should remain human-only even after AI deployment?
- what retention period should apply to recordings and transcripts?

## System Implications
### Platform recommendation
#### Long-term foundation
**Twilio** is the strongest long-term platform recommendation.

Reason:
- it best supports custom IVR, recording, transcription, AI voice logic, CRM writeback, KB retrieval, and agent/human handoff design
- it is better suited than a standard business phone product for building a true custom voice-entry operating layer

#### Near-term bridge option
**Aircall** is the strongest near-term operational bridge.

Reason:
- faster deployment
- strong IVR + recording + transcription + CRM/helpdesk integrations
- stronger immediate usability for Ferrari / Naheed
- useful if the business wants fast improvement before the custom AI voice layer is built

#### Middle-ground option
**Dialpad** is the strongest middle-ground option.

Reason:
- stronger native AI features than Aircall
- less custom flexibility than Twilio
- useful if the business wants more AI now without committing to a full custom platform build

### Recommended target architecture
Target flow:
- caller -> IVR -> AI voice agent -> KB retrieval + customer/job lookup -> outcome classification -> CRM/helpdesk/intake writeback -> human escalation where needed -> summary stored to system

Key architecture components:
- telephony platform
- recording layer
- transcription layer
- retrieval layer against iCorrect KB / SOPs / process docs
- customer/job context lookup
- call classification logic
- task / ticket / lead creation logic
- human escalation logic
- audit log + retention controls

### Why Twilio is the best long-term fit
Twilio fits the future-state requirement because the business is not merely choosing a phone system.
It is choosing the foundation for a programmable voice workflow that must connect to:
- iCorrect knowledge
- customer history
- repair/job records
- future operations-system logic
- human escalation rules

## Future SOP / KB Outputs
### SOPs
- inbound call handling SOP
- missed-call callback SOP
- AI voice escalation SOP
- call outcome classification SOP
- call recording retention/access SOP

### KB outputs
- phone call stage definitions
- call reason taxonomy
- human escalation rules for AI voice
- call-to-lead definition
- call-to-job update rules

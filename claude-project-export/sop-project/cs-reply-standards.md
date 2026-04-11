---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/SOPs/intercom-handling.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/reply-templates.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/context.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/quote-building-sop.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/finn-lessons.md
  - /home/ricky/kb/SCHEMA.md
related:
  - ../customer-service/README.md
  - ../customer-service/intercom-setup.md
  - ../customer-service/triage-rules.md
---

# Reply Standards

Current customer-service reply rules compiled from Alex's SOPs, templates, and drafting guidance.

## Content

## Core Workflow Rule

- Alex drafts.
- Ferrari approves and sends.
- Alex should not send customer replies directly from Intercom.

This means reply standards are aimed at draft quality and handoff quality, not autonomous outbound sending.

## Tone

Use a tone that is:

- calm
- direct
- neutral
- human
- specialist rather than sales-led

The quote SOP is explicit that replies should read like a technician explaining findings clearly, not a call-centre script and not a hard sell.

## Style Rules

- No em dashes in customer-facing copy.
- Never assume gender; use neutral language when needed.
- Do not include the business address in the reply body because the footer handles it.
- Keep the language plain and concrete.
- Avoid filler technical phrases and vague engineering jargon.
- Do not over-explain or repeat the same point in multiple ways.

For diagnostic or quote language, do not claim that repairs have already been completed unless the message is explicitly a post-repair status update grounded in Monday.

## Structure Rules

For standard Intercom replies:

- greet the customer by name where known
- acknowledge the request plainly
- answer only what is known from the KB or Monday
- state the next step clearly
- end with `Kind regards`

For quote-style drafting:

- use the approved quote structure from Alex's quote SOP
- separate required repairs from optional repairs
- include the 2-year warranty statement in repair-detail sections
- keep pricing blank when the repair is outside confirmed pricing coverage

## Signing Rules

The source set is internally inconsistent on named sign-off:

- `intercom-handling.md` says draft replies should sign off as Ferrari, not Alex
- `context.md` says always sign off as Alex
- `reply-templates.md` uses `Kind regards` and relies on the footer for company identity

For this KB page, the Intercom-specific SOP takes precedence over the broader context note:

- do not sign Intercom drafts as Alex
- use the template pattern of `Kind regards` in the body
- if a named sign-off is required for a manual draft outside the template pattern, use Ferrari because Ferrari is the sender/approver in the active workflow

## Prohibited Patterns

Avoid:

- yes/no dead-end CTAs with no concrete next step
- silent escalations where the customer gets no acknowledgement
- guessed diagnoses or guessed pricing
- robotic escalation language
- inconsistent diagnostic pricing
- over-engaging with obvious spam

Finn's failure patterns are treated as anti-rules for the current workflow: no buried BM emails, no symptom-based guesswork, and no escalation without customer acknowledgement.

## Scenario Notes

- New enquiries should include either confirmed pricing plus booking link, or a short holding reply requesting the missing details needed for pricing.
- Collection and turnaround replies must be grounded in Monday status.
- Warranty replies should acknowledge the 2-year warranty but must not confirm eligibility before review.
- Complaint replies should acknowledge the issue without committing to outcome.
- Device-decline replies should be polite, brief, and not escalate unless the case is unusual.

## Open Questions

- Whether the named sign-off conflict should be resolved globally across Alex's workspace docs, not just in this KB page.
- Whether quote emails and Intercom replies should remain governed by one shared style standard or split into separate KB pages later.

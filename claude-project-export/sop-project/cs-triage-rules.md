---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/triage-mapping.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/SOPs/intercom-handling.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/ferrari-guide.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/finn-lessons.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/paid-not-contacted-detection.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/reports/cs-report-2026-03-10.md
  - /home/ricky/builds/system-audit-2026-03-31/research/customer-service/intercom-metrics-deep.md
  - /home/ricky/builds/system-audit-2026-03-31/research/customer-service/intercom-full-metrics.md
related:
  - ../customer-service/README.md
  - ../customer-service/intercom-setup.md
  - ../customer-service/reply-standards.md
---

# Triage Rules

Current prioritisation rules for working the Intercom queue, based on Alex's SOPs and the live leakage/backlog audits.

## Content

## Primary Goal

The current CS problem is prioritisation and follow-through, not lack of inbound demand. Triage exists to make sure Ferrari's limited time goes to the highest-risk and highest-value conversations first.

## Priority Order

### P1 Immediate Escalation

Handle these first and route to Ferrari immediately:

- Back Market platform emails
- customer threats of legal action or formal complaint
- post-repair complaints
- warranty claims on repairs under 2 years old
- paid-but-not-contacted cases with more than 24 hours of silence
- any customer who has given two clear confirmations and is ready to book

If a paid-but-not-contacted gap exceeds 48 hours, escalate to Ricky as well as Ferrari.

### P2 Fast Human Attention

These need quick drafting and Ferrari review:

- corporate enquiries
- new repair enquiries where pricing is known
- new repair enquiries where pricing is unknown but missing details can be requested
- collection confirmations
- turnaround chases

Corporate and ready-to-book conversations should not sit behind low-value queue cleanup.

### P3 Routine Handling

These can be worked from SOP/template flow:

- status chases with clear Monday data
- first-contact warranty acknowledgements
- old-device declines
- spam, supplier outreach, and obvious marketing pitches

Spam can be closed without Ferrari approval.

## Category Routing

### Alex Can Prepare

Alex is expected to:

- classify the conversation
- look up Monday and KB context
- draft the reply
- write the internal Intercom note
- update Monday where required
- escalate with a short, specific ask

### Ferrari Owns

Ferrari owns:

- sending customer replies
- pricing decisions outside confirmed KB coverage
- complaint handling
- warranty assessment
- corporate relationship handling
- any case requiring phone contact or human judgement

### Ricky Escalation Layer

Route via Ferrari to Ricky when the case involves:

- legal risk
- formal complaints
- free repair or significant discount decisions
- corporate pricing exceptions
- unresolved Ferrari escalations

## Timing Thresholds

- Any conversation waiting more than 12 hours without a draft ready should be flagged to Ferrari.
- `11-20` hours is a watch zone from the Ferrari audit.
- `25+` hours is already a problem.
- `63+` hours is a critical failure pattern seen in the audits.
- Paid customers should receive booking confirmation within 24 hours and a status update within 48 hours if work is in progress.

The live Intercom audit reinforces that these are not theoretical thresholds: reply coverage is poor and the open backlog is already large.

## Operational Rules By Conversation Type

### New Repair Enquiry

- Search Monday by email first.
- Use KB pricing if available.
- If pricing is not certain, send a short holding draft and flag Ferrari.
- Do not guess the repair from symptoms alone.

### Quote Confirmation / Ready To Book

- Treat as high priority.
- Two clear confirmations means escalate to Ferrari immediately.
- Do not leave a ready customer in a loop of repeated confirmation questions.

### Turnaround / Status Chase

- Read Monday status and notes before drafting.
- If Monday is unclear, draft a holding response and flag Ferrari rather than inventing status.

### Warranty Claim

- Confirm original repair record exists.
- Acknowledge and request photo/video evidence.
- Do not confirm eligibility before review.

### Post-Repair Complaint

- Always tag `needs-ferrari`.
- Add internal note before assignment.
- Do not commit to refund, free repair, or outcome.

### Paid-Not-Contacted

- Cross-check Shopify payment, Intercom outbound activity, and Monday status progression.
- Treat payment plus silence as urgent.
- Add internal note, flag Ferrari, and update Monday.

### Back Market

- Route immediately to Ferrari.
- Do not let standard queue handling or AI-style flows touch BM platform emails.

## Live Queue Risks That Affect Triage

The live research points to the biggest leakage zones:

- new enquiries are heavily under-answered
- WhatsApp and Instagram have the weakest reply coverage
- pricing/quote conversations are a major unreplied risk cluster
- the workspace carries a large long-open backlog that can bury urgent cases if triage is not explicit

This means triage should optimize for revenue-risk and churn-risk first, not simple FIFO handling.

## Open Questions

- Whether there is a live daily briefing process now, or whether it remains an intended routine from Alex's March report.
- Whether the 24h/72h follow-up sequence has been built anywhere outside the documented plan.

---
status: unverified
last_verified: 2026-04-06
sources:
  - /home/ricky/builds/system-audit-2026-03-31/research/customer-service/intercom-metrics-deep.md
  - /home/ricky/builds/system-audit-2026-03-31/research/customer-service/intercom-full-metrics.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/intercom-api-reference.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/SOPs/intercom-handling.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/monday-api-reference.md
  - /home/ricky/.openclaw/agents/alex-cs/workspace/docs/context.md
  - /home/ricky/data/exports/system-audit-2026-03-31/intercom/admins-live-2026-04-02.json
  - /home/ricky/data/exports/system-audit-2026-03-31/intercom/teams-live-2026-04-02.json
related:
  - ../customer-service/README.md
  - ../customer-service/reply-standards.md
  - ../customer-service/triage-rules.md
  - ../monday/main-board.md
---

# Intercom Setup

Current Intercom workspace configuration for customer service, based on live audit pulls and Alex's operating docs.

## Content

## Workspace

- Intercom is the active customer-service channel for iCorrect.
- Workspace ID is `pt6lwaq6`.
- Conversation URLs use `https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/{conversation_id}`.
- The live workspace is carrying both inbound customer conversations and proactive outbound follow-up.

## Admins And Teams

Live exports on 2026-04-02 show:

- `Michael Ferrari` (`9660594`) exists as an admin but does not currently have an inbox seat in the export snapshot.
- `Support` (`9702337`, `admin@icorrect.co.uk`) has the active inbox seat.
- `Alex` (`9702338`, `operator+pt6lwaq6@intercom.io`) exists as an admin without an inbox seat. **NEVER use 9702338 as a send route. All outbound emails must go via 9702337 (Support). 9702338 is banned for sending.**
- There is one live team: `Support` (`9725695`) with `round_robin` distribution and only the `Support` admin attached.

The SOP layer says Ferrari manages the inbox day to day and Alex supports via drafting and triage. The live export therefore suggests an operational split between the named human owner and the actual seat/team configuration.

## Active Channels

The live six-month audit shows customer traffic arriving through:

- email
- web messenger chat
- Instagram
- WhatsApp
- phone-created conversations

Email is the dominant inbound channel. Social and WhatsApp are materially smaller but have weaker reply coverage and should not be ignored.

## Operating Model

- Finn/Fin is disabled as of February 2026.
- All conversations are currently intended to be handled manually, with Alex supporting Ferrari rather than sending directly.
- The current workflow is draft-first: Alex prepares context and reply drafts, Ferrari reviews and sends.
- Spam, marketing, and supplier outreach can be closed without Ferrari approval.
- Back Market platform emails are special-case traffic and should bypass normal inbox handling straight to Ferrari.

## Monday Linkage

Intercom is not the canonical customer identity owner. Monday is.

Current documented link points:

- Main board ID: `349212843`
- Primary lookup field: `Email` (`text5`)
- `Intercom ID` is stored on Monday in `text_mm087h9p`
- `Intercom Link` is stored on Monday in `link1`

For repair conversations, Alex's SOPs require a matching Monday update. The current identity gap is that Monday still lacks a stable reusable customer ID, so Intercom joins still depend mainly on email and phone heuristics.

## Tags, Notes, And Workflow Markers

- Internal notes are the expected handoff mechanism before escalation.
- Documented conversation tags include `needs-ferrari` and `spam-auto-closed`.
- Warranty and complaint handoffs are expected to carry an internal Intercom note plus a Monday update.
- Unread/open queue monitoring can be done through the Intercom conversations API, but no live automation layer is documented as active.

## Current Queue Condition

The April 2026 audit describes a heavily overloaded workspace:

- `30,982` all-time conversations
- `2,113` open conversations in the current queue on 2026-04-02
- `1,398` open conversations with no human reply recorded
- `1,206` open conversations older than 90 days

This means the current setup is not just a configuration issue. The workspace is live, connected, and structured enough to operate, but the queue discipline is failing.

## Known Configuration Gaps

- Only one live team is visible in the audit export.
- The live admin/team seat layout does not cleanly match the stated human ownership model.
- No active webhook-driven response or follow-up workflow is documented as running after Finn was disabled.
- No SLA, queue-routing, or priority automation is confirmed from the Intercom side.
- Intercom cannot currently serve as a clean identity hub because Monday still lacks a stable customer key.

## Open Questions

- Whether Ferrari's lack of inbox seat in the 2026-04-02 export is real live config or an audit/export artifact.
- The numeric tag IDs for `needs-ferrari` and `spam-auto-closed`, which are referenced in docs but not recorded in the current source set.
- Whether any Intercom rules, macros, or automations still exist from the Finn period and are affecting routing silently.

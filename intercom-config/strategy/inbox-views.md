# Intercom Inbox Views — Strategy

**Status:** Locked, Phase 1 — ready to deploy
**Decided with Ricky:** 2026-04-28
**Owner of inbox today:** Ferrari (UI) + Alex (API pull, separate filter logic)

---

## Phase 1 — deploy now (no auto-tag dependency)

| # | View name | Filter | Sort | Notes |
|---|---|---|---|---|
| 1a | 🟢 New from NEW customer | `channel=email AND state=open AND contact.conversation_count == 1` | newest first | Hot leads from people who've never contacted before. Highest conversion priority. |
| 1b | 🟢 New from EXISTING customer | `channel=email AND state=open AND contact.conversation_count > 1` | newest first | Returning customer reaching out — different tone, repair history available. |
| 2 | 📱 Social — IG + WhatsApp | `channel IN [instagram, whatsapp] AND state=open` | newest first | Currently underserved channels. Surfacing them increases responsiveness on IG/WA traffic. |
| 3 | 🔄 Awaiting our reply | `state=open AND last_message_from=customer` | newest first | The "ball is in our court" set. Alex's mirror set (independent polling). |
| 4 | 🚨 Stuck — no reply 24h+ | `state=open AND (no admin reply OR last admin reply >24h)` | oldest first | Remediation queue. Anything in here is at risk of becoming a complaint or lost lead. The 32% reply-rate problem from the Feb audit lives here. |
| 5 | 💬 Shopify in-app chat | `channel=in_app_messenger AND state=open` | newest first | Minimal until KB is populated. Gets activated after Alex has KB-07 pricing data to handle these. |

## Phase 2 — after auto-tag workflow

Adds intent-based views once we have a workflow that auto-tags conversations based on first-message content. Categories from Ricky:

- 💼 Quotes / invoices (`tag IN [intent:quote, intent:invoice]`)
- 🔴 Warranty / complaints (`tag IN [intent:complaint, intent:warranty]`)
- 🔧 Live repair chases (`tag=intent:status` OR linked Monday repair active)

These overlap with Phase 1 views — a single conversation may appear in both (e.g. a warranty complaint sitting in #4 Stuck AND tagged for #7 Warranty). That's intentional.

---

## Sort logic rationale

- **Newest first** for everything that's a real-time feed — fresh signals, Ferrari/Alex acts in the moment.
- **Oldest first ONLY** for view #4 (Stuck) — by definition a remediation queue, oldest = most overdue = highest urgency.

---

## Why these views in this combination

The Feb 2026 audit (`/home/ricky/.openclaw/agents/customer-service/workspace/docs/intercom-audit-february-2026.md`) flagged three core problems:

1. **71% of addressable conversations went unanswered** — fixed by view #3 (Awaiting our reply) being Alex's primary feed + view #4 catching the rest.
2. **32% reply rate on customer complaints** — view #4 catches anything stale 24h+, regardless of intent.
3. **Instagram/WhatsApp underserved** — view #2 explicitly surfaces them.

Plus Ricky's strategic addition: split new enquiries by new-vs-existing-customer (1a vs 1b) — different treatment, different tone.

---

## Open / next

- **Phase 2 prerequisites:** auto-tag workflow needs to be defined + deployed before views #6-8.
- **Shopify in-app dependency:** KB-07 (pricing) needs to be populated before view #5 becomes useful.
- **Alex's filter logic** stays in `/home/ricky/builds/alex-triage-rebuild/scripts/inbox-triage.js` — independent of these views, but should converge on the same conversations when both are working correctly.

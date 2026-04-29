# Intercom Inbox Views — Strategy

**Status:** Locked, Phase 1 — ready to deploy
**Decided with Ricky:** 2026-04-28, updated 2026-04-29 (added Corporate)
**Owner of inbox today:** Ferrari (UI) + Alex (API pull, separate filter logic)

---

## Phase 1 — deploy now

| # | View name | Filter | Sort | Notes |
|---|---|---|---|---|
| 0 | 🏢 Corporate inbox | `state=open AND contact.customer_type == 'corporate'` (Phase 1: domain heuristic — see below) | newest first | Sits top of list. Supersedes 1a/1b for corporate senders. Higher per-job value + relationship cost. |
| 1a | 🟢 New from NEW customer | `channel=email AND state=open AND contact.conversation_count == 1 AND not corporate` | newest first | Hot leads from people who've never contacted before. Highest conversion priority. |
| 1b | 🟢 New from EXISTING customer | `channel=email AND state=open AND contact.conversation_count > 1 AND not corporate` | newest first | Returning customer reaching out — different tone, repair history available. |
| 2 | 📱 Social — IG + WhatsApp | `channel IN [instagram, whatsapp] AND state=open` | newest first | Currently underserved. Surfacing increases responsiveness on social traffic. |
| 3 | 🔄 Awaiting our reply | `state=open AND last_message_from=customer` | newest first | Ball-in-our-court set. Cross-cuts other views. Alex's mirror set (independent polling). |
| 4 | 🚨 Stuck — no reply 24h+ | `state=open AND (no admin reply OR last admin reply >24h)` | oldest first | Remediation queue. The 32% reply-rate problem from the Feb audit lives here. |
| 5 | 💬 Shopify in-app chat | `channel=in_app_messenger AND state=open` | newest first | Activates after KB-07 pricing is populated. |

## Corporate detection — two approaches

**Phase 1 — domain heuristic (deploy with view #0):**
A contact is treated as corporate if their email domain is NOT in this consumer-provider list:
```
gmail.com, yahoo.com, yahoo.co.uk, hotmail.com, hotmail.co.uk,
outlook.com, icloud.com, me.com, live.com, googlemail.com, msn.com,
aol.com, ymail.com, btinternet.com, sky.com, virgin.net, talktalk.net,
ntlworld.com, blueyonder.co.uk, mac.com, protonmail.com, fastmail.com
```
Plus a manual allow-list (Xero-billed corporate domains) ensures they always flag.

False positives expected: sole-traders on personal-business domains. Acceptable cost — Ferrari sees them and corrects via the next approach.

**Phase 2 — custom Intercom contact attribute:**
Add `customer_type` (enum: `consumer | corporate | vip`). Alex auto-populates on first contact via domain heuristic + Monday corporate-board lookup (board `30348537`). Manual override stays in Intercom UI.

View #0's filter switches from heuristic to attribute-based once this is live.

## Phase 2 — after auto-tag workflow

Adds intent-based views once a workflow auto-tags conversations by first-message content:

- 💼 Quotes / invoices (`tag IN [intent:quote, intent:invoice]`)
- 🔴 Warranty / complaints (`tag IN [intent:complaint, intent:warranty]`)
- 🔧 Live repair chases (`tag=intent:status` OR linked Monday repair active)

These overlap with Phase 1 views — a conversation can appear in multiple (e.g. corporate complaint = view #0 AND view #7). Intentional.

---

## Sort logic

- **Newest first** for everything that's a real-time feed — fresh signals, act in the moment.
- **Oldest first ONLY** for view #4 (Stuck) — remediation queue, oldest = most overdue = highest urgency.

---

## Rationale (audit-traced)

The Feb 2026 audit (`/home/ricky/.openclaw/agents/customer-service/workspace/docs/intercom-audit-february-2026.md`) flagged:

1. **71% of addressable conversations went unanswered** → fixed by view #3 + #4 catching the rest.
2. **32% reply rate on customer complaints** → view #4 catches anything stale 24h+, regardless of intent.
3. **Instagram/WhatsApp underserved** → view #2 explicitly surfaces them.

Plus Ricky's strategic additions:
- Split new enquiries by new-vs-existing-customer (1a vs 1b) — different tone, different treatment.
- Corporate gets its own top-priority view (#0).

---

## Open / next

- **Phase 2 prerequisites:** auto-tag workflow needs to be defined + deployed before views #6-8.
- **Shopify in-app dependency:** KB-07 (pricing) needs to be populated before view #5 activates.
- **Alex's filter logic** stays in `/home/ricky/builds/alex-triage-rebuild/scripts/inbox-triage.js` — independent of these views.
- **Corporate detection:** start with domain heuristic. Migrate to `customer_type` attribute when auto-tag workflow ships.

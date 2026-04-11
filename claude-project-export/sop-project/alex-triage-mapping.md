# Triage Mapping — Alex

What Alex handles autonomously, what gets escalated to Ferrari, and what gets routed to humans only.

Source: 498 clean Intercom conversations (Jan–Feb 2026).

---

## Conversation Volume by Type

| Category | Count | % of total |
|---|---|---|
| New repair enquiry | 177 | 35.5% |
| Invoice / payment query | 94 | 18.9% |
| Unspecified / general | 71 | 14.3% |
| Feedback / follow-up | 60 | 12.0% |
| Warranty claim | 31 | 6.2% |
| Live repair – status chase | 28 | 5.6% |
| Quote confirmation | 27 | 5.4% |
| Data recovery enquiry | 6 | 1.2% |
| Cancellation | 2 | 0.4% |
| Back Market enquiry | 1 | 0.2% |

---

## AI Handling Breakdown (Overall)

| Category | Count | % |
|---|---|---|
| Fully AI-handleable | 52 | 10.4% |
| Partial (AI + human handoff) | 318 | 63.9% |
| Human only | 128 | 25.7% |

**72.7% of conversations had a KB gap** (Partial or No KB). Pricing is the primary blocker — resolving KB-07 unlocks most of the "Partial" category.

---

## Alex Handles Autonomously

| Conversation type | Condition | KB required |
|---|---|---|
| Repair status chase | Monday record exists | KB-03 |
| Old / unsupported device decline | Device is iPhone 7/X or older, MacBook pre-2016 | KB-06 |
| Spam / marketing / supplier | Matches known spam patterns | None |
| Collection confirmation | `status4` = Ready To Collect, payment clear | KB-03 |
| Warranty acknowledgement (first contact only) | Draft acknowledgement + ask for photo | KB-02 |
| Turnaround query | Device/repair is confirmed in KB-01 | KB-01 |

---

## Alex Drafts — Ferrari Approves Before Sending

**All customer-facing messages require Ferrari approval before sending.** Alex never sends autonomously.

| Conversation type | What Alex does | What Ferrari does |
|---|---|---|
| New repair enquiry (pricing in KB) | Drafts quote with pricing + booking link | Reviews and sends |
| New repair enquiry (pricing NOT in KB) | Drafts "need more details" holding message | Reviews and sends; prices the job |
| Collection confirmation | Drafts confirmation with hours | Reviews and sends |
| Turnaround chase | Drafts status update from Monday | Reviews and sends |
| Warranty acknowledgement | Drafts acknowledgement + photo request | Reviews and sends; handles assessment |

---

## Always Ferrari / Human-Only

| Conversation type | Why |
|---|---|
| Corporate enquiry (any) | Relationship management, SLAs, invoicing |
| Post-repair complaint | Always Ferrari first, Ricky if unresolved |
| Warranty assessment | Physical inspection + human judgement |
| Invoice / payment query (94 cases) | No Xero integration yet |
| Data recovery enquiry | Specialist assessment needed |
| Cancellation | May involve charges — needs human sign-off |
| Any repair where pricing is not in KB | Cannot quote without Ferrari |
| Anything requiring a phone call | Alex has no phone capability |
| Customer threatening legal action | Escalate to Ricky |

---

## Top Blockers to More Automation

| Blocker | Conversations blocked |
|---|---|
| Missing pricing KB (KB-07) | 184 conversations |
| Xero integration for invoices | 94 conversations |
| Corporate account complexity | 238+ conversations |
| Warranty physical inspection required | 31 conversations |

**Priority:** KB-07 pricing unblock is the single highest-leverage action.

---

## Revenue Impact

- **190 lost/unresolved sales enquiries** in 2 months
- Estimated lost revenue: **£33,370**
- **74.9% of lost sales had zero follow-up** — the biggest gap is follow-up, not first response

---

## Top KB Articles Needed

Ranked by conversation volume:
1. Turnaround time options (184 conversations) — KB-01 exists, draft
2. Xero invoice status (94) — no agent integration yet
3. General repair pricing (72) — KB-07 BLOCKED
4. Warranty policy (31) — KB-02 exists, draft
5. Current Monday repair status (28) — KB-03 exists, ready

---

*Source: customer-service/workspace/data/triage-mapping-summary.md*
*Last updated: 2026-03-10*

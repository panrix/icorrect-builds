# Quoting Process SOP

**Status:** draft
**Last verified:** 2026-04-07
**Sources:**
  - voice note with Ricky, 2026-04-07
---

## Overview

Standard operating procedure for how Ferrari creates and delivers repair quotes to clients.

## Quote Contents

Every quote includes:
- **Price** — how much the repair costs
- **Timeline** — how long it will take

## Quote Disputes & Escalation

### Client Pushback Levels

**Level 1 — Discount request:**
- Client wants a lower price
- Ferrari can sign off discounts within his current discretion
- No escalation needed

**Level 2 — Dispute about accuracy:**
- Client claims the quote is wrong or they've been over-quoted
- Should escalate to **Ricky via notification**
- In practice, Ferrari sometimes handles these without flagging — this needs tightening

### TODO: Pushback Review
- Review historical quotes and pushbacks to understand patterns
- Use findings to build clearer discount guardrails

### Pricing Authority
- **Current state:** Ferrari has no formal pricing boundaries — full discretion to quote and offer discounts
- **Issue:** Discounts have been offered (particularly on screen repairs and multi-repairs) without a clear view of profitability
- Ricky has discussed this with Ferrari — guardrails are needed

### Profitability Calculator (TODO)
**Future build:** A tool or reference that shows Ferrari:
- Base parts cost + labour cost for each repair
- Total repair cost vs quote price
- How much discount room exists before margin breaks
- Profit potential per device type

---

## Quote Delivery

### Channel
- **Email** — quotes sent to client via email
- Client may reply to email to approve, or call to discuss

### Expiry & Follow-Up
- Quotes have **no expiry date** — open-ended until client responds
- **TODO: Automated chase system** needed
  - If no response after **1–2 weeks**, send a follow-up
  - Chases should add a timeline: "Please confirm within X days — pricing may change after [date]"
  - Pricing fluctuates (parts cost, market rates), so open quotes are a risk

### Approval Flow
1. Client replies to email confirming approval, OR calls to discuss
2. **Send invoice via Xero** (currently manual process)
3. Client pays
4. Device is placed in the **repair queue**

### Parts Reservation (TODO)
**Current state:** Parts are sourced AFTER payment is confirmed. This creates delays.

**Target state:** When a quote is approved, critical parts should be pre-reserved so the repair can start immediately once payment clears.

## Quote Rejection

When a client declines the quote:

1. Monday status set to **"Quote Rejected"**
2. Note added to the item instructing **reassemble the device**
3. Team assesses whether the device has resale/recovery value
4. **If worth salvaging:** Offer to buy the device from the client at a quoted price
5. **Diagnostic fee** is always charged regardless of outcome
6. Client notified the device is ready for collection
7. Device stored in the **small storage room**

---

## Quote Creation

### Who Quotes
- **Ferrari** owns all quoting — every diagnostic quote and every standard repair quote
- No other team member is involved in writing quotes

### Trigger
- Saf completes a diagnostic and marks the item as **"diagnostic complete"** on Monday
- Ferrari is notified of this status change

### Process
1. Ferrari reviews Saf's diagnostic notes
2. Drafts the quote using AI assistance (GPT/Claude) for consistent language
3. Sends the quote to the client via **email**
4. Copies the quote text into the relevant **Monday item** as a permanent record

### Format
- Nearly always the same structure (template-based)
- Same fault types should produce the same wording (pattern matching)
  - Example: MacBook liquid damage affecting keyboard + trackpad = standardised description
  - Template library needs formalisation — see Open Questions below

## Open Questions

1. **Quote templates** — Need to build a standardised template library by fault type (liquid damage keyboard/trackpad, board-level repairs, etc.)
2. **Profitability calculator** — How much discount room exists per repair type before margin breaks? Need to build a reference tool
3. **Pricing guardrails** — What are Ferrari's actual boundaries for discounts? Currently no formal limits in place
4. **Automated quote chase system** — Needs to be built with 1-2 week triggers and pricing expiry warnings
5. **Parts reservation flow** — How does parts pre-reservation work once a quote is approved but before payment clears?
6. **Escalation tightening** — Disputes should always flag to Ricky, but Ferrari sometimes handles independently — needs a clearer trigger rule
7. **Xero invoice automation** — Currently manual, could be automated on quote approval
8. **Historical pushback review** — Need to audit past quotes to understand discounting patterns and build guardrails

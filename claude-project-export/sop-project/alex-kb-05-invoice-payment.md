# KB-05: Invoice & Payment Queries

**Last updated:** 2026-03-04
**Status:** Confirmed — Ferrari approved 2026-03-11 (Xero integration still pending)
**Priority:** HIGH (appears in 94 conversations)

---

## Overview

Invoice and payment queries are the second most common inbound conversation type. Customers typically ask:
- "I haven't received my invoice"
- "Can you resend my invoice?"
- "I've paid — has it been received?"
- "What does this invoice include?"

All invoices are managed in **Xero**.

---

## Current Process (manual)

Currently Ferrari looks up invoice status in Xero manually. The agent cannot yet do this autonomously.

**Until Xero integration is built:**
- Agent acknowledges the query
- Agent asks for confirmation of the email the invoice was sent to
- Agent flags to Ferrari / Finance queue with full context
- Target: respond ASAP — no fixed SLA, treat as urgent

---

## Agent Script

**Customer asks about an invoice:**

> "Thanks for getting in touch about your invoice. I'll get that checked and come back to you shortly — can you confirm the email address the invoice would have been sent to?"

→ Flag to Finance queue with: customer name, email, query type, any invoice/reference numbers mentioned.

---

## Future State (once Xero integration is live)

Agent will be able to:
- Look up invoice status by customer email
- Confirm whether paid or outstanding
- Resend invoice if not received
- Flag disputed amounts to human

---

## Gaps / TODO

- [ ] Ferrari to confirm: what Xero access does the agent need? (API or screen lookup?)
- [ ] Ferrari to confirm: can invoices be resent from Xero automatically, or does this require manual action?
- [ ] Ferrari to confirm: what's the current SLA for invoice queries?
- [ ] Ferrari to confirm: are there common invoice dispute scenarios the agent should know how to handle?
- [ ] Ferrari to confirm: is there a self-serve portal where customers can view/pay invoices?

# Intercom & Fin.ai Customer Service

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Intercom live, Fin.ai implementation in progress
> **Last updated:** 23 Feb 2026

---

## Overview

iCorrect migrated from Zendesk to Intercom for customer service. Fin.ai (Intercom's AI agent) is being implemented to handle first-line customer enquiries, with escalation to the human team for complex cases.

## Intercom Setup

| Field | Value |
|-------|-------|
| Workspace ID | xnj51kwx |
| Admin ID (Alex/Fin) | 9702338 |
| Credential in n8n | "Intercom Auth" |
| Fin.ai | Live since ~15 Jan 2026 |
| Pricing model | $1.99 per resolved ticket |

---

## Fin.ai Channel Strategy

| Channel | Status | Notes |
|---------|--------|-------|
| Website (Messenger widget) | ✅ Live / Planned | Embed on Shopify site |
| Email (support@icorrect.co.uk) | 🔄 In progress | Requires Gmail → Intercom routing |
| Instagram DMs | 📋 Planned | Via official Meta API (safe, no account ban risk) |
| WhatsApp | 📋 Planned | Intercom integration available |
| Phone (IVR) | 📋 Future | Would need voice AI layer (Bland AI / Vapi / Retell) |

### Instagram Decision
Explored MCP server approach for Instagram automation but ruled it out — too risky for business account (uses unofficial API, could trigger account bans). Fin.ai through Intercom's official Meta API integration is the correct approach.

---

## Customer Segmentation Strategy

Fin.ai should handle different customer types differently:

### Existing Customers (Active Repair)
- Check Monday.com for open repair by email/phone
- Provide real-time status updates
- Handle questions about quotes, payment, collection times
- Escalate to human team only when truly needed

### Past Customers (No Active Repair)
- Different tone — reactivation opportunity
- Can reference their repair history

### New Prospects
- Qualification questions about device and issue
- **Actively discourage** simple repairs that aren't iCorrect's specialty
- Get excited about complex repairs ("liquid damage logic board repair? That's exactly our specialty")
- Route to booking flow

---

## Knowledge Base Content Fin Needs

1. **Services & Pricing** — what we repair, costs by device type, diagnostic fees (£49)
2. **Service Types & Process** — walk-in (hours, address, what to expect), mail-in (how it works, courier options, packaging), what happens after drop-off
3. **Turnaround Times** — typical timeframes by repair type
4. **FAQ** — common questions about data safety, warranty, payment methods
5. **Tone Guidelines** — professional but warm, honest about what we can/can't do, position iCorrect as specialists for complex repairs

---

## Notification System (Planned)

### Status Change → Intercom Messages
When repair status changes in Monday, automated messages sent to customer's Intercom conversation.

| Status Change | Message Type | Varies By |
|--------------|-------------|-----------|
| Received | Confirmation | Walk-in vs Remote |
| Booking Confirmed | Confirmation | Warranty vs Standard |
| Courier Booked | Tracking info | Gophr vs Mail-In, Warranty vs Standard |
| Ready To Collect | Collection notice | Warranty vs Standard |

### Technical Implementation
- Monday native automation → Cloudflare Worker (routing) → n8n webhook → Intercom API (send message as admin 9702338)
- Messages sent to existing conversation stored in `link1` column
- Display text: "Fin"

---

## Copilot (Internal Tool)
Intercom includes Copilot — an AI assistant for human agents. When Ferrari handles escalated conversations, Copilot can search the knowledge base and suggest responses. This is separate from Fin (customer-facing) vs Copilot (agent-facing).

---

## Verification Checklist for Jarvis

- [ ] Check Intercom workspace status and admin accounts
- [ ] Verify Fin.ai is active and which channels it's deployed on
- [ ] Check what knowledge base content exists in Intercom
- [ ] Verify admin ID 9702338 is correct for sending automated messages
- [ ] Check DNS authentication status for email channel
- [ ] Test Intercom API connectivity from n8n

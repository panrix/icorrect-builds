# Customer Lookup Guide

How to find a customer across all iCorrect systems, and what to do when one system doesn't match.

---

## The Lookup Chain

Always start with **email**. Email is the most reliable cross-system identifier. Names are unreliable (duplicates, "(Trade In)" suffixes, corporate name variants).

```
Customer message arrives
      ↓
1. Monday — search by email (text5) on board 349212843
      ↓
2. Intercom — search contacts by email
      ↓
3. Shopify — search orders by email (if payment involved)
      ↓
4. Xero — flag to Ferrari (manual only — no agent integration yet)
```

---

## 1. Monday.com

**Board:** iCorrect Main Board — 349212843
**Search column:** `text5` (Email)

**Always search by email, not name.** Names can have "(Trade In)" suffixes or corporate naming like "VCCP [Employee Name]" that breaks name searches.

```graphql
query {
  items_by_column_values(
    board_id: 349212843,
    column_id: "text5",
    column_value: "customer@example.com"
  ) {
    id
    name
    column_values { id title value }
  }
}
```

**What to look for:**
- `status4` — current repair status
- `payment_status` — outstanding balance
- `date4` — when device was received
- `date36` — expected completion
- `board_relation5` — linked device
- `board_relation` — linked repair product

**If no result:** The customer may have booked under a different email, or the repair may predate the current system. Ask politely — then if still nothing, flag to Ferrari.

---

## 2. Intercom

**Search contacts by email:**
```
POST https://api.intercom.io/contacts/search
Body: {"query": {"field": "email", "operator": "=", "value": "customer@example.com"}}
Authorization: Bearer $INTERCOM_API_TOKEN
```

Returns all Intercom contact records matching that email. Each contact may have multiple conversations attached.

**Conversation link format:** `https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/{id}`

**Useful fields in contact record:**
- `id` — Intercom contact ID
- `name` — display name
- `email`
- `phone`
- `conversations` — linked threads

---

## 3. Shopify

**For payment queries:** Search orders by customer email via Shopify Admin API.

```
GET https://i-correct-final.myshopify.com/admin/api/2024-01/orders.json?email=customer@example.com&status=any
Authorization: $SHOPIFY_ACCESS_TOKEN
```

**What to look for:**
- Order ID and status (`paid`, `partially_refunded`, `refunded`)
- Financial status
- Line items (what was ordered)
- Created date

**Note:** Shopify admin is blocked by Cloudflare CAPTCHA in headless browser. Use the API directly. Store domain is `i-correct-final.myshopify.com`.

---

## 4. Xero

**Status:** Manual only — no agent API integration yet (see KB-05).

When a customer asks about an invoice:
1. Note the email, name, any invoice/reference numbers mentioned
2. Flag to Ferrari: "Invoice query from [name], email [address]. Query: [type]."
3. Ferrari looks it up in Xero manually.

Target: once Xero integration is built, agent will be able to look up invoice status directly.

---

## When Systems Don't Match

### Monday has no record for a known customer

Possible reasons:
- Booked under a different email (ask them)
- Corporate booking under company name, not personal email
- Repair predates current Monday setup (pre-2024 items may be on archive boards)
- Back Market customer — check BM board (3892194968) separately

**Do:** Ask for the email they used to book. If still no match — flag to Ferrari.
**Don't:** Speculate on repair status if Monday has no record.

### Intercom has a conversation but no Monday record

Possible reasons:
- Enquiry that never converted to a booking
- BM customer whose enquiry came through Intercom but repair is tracked on BM board

**Do:** Check BM board if email has a BM-domain connection. Otherwise flag to Ferrari.

### Shopify order exists but no Monday record

This is the "paid not contacted" pattern — see `docs/paid-not-contacted-detection.md`.

**Do:** Flag to Ferrari urgently. A customer who has paid and has no corresponding Monday item may be falling through the cracks.

### Customer gives different email than on file

Common with corporate customers or customers who use multiple email addresses.

**Do:** Ask: "Is it possible you used a different email when you first booked?" Cross-reference both in Monday. If found on the alternate email, note both on the Monday item update.

---

## Corporate Clients

Corporate bookings may appear under:
- A company email domain (not a personal Gmail etc.)
- Corporate board 30348537 (VCCP) — check this if you find no record on main board and the email is a company domain

Item naming format for corporate: `[Company Name] [Employee Name]`

---

*Source: customer-service/workspace/docs/SOPs/intercom-handling.md, customer-service/workspace/docs/intercom-agent-build/SPEC.md, website/workspace/MEMORY.md*
*See also: docs/monday-api-reference.md, docs/intercom-api-reference.md*
*Last updated: 2026-03-10*

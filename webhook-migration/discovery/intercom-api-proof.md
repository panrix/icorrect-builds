# Intercom API Write Endpoint Proof

**Date:** 2026-03-30
**Token:** `INTERCOM_API_TOKEN` from `/home/ricky/config/.env`
**API Version:** 2.11
**Test contact:** michael.f@icorrect.co.uk (id: `69666e7097ed49be200c1b50`)

---

## Results

| # | Endpoint | Method | Status | Response |
|---|----------|--------|--------|----------|
| 1 | `/contacts/search` | POST | **PROVEN** | Found contact by email. Returns `{data: [{id, name, email, role}]}` |
| 2 | `/conversations` | POST | **PROVEN** | Created conversation on behalf of user. Returns `{type: "user_message", id, conversation_id}`. Customer is the author. |
| 3 | `/companies` | POST | **PROVEN** | Created company. Returns `{id, name, company_id}` |
| 4 | `/contacts/{id}/companies` | POST | **PROVEN** | Attached company to contact. Returns `{type: "company"}` |
| 5 | `/tickets` | POST | **PROVEN** | Created ticket with `ticket_type_id: 2985889`. Returns `{id, ticket_id, type: "ticket"}` |

## Key Findings

### Conversation creation (the michael.f fix)
```bash
POST /conversations
{
  "from": {"type": "user", "id": "69666e7097ed49be200c1b50"},
  "body": "<p>Message content</p>"
}
# Response:
{
  "type": "user_message",
  "id": "3559523778",
  "conversation_id": "215473696331873",
  "message_type": "inapp"
}
```
**The conversation is created FROM the user contact.** This is the correct fix for the michael.f problem — no SMTP email needed, no Contact Swap needed. The customer is the author.

### Conversation vs Ticket decision
- **Conversations** (`POST /conversations`): creates a user-initiated message. Shows in inbox as customer reaching out. Fin may engage if enabled.
- **Tickets** (`POST /tickets`): creates a structured ticket. Shows in tickets view. Fin does NOT engage with tickets. Requires `ticket_type_id`.

**Recommendation for consumer/quote paths:** Use **conversations** (matches customer expectation — they submitted a form, they want a response). Fin is currently disabled so no concern there. If Fin is re-enabled later, can switch to tickets.

**Recommendation for corporate path:** Use **tickets** (structured, tracked, matches the Shopify Order workflow pattern that already uses tickets).

### Contact role
- n8n currently creates contacts with `role: "user"` (confirmed from workflow JSON export)
- telephone-inbound uses `role: "lead"` (different use case — phone enquiries with incomplete info)
- **Decision:** Use `role: "user"` for Shopify forms (matches current n8n behavior)

### Auth token
- `INTERCOM_API_TOKEN` works for all endpoints
- `INTERCOM_ACCESS_TOKEN` is NOT set in the env file
- telephone-inbound's fallback pattern (`INTERCOM_ACCESS_TOKEN || INTERCOM_API_TOKEN`) is unnecessary — just use `INTERCOM_API_TOKEN`

## Test Artefacts Created (Clean Up)

- Conversation `215473696331873` — created on michael.f test contact. Close/delete in Intercom.
- Company `69ca4f71e5b7cf5cb220b6a7` ("API Test Corp — Delete Me") — delete in Intercom.
- Ticket `215473696340576` (ticket #87463508) — close/delete in Intercom.

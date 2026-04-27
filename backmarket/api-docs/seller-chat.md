# BM seller-chat-agent API — capabilities for iCorrect

5 endpoints, base path `/api/seller-chat-agent/v2/`. **This is NOT BM's customer-facing chat** (that's the buyer↔seller messaging on orders, which we haven't found yet). This appears to be an **internal AI/support chat** for sellers — BM-side chat agent, possibly for asking questions about your account, getting recommendations, or platform support.

The endpoint shapes (Create Conversation, Get Conversation, Stream Messages) are characteristic of an LLM-style chat backend.

## What's here

### 🔴 Admin endpoints
**`GET /v2/admin/check-admin`** — admin liveness check
**`GET /v2/admin/conversations/csv`** — Export all V2 conversations from database to CSV format

These look like BM-staff admin tools. Probably won't work for non-staff accounts (test before assuming).

### 🟡 Conversation creation
**`POST /v2/conversations`** — create a new empty conversation. Generates a conversation ID, stores it server-side.

### 🟡 Read a conversation
**`GET /v2/conversations/{conversation_id}`** — load full history, formatted for API response.

### 🟡 Send a message + stream response
**`POST /v2/conversations/{conversation_id}/messages`** — add a message to an existing conversation. Description says: *"Add a message to an existing conversation and stream the response"* — confirms it's an LLM chat, response is streamed (SSE or similar).

## iCorrect use cases

Realistically, **probably none for now.** This is a BM-internal helper for sellers, not a workflow tool for iCorrect. The only scenarios where it'd be useful:

- **🟡 Audit/log trail.** If you've ever asked BM's chat agent for guidance ("how do I list a phone with custom firmware?"), you could pull the transcript via `GET /v2/conversations/{id}` for compliance / training.
- **🔴 Programmatic queries.** Could in theory POST a question and parse the response. But you'd be using BM's LLM to answer questions about your own data, which is backwards — better to ask Claude / your own systems directly.

## What this is NOT

- **NOT customer↔seller messaging on orders.** That's where customers ask "where's my refund?" — those messages live in a different service we haven't found yet (likely `/api/buyer-experience/...` or under the order itself). When we sweep with Network capture next, we should look for it.
- **NOT BM customer support to you.** That's email / ticketing, not via this API.

## Verdict

Skip this for now. The interesting chat surface is the customer-on-orders messaging, which still needs to be discovered. Suggest a 30-min Network-capture sweep where you click through:
1. Open an order with messages
2. Reply to a customer message
3. Mark as resolved
4. Filter the order list by "has unread messages"

…and we'll surface whatever endpoint backs that.

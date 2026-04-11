# Intercom Capability Matrix — MCP Tools

**Generated:** 2026-02-26
**Purpose:** Document what Intercom data is available to agents via MCP tools, for the v3 agent rebuild.
**Tested by:** Claude Code, live against iCorrect Intercom workspace (pt6lwaq6)

---

## Summary

iCorrect has **6 Intercom MCP tools** available. These provide **read-only** access to conversations and contacts. There is NO ability to reply, create, update, tag, or close conversations via MCP. All write operations require either the Intercom UI, API direct, or n8n workflows.

---

## Available Tools

### 1. search_conversations

**Purpose:** Find conversations by filters.

| Filter | Type | Tested | Notes |
|--------|------|--------|-------|
| state | enum: open/closed/snoozed | YES | Works. 1,378 pages of open conversations found. |
| source_type | enum: conversation/email/facebook/instagram/phone_call/push/sms/twitter/whatsapp | YES | Works. "conversation" = messenger widget, "email" = email inbound. |
| source_author_name | string | — | Available but not tested |
| source_author_email | string | — | Available but not tested |
| admin_assignee_id | number | — | Admin ID (e.g., 9702337 = Support shared account) |
| team_assignee_id | string | — | Team ID (e.g., 9725695) |
| ids | string[] | — | Search by specific conversation IDs |
| statistics_time_to_admin_reply | object {operator, value} | — | Filter by response time in seconds |
| statistics_time_to_assignment | object {operator, value} | — | Filter by assignment time |
| statistics_time_to_first_close | object {operator, value} | — | Filter by close time |
| per_page | number (max 150, default 5) | YES | Pagination works with starting_after cursor |

**Returns per conversation:**
- ID, created_at, updated_at, waiting_since
- Source (type, subject, body, author with name/email)
- Contacts list (IDs only — need get_contact for details)
- Assignment (admin_assignee_id, team_assignee_id)
- State, priority, read status
- Tags (id, name, applied_at, applied_by)
- Statistics (all timing metrics: time_to_assignment, time_to_admin_reply, time_to_first_close, etc.)
- Custom attributes (Has attachments, Language, Ticket category, AI Title, Enquiry Type, Sentiment, Urgency, Spam, etc.)
- Ticket data (if ticketed: state, type, custom fields)
- AI agent participation data (content_sources, resolution_state, source_type)
- Conversation rating (if rated)

### 2. search_contacts

**Purpose:** Find contacts by filters. Requires at least one search parameter.

| Filter | Type | Tested | Notes |
|--------|------|--------|-------|
| name | string (partial match) | YES | Works. "Ricky" returned 3 results (Ricky Panesar x2, Rickyshallprosper). |
| email | string (exact match) | — | Available |
| email_domain | string | — | Available |
| phone | string | — | Available |
| contact_ids | string[] (UUIDs) | — | Available |
| custom_attributes | key-value pairs | — | Available (e.g., shopify_domain, shopify_state) |
| per_page | number (max 150, default 5) | YES | Pagination works |

**Returns per contact:**
- ID, role (user/lead), name, email, phone
- Avatar, owner_id
- Social profiles
- Bounce/spam/unsubscribe status
- Timestamps (created, updated, signed_up, last_seen, last_replied, last_contacted)
- Browser, OS, language info
- Location (country, region, city, country_code)
- Mobile app info (iOS/Android)
- Custom attributes (Shopify data: domain, id, orders_count, total_spent, state, address, etc.)
- Tags, notes, companies (counts + URLs for detail fetch)
- UTM data, referrer
- SMS consent status

### 3. search (Unified DSL)

**Purpose:** Query both conversations and contacts using a DSL query language.

**Query format:** `object_type:conversations|contacts` followed by space-separated `key[:op]:value` tokens.

| Feature | Tested | Notes |
|---------|--------|-------|
| object_type:conversations | YES | Works |
| object_type:contacts | YES | Works |
| state filter | YES | `state:open` works |
| source_type filter | YES | `source_type:conversation` works |
| source_body:contains | YES | `source_body:contains:"screen"` works — searches message body text |
| email_domain filter | YES | `email_domain:"icorrect.co.uk"` found 5 team members |
| limit | YES | Controls per_page |
| Pagination (starting_after) | YES | Cursor-based pagination |

**Operators:** eq (default), neq, gt, gte, lt, lte, in, nin, contains

**Conversation DSL fields:** id, state, priority, source_type, source_author_name, source_author_email, source_subject, source_body, contact_ids, team_assignee_id, admin_assignee_id, statistics_time_to_assignment, statistics_time_to_admin_reply, statistics_time_to_first_close, created_at, updated_at

**Contact DSL fields:** id, name, email, email_domain, phone, role, custom_attributes.*, created_at, updated_at

**Returns:** Simplified format — id (prefixed), title, text summary, Intercom URL. Less detail than dedicated search tools.

### 4. get_conversation

**Purpose:** Get full details of a single conversation by ID.

**Accepts:** Raw ID, prefixed `conversation_ID`, or Intercom URL.

**Returns:** Same as search_conversations but for a single record. Full conversation metadata.

**Note:** Does NOT return conversation parts (message history). Use `fetch` for that.

### 5. get_contact

**Purpose:** Get full details of a single contact by UUID.

**Accepts:** Raw UUID, prefixed `contact_UUID`, or Intercom URL.

**Returns:** Same as search_contacts but for a single record. Full contact profile.

### 6. fetch

**Purpose:** Get full conversation content including ALL message parts (the full thread).

**Accepts:** Prefixed IDs (`conversation_ID` or `contact_ID`) or Intercom URLs.

**Returns:**
- Formatted text summary of entire conversation
- Initial message with author, body, tags
- ALL conversation parts in order (comments, assignments, attribute changes, ticket updates, bot messages)
- Each part shows: type, author (name, email, role), timestamp, body (HTML), tags
- Metadata: state, priority, source_type, contact IDs, tags count, AI participation

**This is the key tool for reading actual conversation content.** The search tools return metadata; fetch returns the full thread.

---

## Key Data Points Available

### Conversation Custom Attributes (set by Fin AI / n8n)
| Attribute | Example Values | Set By |
|-----------|---------------|--------|
| AI Title | "MacBook screen repair" | Fin AI |
| Enquiry Type | "Quote or Pricing", "Repair Status" | Fin AI |
| Sentiment | "Neutral", "Positive", "Negative" | Fin AI |
| Urgency | "Low", "Medium", "High" | Fin AI |
| Issue Type | "Help", "Request" | Fin AI |
| Spam | "Yes", "No" | Fin AI |
| Language | "English" | Intercom |
| Ticket category | "Customer ticket" | Intercom |
| Created by | admin ID | System |
| Fin AI Agent resolution state | "Assumed Resolution", "Routed to team" | Fin |
| CX Score rating | 1-5 | Intercom |
| CX Score explanation | Text | Intercom |

### Contact Custom Attributes (Shopify integration)
| Attribute | Example | Source |
|-----------|---------|--------|
| shopify_domain | "i-correct-final.myshopify.com" | Shopify |
| shopify_id | 8995712565501 | Shopify |
| shopify_orders_count | 1 | Shopify |
| shopify_total_spent | 0 | Shopify |
| shopify_state | "enabled" | Shopify |
| shopify_verified_email | true/false | Shopify |
| address1, city, zip, country | Physical address | Shopify |

### Admin Accounts
| ID | Name | Type |
|----|------|------|
| 9702337 | Support (admin@icorrect.co.uk) | Shared admin account |
| 9702338 | Alex (operator+pt6lwaq6@intercom.io) | Bot/operator account (n8n + Fin) |

### Tags in Use
| Tag | ID | Applied By |
|-----|-----|-----------|
| email-enquiry | 13012341 | Bot (9702338) |
| messenger | 13012578 | Bot (9702338) |

### Team IDs
| ID | Likely Team |
|----|------------|
| 9725695 | Default team (email enquiries assigned here) |

---

## What Agents CAN Do with These Tools

1. **Read open conversations** — search by state, filter by source type
2. **Find unanswered enquiries** — filter where time_to_admin_reply is null or > threshold
3. **Search by customer** — find conversations by email, name, or contact ID
4. **Read full conversation threads** — use fetch to see entire message history
5. **Look up customer profiles** — Shopify data, location, activity timestamps
6. **Search conversation content** — source_body:contains and source_subject:contains
7. **Monitor response metrics** — statistics fields show reply times, close times, assignment times
8. **Identify AI-handled conversations** — ai_agent_participated flag, resolution_state
9. **Track sentiment and urgency** — Fin AI sets these automatically
10. **Paginate through large result sets** — cursor-based pagination, up to 150 per page

## What Agents CANNOT Do

1. **Reply to conversations** — no send/reply tool
2. **Create conversations** — no create tool
3. **Update conversation state** — cannot close, snooze, reopen
4. **Assign conversations** — cannot reassign to team/admin
5. **Add tags** — no tagging tool
6. **Add notes** — no internal note tool
7. **Create/update contacts** — read-only
8. **Send messages** — no outbound messaging
9. **Configure Fin AI** — no admin tools
10. **Access articles/help center** — no content tools

---

## Scale (iCorrect Workspace)

| Metric | Value |
|--------|-------|
| Open conversations | ~4,134 (1,378 pages x 3) |
| Total contacts matching "Ricky" | 46 |
| Team contacts (@icorrect.co.uk) | 37+ (8 pages) |
| Conversation source types | email, conversation (messenger), instagram, facebook, whatsapp |
| Fin AI participation | Active on messenger conversations, handles first response |

---

## Recommendations for CS Agent (v3)

1. **Primary use case:** Monitor open conversations, identify unanswered enquiries, track response metrics
2. **Daily check:** Search open conversations with time_to_admin_reply > 24h (86400 seconds)
3. **Weekly audit:** Pull all conversations for the week, calculate reply rates and response times (as done in the Feb 2026 audit)
4. **Customer lookup:** When discussing a specific customer, search by email to get full context
5. **Fin monitoring:** Track ai_agent_participated and resolution_state to see what Fin handles vs escalates
6. **Content search:** Use source_body:contains for keyword-based conversation discovery

**Critical gap:** Agents can READ but not ACT. Any action (reply, close, tag) needs to go through:
- Intercom UI (manual)
- Intercom REST API (via scripts/n8n)
- n8n workflows (automation)

This means the CS agent is an **intelligence/monitoring** tool, not an action tool. It can flag issues and recommend actions, but a human or automation must execute them.

---

## Existing Audit Reference

A comprehensive communications audit was performed on 2026-02-26 covering Feb 18-25:
- Location: `~/.openclaw/agents/customer-service/workspace/docs/intercom-audit-feb2026.md`
- Key findings: 60% contact form no-reply rate, 45.3h avg response time, 18 lost leads, ~£28K/yr revenue leakage
- This audit was built using the same MCP tools documented here

---

*Generated by Claude Code — Phase 0, Session 2, Task R-D4*

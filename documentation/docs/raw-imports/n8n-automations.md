# n8n Automations & Integration Layer

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Mix of live workflows and spec-only builds
> **Last updated:** 23 Feb 2026

---

## n8n Instance

| Field | Value |
|-------|-------|
| URL | https://icorrect.app.n8n.cloud |
| Webhook base | https://icorrect.app.n8n.cloud/webhook/ |

---

## Live Workflows

### Flow 0: Sent Trade-In Orders → Monday Boards
| Field | Value |
|-------|-------|
| Status | ✅ Active |
| Trigger | Schedule |
| Purpose | Fetches SENT orders from Back Market, extracts PDF data, parses assessments, creates items on Main Board + BM Board, sends Slack notification |

### Flow 5: BM Device Listing (Sales)
| Field | Value |
|-------|-------|
| Workflow ID | 69BCMOtdUyFWDDEV |
| Status | ✅ Active |
| Trigger | Schedule |
| Purpose | Queries Monday for devices ready to list, checks Google Sheets for SKU match, calculates pricing, creates/updates BM listing, updates Monday + Slack |

### Flow 6: Sales Alert v2
| Field | Value |
|-------|-------|
| Workflow ID | HsDqOaIDwT5DEjCn |
| Status | ✅ Active |
| Trigger | Schedule |
| Purpose | Monitors Back Market for new orders (state 1), matches to Monday items, updates boards, auto-accepts orders, Slack notification |

### Flow 7: Ship Confirmation
| Field | Value |
|-------|-------|
| Status | ✅ Active |
| Trigger | Schedule |
| Purpose | Confirms shipment to Back Market API, moves items on BM Board, Slack notification |

### Parts Deduction Workflow
| Field | Value |
|-------|-------|
| Status | ✅ Active |
| Trigger | Webhook from Cloudflare Workers |
| Webhook URL | https://icorrect.app.n8n.cloud/webhook/parts-deduction |
| Purpose | Deducts parts from Parts Board when repair status changes to "Ready To Collect" or "Do Now!" |
| Logic | Check if already complete → Check parts linked → Set "Processing" → Get parts data → Skip "No Parts Used"/"See Notes"/"Logic Board" → Deduct 1 from each part quantity → Set "Complete" or "Error" if negative stock |

---

## Cloudflare Workers

### icorrect-status
| Field | Value |
|-------|-------|
| URL | https://icorrect-status.ricky-4b9.workers.dev |
| Board | 349212843 (Main Board) |
| Column | status4 (Status) |
| Current triggers | "Ready To Collect" → parts deduction webhook |
| Planned extension | Route all 9 notification status changes to individual n8n endpoints based on status + service type + client type |

### icorrect-parts-deducted
| Field | Value |
|-------|-------|
| URL | https://icorrect-parts-deducted.ricky-4b9.workers.dev |
| Board | 349212843 (Main Board) |
| Column | color_mkzkats9 (Parts Deducted) |
| Triggers | "Do Now!" → parts deduction webhook |

---

## Planned Workflows (Spec Docs Created)

### Shopify → Monday → Intercom (Order Automation)
| Field | Value |
|-------|-------|
| Status | 📋 Full spec document exists |
| Spec file | `icorrect-shopify-order-automation-spec.md` |
| Trigger | Shopify "Order Created" webhook |
| Flow | Parse order → Create Monday item in group `new_group77101__1` → Create Intercom contact (if new) → Create Intercom conversation → Store URL in `link1` with display text "Fin" |
| Shopify shop | i-correct-final |
| Shopify credential | "Shopify account" in n8n |
| Webhook URL | https://icorrect.app.n8n.cloud/webhook/SHOPIFY_ORDER |

### 9 Notification Webhooks (Status Change → Intercom Messages)
| Field | Value |
|-------|-------|
| Status | 📋 Full spec document exists |
| Spec file | `icorrect-notification-automation-spec.md` |
| Intercom admin | 9702337 (Support) — 9702338 is BANNED for sending |
| Routing logic | Cloudflare Worker inspects status4 value + service column + client type → routes to correct n8n endpoint |

**Notification routing matrix:**

| Status | Service = Walk-In | Service = Mail-In | Service = Gophr | Client = Warranty |
|--------|------------------|-------------------|-----------------|-------------------|
| Received | RECEIVED_WALKIN | RECEIVED_REMOTE | RECEIVED_REMOTE | — |
| Booking Confirmed | — | — | — | BOOKING_CONFIRMED_WARRANTY / STANDARD |
| Courier Booked | — | COURIER_MAILIN_STANDARD | COURIER_GOPHR | COURIER_MAILIN_WARRANTY |
| Ready To Collect | READY_WALKIN_STANDARD | — | — | READY_WALKIN_WARRANTY |

### New Monday Item → Intercom Contact + Conversation
| Field | Value |
|-------|-------|
| Status | 📋 Spec exists within notification doc |
| Trigger | New item created on board 349212843 (or polling for items where `link1` is empty) |
| Flow | Extract customer data → Check if Intercom contact exists → Create if not → Create conversation → Store URL in `link1` |

---

## Credentials in n8n

| Credential Name | System | Status |
|----------------|--------|--------|
| Monday.com account - Ricky | Monday.com | ✅ Primary — use this one |
| Monday.com account 3 | Monday.com | ⚠️ Legacy — avoid |
| Intercom Auth | Intercom | ✅ Active |
| Shopify account | Shopify | ✅ Active (shop: i-correct-final) |
| Slack accounts (2, 3, 4, 5, OAuth2) | Slack | ⚠️ Multiple duplicates — needs cleanup |
| Multiple Header Auth | Various | ⚠️ Duplicates from Ferrari — needs cleanup |

---

## Architecture Pattern

```
Customer Action
    │
    ▼
Shopify / Back Market / Monday.com
    │
    ▼
Monday.com Native Automation (status change → webhook)
    │
    ▼
Cloudflare Worker (routing logic — inspects status, service type, client type)
    │
    ▼
n8n Webhook (specific endpoint per action type)
    │
    ▼
n8n Workflow (API calls to Monday, Intercom, Back Market, Slack)
```

**Why this architecture:**
- Monday native automations can only send webhooks, not do complex routing
- Cloudflare Workers handle the routing logic (cheap, fast, serverless)
- n8n handles the actual business logic and API integrations
- This avoids Monday receiving 900+ irrelevant webhook events

---

## Verification Checklist for Jarvis

- [ ] List ALL workflows in n8n (active + inactive)
- [ ] Verify workflow IDs for all 4 BM flows
- [ ] Check Cloudflare Worker deployments match expected URLs
- [ ] Verify Monday.com native automations are configured correctly
- [ ] Test each webhook endpoint health
- [ ] Inventory all credentials and flag duplicates for cleanup
- [ ] Check if any additional workflows have been created since Jan 2026
- [ ] Verify Google Sheets used by Flow 5 is current

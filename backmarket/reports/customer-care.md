# Back Market — customer care / returns / refunds via API

Discovered 2026-04-27. Customer-care (the `bo-seller/customer-care/*` UI) is backed by **`/seller-after-sales/api/v{1,2}/...`** — a separate service from `/api/seller-experience/...`. Cookie-authed, no extra token needed. Read works cleanly. Write actions discovered (`POST_MESSAGE`, `REFUND`, `PROBLEM`, `CREATE_MANUAL_RETURN`) but their POST shapes still need one capture-via-Network sniff per action.

This unlocks:
- Automated CS triage / Telegram alerts on new customer requests
- Auto-reply for standard message templates
- Bulk-pull historic requests for analysis without touching the UI
- Cross-reference with Monday CRM by `orderlineId`

## URL shape

Surfaces hit when opening a single customer-care task (Davey Teague, orderline UUID `26a7eca5-…`):

| Path | Returns |
|---|---|
| `GET /seller-after-sales/api/v1/requests` | List of all requests on the seller account (paged, ~20 default) |
| `GET /seller-after-sales/api/v1/requests?openTasks=true` | Only requests with at least one open task |
| `GET /seller-after-sales/api/v1/requests?status=TODO\|LATE\|UPCOMING\|NO_ACTION_NEEDED\|COMPLETED` | Filter by status |
| `GET /seller-after-sales/api/v1/orderlines/{orderline_uuid}/requests` | Requests scoped to one orderline |
| `GET /seller-after-sales/api/v1/orderlines/{orderline_uuid}/conversation` | Full message thread (HTML-bodied messages, system + customer + seller) |
| `GET /seller-after-sales/api/v1/orderlines/{orderline_uuid}/attachments` | Customer / seller-uploaded files |
| `GET /seller-after-sales/api/v1/orderlines/{orderline_uuid}/product_returns` | Return shipment (DHL tracking, dispatch address, dates) |
| `GET /seller-after-sales/composition_api/v1/orderlines/{orderline_uuid}/customer_issues` | Issue codes (e.g. SCREEN_BLACK, DOES_NOT_TURN_ON) |
| `GET /seller-after-sales/api/v2/orderlines/{orderline_uuid}/actions` | **What actions are available for this orderline** (read-only; the menu) |
| `GET /bm/customer_request/orderlines/{orderline_uuid}` | Billing address + warranty + insurance policies (EVY etc.) |
| `GET /bm/customer_request/orderlines/{orderline_uuid}/product` | Product info — title, grade, SKU, image, comment |
| `GET /bm/customer_request/orderlines/{orderline_uuid}/customer` | Customer detail |
| `GET /bm/customer_request/merchant/information` | Your seller info (called once per session) |

The `/seller-after-sales/api/v1/openapi.json` returns 403 (admin-only), so no schema dump like seller-experience. Schemas below are reverse-engineered from real responses.

## Auth

Same pattern as `/api/seller-experience/...`: cookie + `credentials: 'include'`. No additional header needed for GETs. CSRF token may be needed for POSTs (BM uses `<meta name="csrf-token">` for some surfaces — check before POSTing).

## Schema — `GET /seller-after-sales/api/v1/requests`

```json
{
  "requests": [
    {
      "id": "<request_uuid>",
      "order": {
        "id": "<numeric_order_id>",
        "countryCode": "GB",
        "orderlineId": "<numeric_orderline_id>",
        "orderlinePublicId": "<orderline_uuid>"
      },
      "customer": {"firstName": "...", "lastName": "..."},
      "issues": [
        {"type": "SCREEN_BLACK", "translationKey": "diagnosis_customer_issue_screen_black"},
        {"type": "DOES_NOT_TURN_ON", "translationKey": "diagnosis_customer_issue_does_not_turn_on"}
      ],
      "status": "TODO" | "LATE" | "UPCOMING" | "NO_ACTION_NEEDED" | "COMPLETED",
      "deadline": "<ISO timestamp or null>",
      "lastTakenAction": "REPAIRED_REPLACED_RETURNED" | ...,
      "resolutionId": "<uuid>",
      "ticketId": "<numeric>",
      "openTasks": [{"id": "<uuid>", "type": "REPAIR_REPLACE", "status": "OPEN", "deadline": "<ISO>"}]
    }
  ],
  "metadata": {...}  // pagination
}
```

## Schema — `GET /seller-after-sales/api/v2/orderlines/{uuid}/actions`

The **available action menu** for this specific orderline. Use to discover write capability before POSTing:

```json
{
  "pendingProblems": [],
  "actions": [
    {
      "action": "POST_MESSAGE",
      "isDisabled": false,
      "attributes": {"replyToAgent": false, "reportProblem": false}
    },
    {
      "action": "PROBLEM",
      "isDisabled": false,
      "attributes": {
        "types": ["ACCOUNT_LOCKED", "CODE_LOCKED", "DAMAGED_PACKAGE",
                  "ITEM_NOT_RECEIVED", "MISSING_PART", "OOW_ITEM",
                  "PROBLEM_NOT_IDENTIFIED", "WRONG_ITEM", "OTHER"]
      }
    },
    {
      "action": "REFUND",
      "isDisabled": false,
      "attributes": {
        "isAllowedPartial": true,
        "refundPrice": {"amount": "692.00", "currency": "GBP"},
        "partialRefundReasons": ["ACCESSORY_PROBLEM", "RETURN_LABEL_FEES",
                                 "THIRD_PARTY_REPAIR", "APPEARANCE_ISSUE",
                                 "PERFORMANCE_ISSUE", "OTHER"],
        "isCustomerBlocked": false,
        "hasActiveInsurancePolicies": false,
        "orderlineQuantity": 1
      }
    },
    {
      "action": "CREATE_MANUAL_RETURN_OF_PRODUCT_RETURN",
      "isDisabled": false,
      "attributes": null
    }
  ]
}
```

Each `action` corresponds to a distinct POST endpoint (path not yet captured). To discover the POST shapes, sniff Network during a real UI click on each of: Send message, Mark problem, Refund, Manual return.

## Schema — `GET .../conversation`

```json
[
  {
    "requestId": "<uuid>",
    "creationDate": "<ISO>",
    "customerIssues": [{"id": "SCREEN_BLACK", "label": "Screen doesn't display anything"}],
    "messages": [
      {
        "messageId": "<numeric>",
        "content": "<HTML string>",
        "creationDate": "<ISO>",
        "sender": {"senderId": "<numeric>", "displayName": "...", "type": "SYSTEM" | "CUSTOMER" | "SELLER"},
        "kind": "AUTO" | "MANUAL",
        "attachments": [],
        "isInformative": false
      }
    ]
  }
]
```

`messages[].content` is HTML (with anchor tags, paragraphs). Will need stripping or a renderer for downstream use.

## Status enum

`TODO`, `LATE`, `UPCOMING`, `NO_ACTION_NEEDED`, `COMPLETED`.

The seller-portal "Open tasks" tab shows **TODO + LATE + UPCOMING** (anything actionable). The "All requests" tab shows everything.

## Issue type enum (observed; may not be exhaustive)

`SCREEN_BLACK`, `DOES_NOT_TURN_ON` — partial list. The full enum lives in BM's translation dictionary; capture more by hitting a sample of real customer requests.

## What we DON'T have yet

- The exact POST body shape for: `POST_MESSAGE`, `REFUND`, `PROBLEM`, `CREATE_MANUAL_RETURN_OF_PRODUCT_RETURN`. Discover by capturing Network during one real UI action of each type.
- The path prefix for those POSTs (probably `POST /seller-after-sales/api/v1/orderlines/{uuid}/{messages|refunds|problems|returns}` but unverified).
- Pagination cursor shape on `/requests` (the `metadata` field exists but wasn't expanded in this probe).
- File upload endpoint for attachments.
- The `/seller-after-sales/api/v1/orderlines` direct list returned 403, suggesting some staff-only endpoints exist on the same prefix.

## Known cross-reference fields

For each customer request, you can join to:

- **BM order** (numeric `order.id` and orderline `order.orderlineId` / `order.orderlinePublicId`) → `GET /api/seller-experience/orders/{order_id}` returns the seller-experience view of the order
- **iCorrect Monday cards**: the BM order ID maps to `bo-seller/orders/{id}` URLs; cross-reference via Codex's existing reconcile pipeline (`text_mky01vb4` column on Main Board = "BM Order ID")
- **Product** (`/bm/customer_request/orderlines/{uuid}/product` returns SKU + listing info; the SKU should match an existing Listing in `/api/seller-experience/listings-new?sku=...`)

## High-leverage iCorrect use cases

| Use case | Endpoints needed | Why this matters |
|---|---|---|
| **🟢 New-request Telegram alert** | Cron poll `GET /requests?openTasks=true` every 15 min, diff against last poll, post new requests to Operations group with customer name + issue + ticket URL | Ricky/team see customer issues the moment they hit BM, not on next portal check |
| **🟢 Daily CS dashboard** | List requests grouped by `status` + `issues[].type` + `deadline` distance | Replace manual portal review with a single Telegram morning post |
| **🟢 Auto-link to Monday repair card** | Match `order.id` to Monday Main Board `text_mky01vb4` column → enrich Telegram alert with repair status + assignee | Closes the BM ↔ workshop loop without anyone copying IDs by hand |
| **🟡 Auto-reply standard system messages** | `POST_MESSAGE` for templated replies (e.g. "We've received your return, please allow X days for processing") | Saves CS time on routine acknowledgements; needs POST shape capture first |
| **🟡 Bulk-export historic requests for analysis** | Page through `/requests` with all statuses, dump to JSON, run analytics | Identify common issue patterns to feed back into intake QC |
| **🔴 Auto-refund for small partials** | `REFUND` with strict rules (e.g. RETURN_LABEL_FEES under £20) | High-trust automation; explicit approval flow per refund makes more sense than blanket auto |

## Hard safety rules

- **Read endpoints are safe.** All listed GETs were verified read-only this session.
- **No POST/PATCH/DELETE attempted.** Until each write endpoint is verified separately with the same explicit-approval contract used for SKU canary + listing-create, **do not write anything**.
- **REFUND is real money.** Even a £1 partial refund is a real-money transfer. Per Codex's contract, every refund needs explicit per-orderline approval naming the orderline UUID, refund amount, currency, and partial-refund reason.
- **POST_MESSAGE writes a customer-visible message.** Cannot be deleted. Treat as immutable. Per-message approval naming exact content + recipient orderline.
- **PROBLEM creates a BM-internal escalation.** Has back-end consequences (delays automated refund timers, alerts BM staff). Per-problem approval before writing.
- **Conversation HTML strings include user-typed content** — don't echo customer PII back into Telegram alerts without filtering, and don't log conversation bodies to long-lived stores without retention rules.

## Suggested next steps

1. **One-click sniff session**: open the Davey Teague task in the UI, click each of [Send message, Mark problem, Refund, Manual return] once with `Network.enable` on. Capture the POST URL + body for each. ~10 minutes; adds 4 endpoints to this skill file.
2. **Wire the morning brief**: cron `GET /requests?openTasks=true` at 8am Bali; post to Operations group. Trivial — same pattern as the BM listings alerts in `/home/ricky/builds/backmarket/scripts/`.
3. **Cross-reference test**: pick 5 current requests, look up their `order.id` against Monday's BM column. Confirm 5/5 join cleanly. If they do, the Telegram alert can include "→ Monday card BM XXXX (status: <main_status>)" links.

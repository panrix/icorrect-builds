# Xero Invoice Payment Notifications — Build Brief

## Objective
When a Xero invoice is paid, automatically:
1. Post to Slack `#invoice-notifications` with client name, amount, payment date, Monday item link, and Xero invoice link
2. Update the corresponding Monday.com item: set Invoice Status to "Paid", update Paid amount, set payment date

## Architecture
Polling-based (every 15 min during business hours). No Xero webhooks available without public HTTPS endpoint.

```
Cron → check-invoices.sh → Xero API (PAID invoices since last check)
                                ↓
                        ┌───────┴───────┐
                        ↓               ↓
                  Slack webhook    Monday GraphQL
```

## Monday.com Mapping

**Board:** iCorrect Main Board (ID: `349212843`)

| Field | Monday Column ID | Type | What to update |
|-------|-----------------|------|----------------|
| Xero Invoice URL | `link_mm0a43e0` | link | Already populated by Michael. Use to MATCH invoices to Monday items. |
| Invoice Status | `color_mm0pkek6` | status | Set to "Paid" |
| Paid | `dup__of_quote_total` | number | Set to payment amount |
| Invoice Amount | `numeric_mm0pvem5` | number | (reference only, don't update) |
| Xero Invoice ID | `text_mm0a8fwb` | text | (reference only, don't update) |

**Matching logic:** Query Monday items where `link_mm0a43e0` contains the Xero invoice URL. The URL is the unique join key.

## Xero API

**Endpoint:** `GET /api.xro/2.0/Invoices`
**Filter:** `Statuses=PAID&where=FullyPaidOnDate>=DateTime({last_check})`
**Headers:**
- `Authorization: Bearer {access_token}`
- `xero-tenant-id: {tenant_id}`
- `Accept: application/json`

**Key fields from response:**
- `InvoiceID` — Xero invoice UUID
- `InvoiceNumber` — e.g. "INV-1234"
- `Contact.Name` — client name
- `Total` — invoice total
- `AmountPaid` — amount paid (should equal Total for full payments)
- `FullyPaidOnDate` — payment date
- `Url` — direct link to invoice in Xero

## Slack Notification Format

Post to `#invoice-notifications` via Jarvis bot (already invited to channel)
Uses `SLACK_BOT_TOKEN` from `/home/ricky/config/api-keys/.env`

```
💰 Invoice Paid

Client: {Contact.Name}
Amount: £{AmountPaid}
Date: {FullyPaidOnDate}
Invoice: {Url}
Monday: {monday_item_link}
```

**Payment mismatch alert:**
```
⚠️ Payment Mismatch

Client: {Contact.Name}
Invoice: {InvoiceNumber}
Quote: £{Quote}
Previously paid: £{ExistingPaid}
Invoice payment: £{InvoiceAmount}
New total: £{NewPaid}
Difference: £{Difference}

Monday: {monday_item_link}
Xero: {Url}
```

## State Tracking

File: `/home/ricky/data/xero-invoice-state.json`
```json
{
  "last_checked": "2026-04-22T14:00:00Z",
  "notified_invoices": ["INV-001", "INV-002"]
}
```

Purpose: Prevent duplicate notifications. Track which invoices we've already notified about.

## Files to Create

1. `/home/ricky/builds/xero-invoice-notifications/check-invoices.sh` — Main orchestrator
2. `/home/ricky/builds/xero-invoice-notifications/lib/xero-api.sh` — Xero API helpers (auth, fetch)
3. `/home/ricky/builds/xero-invoice-notifications/lib/monday-api.sh` — Monday GraphQL helpers
4. `/home/ricky/builds/xero-invoice-notifications/lib/slack.sh` — Slack webhook helper
5. `/home/ricky/builds/xero-invoice-notifications/lib/state.sh` — State file read/write
6. systemd service: `xero-invoice-notifications.service`
7. systemd timer: `xero-invoice-notifications.timer`

## Error Handling

- Xero token refresh failure: log error, alert admin via Telegram, skip run
- Monday API failure: log error, still post to Slack
- Slack webhook failure: log error, still update Monday
- No matching Monday item found: log warning, still post to Slack (so team knows)

## Dependencies

- Working Xero OAuth (blocked — token dead, needs re-auth)
- Monday API token (`MONDAY_APP_TOKEN` in `/home/ricky/config/api-keys/.env`)
- ✅ Slack bot access (`SLACK_BOT_TOKEN` ready, Jarvis bot invited to `#invoice-notifications`)

## Open Questions (Resolved)

1. ✅ Monday board: iCorrect Main Board (349212843)
2. ✅ Matching: Xero Invoice URL column (`link_mm0a43e0`)
3. ✅ Full payments only
4. ✅ Start from go-live, no backfill
5. ✅ Slack channel: `#invoice-notifications` (bot invited)
6. ✅ Paid column logic: cumulative, flag mismatches

## Next Steps

1. Ricky re-auth Xero to get fresh token
2. Deploy scripts and systemd timer
3. Test with a recent paid invoice

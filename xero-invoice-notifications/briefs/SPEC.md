# Xero Invoice Payment Notifications — Build Spec

## Objective
Notify the team when a client invoice is paid in Xero. Post to Slack + update Monday.com item simultaneously.

## Inputs
- Xero API (invoices endpoint with `Statuses=PAID` filter)
- Polling interval: every 15 minutes during business hours (Mon-Fri 07:00-18:00 UTC)
- State tracking: last-checked timestamp to avoid duplicate notifications

## Outputs

### Slack (channel: `#invoice-notifications` — Michael to create)
- Client name
- Amount paid
- Payment date
- Monday item link
- Xero invoice link

### Monday.com
- Payment date (update existing date column)
- Amount (update existing number column)
- Invoice link (update existing link column)
- Status: move to "Paid" group or update status column

## Architecture

```
Cron (every 15 min) → xero-invoice-check.sh → xero API → filter PAID since last check
                                                    ↓
                                            ┌───────┴───────┐
                                            ↓               ↓
                                      Slack webhook    Monday GraphQL
```

## State File
`/home/ricky/data/xero-invoice-state.json`
```json
{
  "last_checked": "2026-04-22T14:00:00Z",
  "notified_invoices": ["INV-001", "INV-002"]
}
```

## Xero API Call
```
GET /api.xro/2.0/Invoices?Statuses=PAID&where=Date>=2026-04-22
Headers:
  Authorization: Bearer {access_token}
  xero-tenant-id: {tenant_id}
  Accept: application/json
```

## Monday Mapping
Need to confirm:
- Which Monday board? (likely Finance or Invoices board)
- Which columns map to payment date / amount / invoice link?
- How to match Xero invoice to Monday item? (invoice number? client name?)

## Error Handling
- Xero token refresh failure: alert to admin, skip run
- Monday API failure: log error, still post to Slack
- Slack webhook failure: log error, still update Monday

## Files to Create
- `/home/ricky/builds/xero-invoice-notifications/check-invoices.sh`
- `/home/ricky/builds/xero-invoice-notifications/notify-slack.sh`
- `/home/ricky/builds/xero-invoice-notifications/update-monday.sh`
- systemd service + timer (or OpenClaw cron)

## Dependencies
- Working Xero OAuth (blocked on token recovery)
- Monday API token (already have `MONDAY_APP_TOKEN`)
- Slack webhook URL for `#invoice-notifications`

## Open Questions
1. Which Monday board and columns?
2. How to match Xero invoices to Monday items?
3. Do we need to handle partial payments?
4. Should we backfill existing paid invoices or start from go-live?

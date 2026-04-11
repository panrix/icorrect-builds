# Research Brief: Xero vs Monday Financial Reconciliation Gap

## Objective
Size the actual £ discrepancy between what Xero says the business has earned/is owed and what Monday shows as paid/completed. We know payment write-back is broken. We need to know if it's a £5K problem or a £50K problem.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/xero-monday-reconciliation-gap.md`

## Required analysis

### Xero side
1. Pull last 6 months of Xero invoices (paid, draft, submitted, authorised, voided)
2. Pull last 6 months of Xero payments received
3. Summarise: total invoiced, total paid, total outstanding, total overdue
4. Break down by contact/customer where possible
5. Identify ghost invoices (draft invoices with no corresponding real job)

### Monday side
1. Pull main repair board items that have any payment-related fields populated
2. Map payment_status, payment_method, and any invoice/amount fields
3. Identify items marked as completed but with no payment evidence
4. Identify items with payment evidence but not marked complete

### Reconciliation
1. Attempt to match Xero invoices to Monday items (by name, reference, amount, date)
2. Quantify: how many Xero invoices have no Monday match?
3. Quantify: how many Monday "paid" items have no Xero match?
4. Size the total £ gap in both directions
5. Break down: is the gap mostly ghost Xero drafts, or genuinely lost payment tracking?

## Credentials
Source `/home/ricky/config/api-keys/.env` for:
- XERO_CLIENT_ID
- XERO_CLIENT_SECRET  
- XERO_REFRESH_TOKEN
- MONDAY_APP_TOKEN

### Xero OAuth token exchange
```bash
# Get access token
curl -s -X POST https://identity.xero.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=$XERO_CLIENT_ID" \
  -d "client_secret=$XERO_CLIENT_SECRET" \
  -d "refresh_token=$XERO_REFRESH_TOKEN"

# Get tenant ID
curl -s https://api.xero.com/connections \
  -H "Authorization: Bearer <token>"

# Then use: https://api.xero.com/api.xro/2.0/Invoices etc.
# with header: Xero-Tenant-Id: <tenant-id>
```

### Xero API scopes available
accounting.invoices.read, accounting.payments.read, accounting.banktransactions.read, accounting.contacts.read, accounting.settings.read, accounting.reports.profitandloss.read, accounting.reports.balancesheet.read

### Monday GraphQL endpoint
https://api.monday.com/v2

## Context files to read first
- `/home/ricky/builds/system-audit-2026-03-31/findings.md` (payment and finance sections)
- `/home/ricky/builds/system-audit-2026-03-31/channel-economics.md` (payment rail discussion)
- `/home/ricky/builds/system-audit-2026-03-31/handoff-failure-matrix.md` (H20, H21 sections)
- `/home/ricky/kb/monday/` for board schema

## Rules
- Read only on both Xero and Monday. Do not create, modify, or delete anything.
- Rate limit Monday: max 1 request per second
- Rate limit Xero: respect 429s and Retry-After headers
- IMPORTANT: save the new Xero refresh token if the token exchange returns one (the old one is single-use). Write it to a temp file and note it in the output.
- Write findings progressively to the output file.

When completely finished, run this command to notify:
openclaw system event --text "Done: Xero vs Monday reconciliation gap analysis complete. Output in xero-monday-reconciliation-gap.md" --mode now

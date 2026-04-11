# n8n

## Access

- `Observed`: cloud n8n reachable via `N8N_CLOUD_API_TOKEN`
- `Observed`: self-hosted n8n reachable via `N8N_API_TOKEN`

Endpoints:
- Cloud: `https://icorrect.app.n8n.cloud/api/v1/workflows`
- Self-hosted: `https://n8n.icorrect.co.uk/api/v1/workflows`

## Cloud n8n Inventory

- Total workflows: `52`
- Active workflows: `13`

Active workflows observed:
- `Shopify Product Lookup`
- `Xero Invoice Creator`
- `Typeform To Monday Pre-Repair Form Responses (v2)`
- `Collection Form → Enriched Slack Notification`
- `Monday Stock Checker - Part Required`
- `Warranty Claim Form`
- `Status Notifications → Intercom Email`
- `Intercom - Consumer Contact Swap (Webhook)`
- `Shopify Order to Monday.com + Intercom - iCorrect`
- `Walk-In Typeform → Intercom + Monday`
- `Intercom → Monday (Create Repair)`
- `Drop-Off Appointment → Enriched Slack Notification`
- `Shopify Contact Form`

Observed node patterns across active workflows:
- heavy use of `httpRequest`, `code`, `if`, and `webhook`
- targeted use of `typeformTrigger`, `shopifyTrigger`, `slack`, `emailSend`, and `respondToWebhook`

Inference:
- cloud n8n is actively handling intake, customer comms, notifications, Shopify flows, Monday syncs, and at least one Xero-related flow
- many older BM flows exist in n8n but are inactive, suggesting BM critical ops were moved elsewhere or retired

Inactive but notable workflow names:
- `Flow 0: Sent Trade-in Orders Added to Monday Boards (OLD)`
- `Flow 0: Sent Trade-in Orders Added to Monday Boards - Fixed`
- `Flow 2: BM iCloud Checker`
- `Flow 2: iCloud Lock Suspension`
- `Flow 3: iCloud Recheck`
- `Flow 4: Payout Approval`
- `Flow 5: BM Device Listing (Sales)`
- `Flow 7 - Ship Confirmation`

## Self-Hosted n8n Inventory

- Total workflows: `1`
- Active workflows: `0`

Observed workflow:
- `Jarvis Telegram Bot v2` (inactive)

Inference:
- self-hosted n8n is reachable but does not currently appear to be the main live automation runtime

## Open Threads

- inspect workflow definitions in detail for field mappings, webhook paths, and exact platform-to-platform calls
- confirm whether any production webhooks still target self-hosted n8n
- cross-reference active workflow endpoints with Monday, Intercom, Shopify, Typeform, and Slack docs/code

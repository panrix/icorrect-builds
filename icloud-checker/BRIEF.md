# iCloud Checker — Cloudflare Worker

## What We're Building

A Cloudflare Worker that acts as a webhook receiver for Monday.com. When a serial number is entered/changed on the iCorrect Main Board, it automatically checks iCloud lock status via SickW API and updates Monday with the result.

## Architecture

```
Monday.com (serial number column changed)
  → Cloudflare Worker (webhook receiver)
    → SickW API Service 30 ($0.04/check)
    → Update Monday.com (iCloud status column + comment)
    → Post alert to Slack if iCloud ON
```

## Technical Details

### Trigger
- Monday.com webhook: fires when column `text4` (Serial Number) changes on board `349212843`
- Monday webhooks POST JSON with the item ID and column values
- We need to handle Monday's webhook verification challenge (they send a challenge string on first setup that must be echoed back)

### SickW API Call
- **Service 30** — APPLE BASIC INFO
- **Endpoint:** `https://sickw.com/api.php?imei={serial}&service=30&format=json&key={SICKW_API_KEY}`
- **Price:** $0.04/check
- **Response format:** JSON with HTML in `result` field
- **Key fields to parse from result HTML:**
  - `iCloud Lock: ON` or `iCloud Lock: OFF` (regex: `iCloud Lock:.*?(ON|OFF)`)
  - `Model: MacBook Air (M1, 2020) Space Gray [A2337] [MacBookAir10,1]`
- **Status field:** `success` or `rejected`

### Monday.com Updates
- **Board ID:** `349212843` (iCorrect Main Board)
- **Column to update:** `status24` — set to `IC ON` (if locked) or `IC OFF` (if unlocked)
- **Post a comment** on the item with the SickW result summary (model, iCloud status)
- Use Monday API v2 (GraphQL): `https://api.monday.com/v2`

### Slack Alert (if iCloud ON)
- Post to Slack channel via webhook or API when a device comes back iCloud locked
- Include: BM number (item name), serial, model from SickW
- Slack webhook URL will be an env var: `SLACK_WEBHOOK_URL`

## Environment Variables (Cloudflare Worker secrets)

```
SICKW_API_KEY=X5A-L05-OKT-ZV6-HFD-LZS-43L-79Z
MONDAY_API_TOKEN=<monday API token>
MONDAY_SIGNING_SECRET=<for webhook verification>
SLACK_WEBHOOK_URL=<slack incoming webhook URL>
```

## Code Structure

Use Wrangler (Cloudflare Workers CLI) with a standard setup:

```
icloud-checker/
├── wrangler.toml
├── src/
│   └── index.ts       # Main worker entry point
├── package.json
└── tsconfig.json
```

### Worker Logic (src/index.ts)

1. **Receive Monday webhook POST**
2. **Handle challenge verification** (Monday sends `{"challenge": "..."}` on setup — respond with `{"challenge": "..."}`)
3. **Extract item ID** from webhook payload
4. **Query Monday API** to get the serial number (`text4`) and item name for this item ID
5. **Call SickW API** with the serial number, service 30
6. **Parse response** — extract iCloud status and model
7. **Update Monday** — set `status24` column to `IC ON` or `IC OFF`
8. **Post Monday comment** with result summary
9. **If iCloud ON** — send Slack alert
10. **Return 200** to Monday

### Error Handling
- If SickW API fails or returns non-success, post an error comment on the Monday item
- If serial is empty or invalid, ignore (don't waste API credits)
- Rate limit: SickW can be slow (~2-5s), worker should handle this within Cloudflare's execution time limits

## Monday Webhook Payload Example

```json
{
  "event": {
    "type": "update_column_value",
    "pulseId": 12345678,
    "pulseName": "BM 1487 ( Conor Martin )",
    "columnId": "text4",
    "value": {
      "value": "HXJM1BAT1WFV"
    },
    "boardId": 349212843
  }
}
```

## Monday GraphQL Examples

### Query item details:
```graphql
{
  items(ids: [12345678]) {
    id
    name
    column_values(ids: ["text4", "status24"]) {
      id
      text
      value
    }
  }
}
```

### Update column:
```graphql
mutation {
  change_simple_column_value(
    board_id: 349212843,
    item_id: 12345678,
    column_id: "status24",
    value: "IC ON"
  ) {
    id
  }
}
```

Note: For status columns, use `change_multiple_column_values` with JSON:
```graphql
mutation {
  change_multiple_column_values(
    board_id: 349212843,
    item_id: 12345678,
    column_values: "{\"status24\": {\"label\": \"IC ON\"}}"
  ) {
    id
  }
}
```

### Post comment:
```graphql
mutation {
  create_update(
    item_id: 12345678,
    body: "✅ iCloud Check: OFF\nModel: MacBook Air (M1, 2020)\nSerial: HXJM1BAT1WFV"
  ) {
    id
  }
}
```

## Deployment Notes
- Deploy via `wrangler deploy`
- After deploy, register the webhook URL with Monday.com (can be done via Monday API or UI)
- The worker URL will be something like: `https://icloud-checker.<account>.workers.dev`

## DO NOT
- Do not check specs, RAM, storage, GPU — only iCloud status
- Do not update device links on Monday
- Do not call any other SickW service besides 30

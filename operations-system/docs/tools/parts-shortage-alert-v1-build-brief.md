# Build Brief — Parts Shortage Alert V1
Last updated: 2026-04-29
Status: ready for ClaudeCode/Codex implementation
Owner context: Operations / Parts visibility
Primary repo to modify: `/home/ricky/builds/icorrect-parts-service`
Planning source: `/home/ricky/builds/operations-system/docs/tools/parts-shortage-alert-v1.md`
Related live tool doc: `/home/ricky/builds/operations-system/docs/tools/repair-stock-check.md`

## Executive summary

Build a V1 shortage-alert layer on top of the live Monday repair stock checker.

When a **booked repair** or **quote accepted** job has one or more requested repairs linked to parts with available stock `0` or `1`, the service must post a clearly labelled shortage alert to:

1. the same Monday repair item as an update; and
2. the configured general Slack view.

V1 is alert-only. It must not order parts, reserve stock, deduct stock, message customers, or assign an owner.

## Current verified implementation

Existing live service:

- Repo: `/home/ricky/builds/icorrect-parts-service`
- Service: `icorrect-parts.service`
- Express app: `src/index.js`
- Current endpoints:
  - `POST /webhook` — Parts Used -> deduction
  - `POST /stock-check-webhook` — Requested Repairs -> stock check Monday update
- Existing stock-check handler: `src/stock-check-webhook.js`
- Existing stock-check logic: `src/stock-check.js`
- Existing tests: `test/stock-check-webhook.test.js`
- Existing route public URL: `https://mc.icorrect.co.uk/stock-check-webhook`

Current stock-check behaviour:

- Watches Main Board `349212843`.
- Watches `Requested Repairs` column `board_relation`.
- Reads linked Products & Pricing item IDs from Monday webhook payload.
- Looks up linked parts through Products & Pricing `Parts` relation column `connect_boards8`.
- Reads parts stock from:
  - `quantity`
  - `formula_mkv86xh7` (`Available Stock`)
  - `supply_price`
- Posts a plain `Stock Check` update back to the Monday item.
- Is read-only against parts stock.

Known relevant Main Board columns, verified 2026-04-29:

| Column | ID | Type | Notes |
|---|---:|---|---|
| Status | `status4` | status | Contains `Booking Confirmed`, `Quote Sent`, `Invoiced`, `Awaiting Part`, etc. |
| Booking Time | `date6` | date | Shows date/time by default; likely booked-repair trigger input. |
| Requested Repairs | `board_relation` | board_relation | Links to Products & Pricing board `2477699024`. Existing stock checker trigger. |
| Payment Status | `payment_status` | status | Contains `Confirmed`, `Corporate - Pay Later`, `Pay In Store - Pending`, etc. Candidate quote-accepted signal. |
| Service | `service` | status | Contains Walk-In, Mail-In, External Mail-In, etc. |

Status labels verified for `status4` include:

- `Booking Confirmed`
- `Expecting Device`
- `Received`
- `Quote Sent`
- `Invoiced`
- `Queued For Repair`
- `Awaiting Part`

Payment labels verified for `payment_status` include:

- `Confirmed`
- `Corporate - Pay Later`
- `Pay In Store - Pending`
- `Pending`
- `No Payment`

## V1 business rules

### Trigger priority

1. **Booked repair**
   - Fire when a job has a booked-repair signal and requested repair stock is `0` or `1`.
   - Candidate signals to confirm in code review / live board inspection:
     - `status4 = Booking Confirmed`; and/or
     - `status4 = Expecting Device`; and/or
     - `date6` present and within the relevant booking horizon.
   - Recommended V1 interpretation: if `status4` changes to `Booking Confirmed` or `Expecting Device`, run shortage alert check. Also consider running the check when `date6` changes on an item that already has Requested Repairs.

2. **Quote accepted**
   - Fire when a quote/repair acceptance signal appears and requested repair stock is `0` or `1`.
   - Candidate signals to confirm:
     - `payment_status = Confirmed`; and/or
     - `payment_status = Corporate - Pay Later`; and/or
     - `status4 = Invoiced` if this is the operational accepted-quote state.
   - Recommended V1 interpretation: implement the accepted-quote signal behind config/constants so labels can be adjusted after first live observation without touching core stock logic.

### Shortage threshold

- `Available Stock <= 1` triggers alert.
- Treat non-numeric/missing stock as **manual check required**, not as a normal shortage, unless the linked part exists and stock explicitly parses to `0` or `1`.
- Do not invent part-specific thresholds in V1.

### Alert body

Use this exact text shape for both Monday and Slack, filling values from the item/check:

```text
Parts Shortage Alert — Review Required
Job: [customer / item]
Trigger: Booked repair or Quote accepted
Required repair: [repair]
Linked part: [part]
Available stock: 0/1
```

If multiple linked repairs/parts are short, post one alert block containing one repeated section per shortage, or one alert per shortage. Prefer one grouped alert per item/trigger to reduce Slack/Monday noise.

### Alert destinations

1. Monday update on the repair item.
2. General Slack view.

Slack delivery should be environment-configured. Do not hardcode a Slack URL or token.

Recommended env vars:

```bash
PARTS_SHORTAGE_ALERTS_ENABLED=false
PARTS_SHORTAGE_SHADOW=true
PARTS_SHORTAGE_SLACK_WEBHOOK_URL=
PARTS_SHORTAGE_DEBOUNCE_MS=10000
```

V1 should be deployable in shadow mode first:

- `PARTS_SHORTAGE_ALERTS_ENABLED=false` should disable the feature.
- `PARTS_SHORTAGE_SHADOW=true` should log the would-be alert without posting to Monday or Slack.
- Production enablement requires explicit env change.

## Implementation guidance

### Files likely to add

In `/home/ricky/builds/icorrect-parts-service`:

- `src/shortage-alert.js`
  - Converts stock-check results into shortage alert candidates.
  - Formats alert body exactly as specified.
  - Posts Monday update using existing `postItemUpdate` or a shared helper.
  - Posts Slack notification through a small webhook helper.

- `src/shortage-alert-webhook.js`
  - Monday webhook handler for trigger columns.
  - Handles challenge handshake.
  - Filters board/column events.
  - Fetches item context and Requested Repairs product IDs when the trigger is not the Requested Repairs column.
  - Calls existing `checkStockForProductIds`.
  - Debounces by item ID to avoid duplicate alert storms.

- `test/shortage-alert.test.js`
  - Pure unit tests for shortage detection + formatting.

- `test/shortage-alert-webhook.test.js`
  - Webhook filter/debounce tests similar to `stock-check-webhook.test.js`.

### Files likely to edit

- `src/index.js`
  - Add route, e.g. `POST /parts-shortage-alert-webhook`.

- `src/stock-check.js`
  - Export any helper needed by shortage alert logic.
  - If parsing logic is touched, preserve existing behaviour and tests.

- `.env.example`
  - Add new env vars, blank/defaulted safely.

- `package.json`
  - Only if tests/scripts need adjustment. Existing `node --test test/*.test.js` is probably enough.

### Reuse existing stock-check logic

Do not duplicate Products & Pricing -> Parts relation lookup if avoidable.

Use existing:

- `checkStockForProductIds(productIds)`
- `postItemUpdate(itemId, body)`

The shortage alert should consume `checkStockForProductIds` output:

```js
[
  {
    productId,
    productName,
    parts: [
      { id, name, totalStock, availableStock, supplyPrice }
    ]
  }
]
```

Then identify shortages where `parseFloat(part.availableStock) <= 1`.

### Item context needed for alert body

The alert body needs `Job: [customer / item]`.

Minimum acceptable V1 value:

- `item.name` if available.

Better value:

- `${item.name} (${item.id})`

Do not block V1 on customer-name parsing if item name already identifies the job.

When trigger webhook does not include Requested Repairs values, fetch item context from Monday:

- item `id`
- item `name`
- `Requested Repairs` relation `board_relation` using typed `BoardRelationValue { linked_item_ids display_value }`
- trigger column text/value as needed

### Monday webhook subscriptions

Existing webhook subscription only watches Requested Repairs column.

V1 likely needs additional Monday webhook subscriptions for trigger columns:

- `status4` for booked/quote status transitions.
- `date6` for booking time changes if chosen.
- `payment_status` for quote accepted/payment confirmation if chosen.

Implementation should make route ready first; subscription creation can be a separate deploy step/script after dry-run.

Do not remove or change the existing stock-check webhook subscription.

### Duplicate/noise control

V1 must avoid spamming the same alert repeatedly.

Minimum acceptable:

- Debounce by item ID like `stock-check-webhook.js`.
- Ignore unchanged trigger values where Monday provides previous/current values.

Better:

- Include an in-memory dedupe key:
  - `itemId + triggerType + productId + partId + availableStock`
- Optional TTL, e.g. 6 hours, if simple.

Do not add persistent DB state unless needed for correctness. V1 can tolerate duplicates better than missed alerts, but should not fire repeated bursts on the same webhook event.

### Slack posting

Implement a tiny helper:

```js
async function postSlackAlert(text) { ... }
```

Rules:

- If no `PARTS_SHORTAGE_SLACK_WEBHOOK_URL`, log a warning and skip Slack; do not crash Monday posting.
- Slack failure must not prevent Monday alert posting.
- Log Slack HTTP status and response body on failure.
- Use the same plain text body as Monday for V1.

## Test requirements

Run from `/home/ricky/builds/icorrect-parts-service`:

```bash
npm test
```

Required new/updated test coverage:

1. Shortage detection:
   - stock `0` alerts
   - stock `1` alerts
   - stock `2` does not alert
   - non-numeric stock does not create a normal shortage alert
   - product with no linked parts is skipped or marked manual check depending on chosen implementation, but must not crash

2. Alert formatting:
   - exact header: `Parts Shortage Alert — Review Required`
   - includes Job, Trigger, Required repair, Linked part, Available stock
   - no owner/action fields in V1

3. Webhook filtering:
   - ignores wrong board
   - ignores unrelated columns
   - echoes Monday challenge
   - responds `200 OK` immediately

4. Debounce/dedupe:
   - rapid events for same item collapse to one check
   - separate items do not interfere

5. Shadow/disabled mode:
   - disabled mode does not post Monday or Slack
   - shadow mode logs or returns without posting

## Deployment / verification checklist

1. Implement and run unit tests.
2. Start service locally or in staging-like mode with:
   - `PARTS_SHORTAGE_ALERTS_ENABLED=true`
   - `PARTS_SHORTAGE_SHADOW=true`
3. Send Monday challenge payload to new route and verify echo.
4. Send synthetic webhook payload for each trigger and verify shadow log body.
5. Configure Slack webhook env only after shadow body is correct.
6. Enable non-shadow posting for a controlled test item.
7. Verify:
   - Monday update appears on the repair item.
   - Slack general view receives the same alert.
   - Existing `/stock-check-webhook` still works.
   - Existing parts deduction `/webhook` still works.
8. Create Monday webhook subscriptions for the selected trigger columns.
9. Restart `icorrect-parts.service` and watch logs.

Useful live commands from existing docs:

```bash
journalctl --user -u icorrect-parts -f | grep -E 'stock_check|shortage_alert'
systemctl --user restart icorrect-parts
curl -s https://mc.icorrect.co.uk/stock-check-webhook -X POST \
  -H 'Content-Type: application/json' -d '{"challenge":"ping"}'
```

After route exists, add equivalent challenge check for `/parts-shortage-alert-webhook`.

## Non-goals / guardrails

Do not implement in V1:

- automatic part ordering
- browser automation
- reservations/allocation
- parts deduction
- customer messaging
- owner assignment
- reorder thresholds beyond `0–1`
- changing the existing stock-check update format unless strictly necessary

Do not hardcode credentials or Slack URLs.

Do not couple shortage-alert write paths to parts deduction logic.

Do not create a second service unless there is a strong reason; this belongs inside `icorrect-parts-service` beside the existing stock-check route.

## Open questions for implementation discovery, not Ricky

Resolve by inspecting live Monday behaviour and existing service logs/code before asking Ricky:

1. Which exact trigger labels reliably represent **Booked repair**?
   - likely `status4 = Booking Confirmed` / `Expecting Device`, possibly `date6` present.

2. Which exact trigger labels reliably represent **Quote accepted**?
   - likely `payment_status = Confirmed` / `Corporate - Pay Later`, possibly `status4 = Invoiced`.

3. Where exactly is the “general Slack view” configured?
   - Use env var or existing deployment config; do not hardcode.

Only escalate to Ricky if live data shows competing trigger definitions with real operational consequences.

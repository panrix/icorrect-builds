# Repair Stock Check Tool
Last updated: 2026-04-27
Status:
- CLI helper — V0 read-only, working
- Monday webhook — **live** as of 2026-04-27 on `https://mc.icorrect.co.uk/stock-check-webhook` (handler lives inside `icorrect-parts-service`)

## Purpose

Two surfaces:

1. **CLI tool** (`tools/repair-stock-check.js`) — ad-hoc lookup by device + repair name. Used during intake/support while the full intake app is being mapped.
2. **Monday webhook** — fires automatically when the **Requested Repairs** column changes on the main board, and posts a stock-check Monday update on the same item. Runs as a second route inside the existing `icorrect-parts-service` (port 3001).

Shared stock-check logic in the CLI lives in `tools/lib/stock-check-core.js`. The webhook handler in `icorrect-parts-service/src/stock-check.js` is a near-duplicate sized for that service's deps; both follow the same `BoardRelationValue.linked_item_ids` lookup pattern.

The output is intentionally simple:

```text
Stock Check
• Repair: MacBook Air 13 'M1' A2337 Screen
• Linked Part: LCD - A2337
• Available Stock: 10
```

## Location

```bash
/home/ricky/builds/operations-system/tools/repair-stock-check.js
```

## Usage

From `/home/ricky/builds/operations-system`:

```bash
node tools/repair-stock-check.js "MacBook Air 13 M1 A2337" "Screen"
node tools/repair-stock-check.js "iPhone 15 Pro" "Screen"
node tools/repair-stock-check.js "iPhone 12 Mini" "Battery"
```

## Data Sources

The script uses Monday.com:

- Products & Pricing board: `2477699024`
- Parts/Stock Levels board: `985177480`
- Products & Pricing `Parts` relation column: `connect_boards8`

## Correct Monday Relation Lookup

Monday board-relation columns should not be read only from `text` or `value`.

For the Products & Pricing `Parts` relation, the script uses the typed GraphQL fragment:

```graphql
column_values(ids:["connect_boards8"]) {
  id
  type
  text
  value
  ... on BoardRelationValue {
    linked_item_ids
    display_value
  }
}
```

This is important because Monday may return `text: null` and `value: null` while the real linked parts are available in `linked_item_ids`.

## Behaviour

1. Search Products & Pricing for the selected repair.
2. Match the best repair product by device/model and repair type.
3. Read linked part IDs from the product's `Parts` relation column.
4. Fetch stock from Parts/Stock Levels.
5. Print a simple stock-check block.

If no linked part is found, the script falls back to a best-effort Parts/Stock name search. Fallback matches should be treated as guidance only, not authoritative confirmation.

## Validated Examples

```bash
node tools/repair-stock-check.js "MacBook Air 13 M1 A2337" "Screen"
```

Expected output format:

```text
Stock Check
• Repair: MacBook Air 13 'M1' A2337 Screen
• Linked Part: LCD - A2337
• Available Stock: 10
```

```bash
node tools/repair-stock-check.js "iPhone 15 Pro" "Screen"
```

Expected output format:

```text
Stock Check
• Repair: iPhone 15 Pro Screen
• Linked Part: Full Screen - iPhone 15 Pro
• Available Stock: 0
```

## Environment

The script reads `MONDAY_APP_TOKEN` from the environment.

For current local ops use, it also falls back to:

```bash
/home/ricky/builds/icorrect-parts-service/.env
```

## Safety

This script is read-only.

It does not:

- reserve parts
- deduct stock
- write to Monday
- update repair items
- message customers or staff

## Current Limitations

- Product matching is good enough for V0, but not a final intake UX.
- If a Products & Pricing item has no linked part, fallback search is only advisory.
- Multi-part repairs may need a richer output later.
- The full intake app should eventually call this logic through a backend endpoint rather than shelling out to this script.

## Monday Webhook (live)

| Item | Value |
|---|---|
| Public URL | `https://mc.icorrect.co.uk/stock-check-webhook` |
| Service | `icorrect-parts-service` (systemd user unit `icorrect-parts.service`, port 3001) |
| Handler | `src/stock-check-webhook.js` + `src/stock-check.js` |
| Watches | Main Board `349212843`, column `board_relation` (Requested Repairs) |
| Monday subscription | webhook id `571252124`, event `change_specific_column_value` |
| Nginx route | `/etc/nginx/sites-enabled/mission-control` → `127.0.0.1:3001/stock-check-webhook` |

On a column change the handler:

- Reads linked Products & Pricing item IDs from `event.value.linkedPulseIds`
- Looks up each product's linked Parts (`connect_boards8`) and their stock
- Posts a `create_update` Monday update on the main-board item

It does **not** reserve or deduct stock. Deduction is handled by the same service's other route (`/parts-webhook` → `connect_boards__1` Parts Used column). The two webhook handlers share the express server but are completely separate code paths and never write to the same Monday columns.

### Why it lives in icorrect-parts-service (not its own service)

Both webhooks are Monday subscriptions on the same main board, both deal with parts. Running them in the same Node process avoids a second nginx route, a second systemd unit, and a second deploy surface. The two handlers (`webhook.js` for deduction, `stock-check-webhook.js` for stock check) are kept as separate files with separate routes (`/webhook` vs `/stock-check-webhook`) so the read-only stock-check trigger is never coupled to the write-path deduction logic.

### Skips

The handler short-circuits and returns `200 OK` without posting anything when:

- Event is not `update_column_value`, not on Main Board, or not on column `board_relation`
- `linkedPulseIds` is empty (column was cleared)
- `previousValue` and `value` resolve to the same set of IDs (echo / no real change)

### Operating the live service

```bash
# logs
journalctl --user -u icorrect-parts -f | grep stock_check

# restart after edits
systemctl --user restart icorrect-parts

# health
curl -s https://mc.icorrect.co.uk/stock-check-webhook -X POST \
  -H 'Content-Type: application/json' -d '{"challenge":"ping"}'
# → {"challenge":"ping"}
```

### Update body format

Monday update body is HTML:

```
Stock Check
• Repair: <product name>
• Linked Part: <part name>
• Available Stock: <n> [⚠️ Low if <= 0]
• Other Possible Parts: …
```

Multiple linked products are listed in order. If a product has no linked Part, that entry says `Not found — manual check required`.

# repair-stock-check

Monday.com webhook service. Watches the **Requested Repairs** board-relation column on the main board and posts a stock-check Monday update on the same item.

Last updated: 2026-04-27
Status: built, **awaiting Monday webhook subscription + production deploy**

## What it does

1. Receives a Monday webhook when the **Requested Repairs** column changes on Main Board `349212843`.
2. Reads the linked Products & Pricing item IDs from the webhook payload.
3. For each product, looks up its linked Parts (Products & Pricing → `connect_boards8` → Parts board `985177480`).
4. Posts a Monday update on the main-board item summarising stock for each repair.

It is **read-only against the parts board**. It does not reserve, deduct, or modify stock.

## Why it's separate from icorrect-parts-service

`icorrect-parts-service` already handles a Monday webhook on the same board (column `connect_boards__1`, "Parts Used") and **writes** to the parts board (deduction). Bundling a read-only stock-check trigger into that service would couple it to the deduction write path. Keeping them separate is the simpler and safer split.

## Files

| File | Purpose |
|---|---|
| `index.js` | Express server + webhook handler |
| `package.json` | express dep |
| `repair-stock-check.service` | systemd user unit |

The shared stock-check logic lives in `/home/ricky/builds/operations-system/tools/lib/stock-check-core.js` and is also used by the CLI tool at `/home/ricky/builds/operations-system/tools/repair-stock-check.js`.

## Configuration

Loads from `/home/ricky/config/.env`:

| Var | Required | Notes |
|---|---|---|
| `MONDAY_APP_TOKEN` | yes | Used for both reading and posting the update |
| `SHADOW_MODE` | no | `true` → log the rendered update body without posting to Monday |
| `PORT` | no | Defaults to `8015` |

## Run locally

```bash
set -a; source /home/ricky/config/.env; set +a
SHADOW_MODE=true PORT=8015 node /home/ricky/builds/monday/services/repair-stock-check/index.js
```

Health:

```bash
curl http://127.0.0.1:8015/health
```

Simulate a webhook event (single repair):

```bash
curl -X POST http://127.0.0.1:8015/webhook/monday/repair-stock-check \
  -H 'Content-Type: application/json' \
  -d '{
    "event": {
      "type": "update_column_value",
      "boardId": 349212843,
      "columnId": "board_relation",
      "pulseId": 11721682647,
      "value": { "linkedPulseIds": [{"linkedPulseId": 5889495740}] },
      "previousValue": {}
    }
  }'
```

In `SHADOW_MODE=true`, the rendered update is logged but not posted.

## Deploy (systemd user service)

Reuses the same pattern as `monday/services/status-notifications/`:

```bash
cp /home/ricky/builds/monday/services/repair-stock-check/repair-stock-check.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now repair-stock-check.service
systemctl --user status repair-stock-check.service
```

Logs: `journalctl --user -u repair-stock-check -f`

## Nginx route

Add to the existing icorrect.co.uk server block (or wherever Monday webhooks already terminate):

```nginx
location /webhook/monday/repair-stock-check {
    proxy_pass http://127.0.0.1:8015/webhook/monday/repair-stock-check;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 10s;
    proxy_send_timeout 10s;
}
```

`sudo nginx -t && sudo systemctl reload nginx`

## Monday webhook subscription

Once the public URL is live, create a Monday webhook on the main board:

- **Board:** `349212843` (Main Board)
- **Event:** `change_specific_column_value`
- **Column:** `board_relation` (Requested Repairs)
- **URL:** `https://<your-domain>/webhook/monday/repair-stock-check`

Easiest path: use the Monday API mutation (run from a VPS shell that has the token):

```bash
set -a; source /home/ricky/config/.env; set +a
node -e '
const token = process.env.MONDAY_APP_TOKEN;
const url = "https://<your-domain>/webhook/monday/repair-stock-check";
const q = `mutation { create_webhook(board_id: 349212843, url: "${url}", event: change_specific_column_value, config: "{\\"columnId\\":\\"board_relation\\"}") { id board_id } }`;
fetch("https://api.monday.com/v2", {method:"POST", headers:{"Content-Type":"application/json", Authorization: token}, body: JSON.stringify({query: q})}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));
'
```

Monday will POST a `challenge` request to the URL on creation; the service handles it.

## Webhook payload notes

Monday sends `update_column_value` (not `change_column_value`) for board-relation columns. The current value lives in `event.value.linkedPulseIds`, which is an array of `{ linkedPulseId }` objects. `event.value.text` is `null`.

The service skips:
- Events on a different board, column, or type
- Events where the column was cleared (`linkedPulseIds` empty)
- Events where the previous and current sets are identical (echoes / no real change)

## Update body

Monday update body is HTML. Format:

```
Stock Check
• Repair: <product name>
• Linked Part: <part name>
• Available Stock: <n> [⚠️ Low if <= 0]
• Other Possible Parts: …
```

Multiple linked products are listed in order. If a product has no linked Part, the entry says `Not found — manual check required`.

## What this does NOT do

- Reserve or deduct stock (the existing `icorrect-parts-service` handles deduction on Parts Used)
- Notify a human via Telegram or Slack
- Score or rank parts beyond Monday's own linked-part order
- Substring-match product names (the webhook receives product IDs directly)

The CLI counterpart at `operations-system/tools/repair-stock-check.js` *does* do fuzzy product matching for ad-hoc lookups by device + repair name.

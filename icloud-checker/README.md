# iCloud Checker — Webhook Service

Replaces two n8n flows (both now deactivated):
- "Flow 2: iCloud & Spec Checker (bmcheck) - Updated!"
- "Flow 3: iCloud Recheck"

## Overview

Two functions in one service:

**1. Initial Check** — triggered automatically when a serial number is entered on Monday
**2. Auto-Recheck** — polls every 30 min for customer replies on locked devices, rechecks automatically

## 1. Initial Check (webhook)

**Trigger:** Monday webhook → serial number (`text4`) column changed on board `349212843`

```
Serial entered → Is client BM? → SickW Service 30 ($0.04)
  → iCloud OFF: update Monday (IC OFF), post comment
  → iCloud ON:  update Monday (IC ON)
                → suspend BM order (if SENT/RECEIVED)
                → move to iCloud locked group
                → message customer via BM API (Find My removal instructions)
                → post Monday comment
                → Slack alert
```

**Filters:** Only runs for items where Client column = "BM". All other client types skipped.

**Monday columns used:**
- `text4` — Serial Number (trigger)
- `status` — Client type (filter)
- `status24` — Repair Type (updated to IC ON / IC OFF)
- `text_mky01vb4` — BM Trade-in ID (for BM API calls)

**Monday groups:**
- `group_mktsw34v` — iCloud locked (items moved here when locked)
- `new_group70029` — Today's Repairs (items moved back when unlocked)

## 2. Auto-Recheck (cron, every 30 min)

**Trigger:** Timer — polls BackMarket for new customer messages on locked items

```
Get all items in iCloud locked group
  → For each: check BM messages (GET /orders/{id}/messages)
  → New message? → SickW recheck ($0.04)
    → Now OFF: update Monday (IC OFF), move to Today's Repairs,
               message customer ("processing within 24h"), Slack alert
    → Still ON: post Monday comment, message customer again
                (Find My instructions), Slack alert
```

**State:** Tracks message counts per order in `recheck-state.json` to detect new replies.

**Cost:** $0 for polling. $0.04 per SickW recheck (only when customer actually replies). Zero Anthropic tokens.

## Customer Messages (sent via BM API)

**iCloud ON:** "Thank you for your message. Unfortunately, your iCloud account is still linked to the MacBook – could you please double-check that the device is no longer showing in the Find My menu on your iCloud.com account? Guide: https://support.apple.com/en-gb/guide/icloud/mmfc0eeddd/icloud. It's also possible that a previous user's Apple ID is still linked."

**iCloud OFF:** "Thank you! We've confirmed your iCloud lock has been removed. Your trade-in will be processed within the next 24 hours."

## BackMarket API

- **Auth:** Basic token (hardcoded in service)
- **User-Agent:** `BM-iCorrect-n8n;ricky@icorrect.co.uk`
- **Endpoints used:**
  - `GET /ws/buyback/v1/orders/{id}` — check order status
  - `PUT /ws/buyback/v1/orders/{id}/suspend` — suspend order
  - `GET /ws/buyback/v1/orders/{id}/messages` — read message thread
  - `POST /ws/buyback/v1/orders/{id}/messages` — send customer message
- **Suspendable statuses:** SENT, RECEIVED

## Deployment

- **Location:** `/home/ricky/builds/icloud-checker/`
- **Service:** `systemctl --user status icloud-checker`
- **Port:** 8010
- **Nginx:** location block in `/etc/nginx/sites-available/mission-control`
- **URL:** `https://mc.icorrect.co.uk/webhook/icloud-check`
- **Health:** `https://mc.icorrect.co.uk/webhook/icloud-check/health`
- **Manual recheck:** `POST https://mc.icorrect.co.uk/webhook/icloud-check/recheck`

## Monday.com Webhook Setup

Register in Monday UI:
- **Board:** 349212843 (iCorrect Main Board)
- **Event:** Column value changed
- **Column:** `text4` (Serial Number)
- **URL:** `https://mc.icorrect.co.uk/webhook/icloud-check`

Monday sends a challenge request on first setup — the service handles this automatically.

## Environment Variables

All from `/home/ricky/config/.env`:
- `SICKW_API_KEY` — SickW API key
- `MONDAY_API_TOKEN` — Monday.com API token
- `SLACK_WEBHOOK_URL` — Slack incoming webhook (optional)

## Commands

```bash
systemctl --user status icloud-checker     # Status
systemctl --user restart icloud-checker    # Restart
journalctl --user -u icloud-checker -f     # Logs
```

## SickW API Reference

- **Service 30** — Apple Basic Info ($0.04) — iCloud, model, warranty, colour ← we use this
- **Service 110** — MacBook iCloud ON/OFF ($0.20) — old flow used this, 5x more expensive
- **Service 3** — iCloud ON/OFF ($0.02) — iPhone/iPad only, doesn't work for Macs
- **Balance:** check `balance` field in any API response (~$47 as of Feb 2026)

## Pattern for New Webhook Services

1. Create project in `/home/ricky/builds/<service-name>/`
2. Express server on a unique port
3. Systemd user service in `~/.config/systemd/user/<service-name>.service`
4. Nginx location block in `/etc/nginx/sites-available/mission-control`
5. `systemctl --user enable --now <service-name>` + `sudo nginx -t && sudo systemctl reload nginx`

### Port Registry

| Port | Service |
|------|---------|
| 3001 | Parts deduction webhook |
| 5678 | n8n |
| 8002 | Agent trigger (FastAPI) |
| 8010 | iCloud checker |

Reserve 8011+ for future services.

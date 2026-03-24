# BackMarket Ingress Map

**Last updated:** 24 Mar 2026, post Agent 1 completion
**Author:** Code (Agent 1)
**Status:** All changes applied and verified live. This is the current production state.

---

## Live State (24 Mar 2026)

### BM Service Port Map

| Port | Bind | Service | systemd Unit | Status |
|------|------|---------|-------------|--------|
| 8010 | `127.0.0.1` | icloud-checker (monolith) | `icloud-checker.service` | Running. Handles all BM webhooks currently. |
| 8003 | `127.0.0.1` | telephone-inbound (Slack router) | `telephone-inbound.service` | Running. Routes Slack interactions. |
| 8011 | — | bm-grade-check | — | **Not yet deployed.** Nginx route exists, proxies to 8010. |
| 8012 | — | bm-payout | — | **Not yet deployed.** Nginx route exists, proxies to 8010. |
| 8013 | — | bm-shipping | — | **Not yet deployed.** Nginx route exists, proxies to 8010. |

Port 8010 is **not reachable on the public IP**. All traffic goes through nginx (`mc.icorrect.co.uk`) with SSL.

### Nginx Routes (mc.icorrect.co.uk)

All BM and iCloud webhook routes. No auth (Monday and Slack are the callers).

| Route | Proxies to | Notes |
|-------|-----------|-------|
| `/webhook/bm/grade-check` | `127.0.0.1:8010` | Currently monolith. When Agent 2 deploys bm-grade-check, change to `127.0.0.1:8011`. |
| `/webhook/bm/payout` | `127.0.0.1:8010` | Currently monolith. When Agent 2 deploys bm-payout, change to `127.0.0.1:8012`. |
| `/webhook/bm/shipping-confirmed` | `127.0.0.1:8010` | Currently monolith. When Agent 2 deploys bm-shipping, change to `127.0.0.1:8013`. |
| `/webhook/bm/counter-offer-action` | `127.0.0.1:8010` | Stays in monolith until decomposition. |
| `/webhook/icloud-check/slack-interact` | `127.0.0.1:8003` | telephone-inbound, forwards non-phone actions to 8010. |
| `/webhook/icloud-check/spec-check` | `127.0.0.1:8010` | Read-only Apple spec lookup. |
| `/webhook/icloud-check/health` | `127.0.0.1:8010` | Health check endpoint. |
| `/webhook/icloud-check` | `127.0.0.1:8010` | Main iCloud check webhook (catch-all). |

**Nginx config file:** `/etc/nginx/sites-enabled/mission-control`
**Backup:** `/etc/nginx/sites-enabled/mission-control.backup-20260324`

### Monday Webhooks (Live, confirmed)

All webhooks point to `https://mc.icorrect.co.uk/...` — updated and tested 24 Mar.

| Board | Column | Trigger | URL |
|-------|--------|---------|-----|
| 349212843 (Main) | text4 (serial) | Value entered | `https://mc.icorrect.co.uk/webhook/icloud-check` |
| 349212843 (Main) | status4 | "Diagnostic Complete" | `https://mc.icorrect.co.uk/webhook/bm/grade-check` |
| 349212843 (Main) | status24 | "Pay-Out" | `https://mc.icorrect.co.uk/webhook/bm/payout` |
| 349212843 (Main) | status4 | "Shipped" | `https://mc.icorrect.co.uk/webhook/bm/shipping-confirmed` |

### Slack Interactivity Routing (Live, confirmed)

Slack interactivity URL: `https://mc.icorrect.co.uk/webhook/icloud-check/slack-interact`

```
Slack button click
  → nginx (mc.icorrect.co.uk/webhook/icloud-check/slack-interact)
    → 127.0.0.1:8003 (telephone-inbound/server.py)
      → Phone buttons handled locally (open_phone_log_modal, phone_create_monday, phone_create_intercom)
      → All other buttons forwarded to 127.0.0.1:8010/webhook/icloud-check/slack-interact
        → icloud-checker Express handler (recheck, counter-offer, customer reply)
```

---

## Cutover Contract for Agents 2+

When Agent 2 deploys a new service (e.g. bm-grade-check on port 8011):

**All nginx routes already exist and proxy to 8010 (monolith).** Agent 2 does NOT need to create routes — only update the port number.

**Steps:**
1. Deploy the new service on `127.0.0.1:<port>` (see "How to Add a New Service" below)
2. Verify the new service responds: `curl -s http://127.0.0.1:<port>/webhook/bm/<name> -X POST -d '{}'`
3. Update nginx: change `proxy_pass http://127.0.0.1:8010` → `proxy_pass http://127.0.0.1:<port>` for the relevant route
4. `sudo nginx -t && sudo systemctl reload nginx`
5. Verify end-to-end: trigger the Monday webhook, confirm the new service handles it
6. Remove the corresponding handler from the monolith (`icloud-checker/src/index.js`)

**Port allocation (reserved):**

| Port | Service | Status |
|------|---------|--------|
| 8010 | icloud-checker (intake only, after slimming) | Live — shrinks as endpoints are extracted |
| 8011 | bm-grade-check | Reserved, not deployed |
| 8012 | bm-payout | Reserved, not deployed |
| 8013 | bm-shipping | Reserved, not deployed |

---

## Runbook

### Services

| Service | systemd Unit | Port | Restart | Logs |
|---------|-------------|------|---------|------|
| icloud-checker | `icloud-checker.service` | 8010 | `systemctl --user restart icloud-checker` | `journalctl --user -u icloud-checker -f` |
| telephone-inbound | `telephone-inbound.service` | 8003 | `systemctl --user restart telephone-inbound` | `tail -f /home/ricky/builds/telephone-inbound/telephone-inbound.log` |
| agent-trigger | `agent-trigger.service` | 8002 | `systemctl --user restart agent-trigger` | `journalctl --user -u agent-trigger -f` |
| llm-summary | `llm-summary.service` | 8004 | `systemctl --user restart llm-summary` | `journalctl --user -u llm-summary -f` |
| nginx | system service | 80/443 | `sudo systemctl reload nginx` | `/var/log/nginx/access.log` |

### Health Checks

```bash
# icloud-checker health
curl -s https://mc.icorrect.co.uk/webhook/icloud-check/health | jq .

# Check service status
systemctl --user status icloud-checker
systemctl --user status telephone-inbound

# Check what's listening
ss -tlnp | grep -E ':(8010|8003|8011|8012|8013)\s'

# Check nginx config
sudo nginx -t

# Check nginx access logs for recent webhook traffic
sudo tail -20 /var/log/nginx/access.log | grep webhook

# Verify public IP is closed
curl -s --connect-timeout 3 http://46.225.53.159:8010/webhook/icloud-check/health
# Should return empty (connection refused)
```

### Environment

All services load env from `/home/ricky/config/.env` via systemd `EnvironmentFile`.

| Variable | Used by | Notes |
|----------|---------|-------|
| `BM_AUTH` | icloud-checker (monolith) | `Basic ...` auth header for BM API |
| `BACKMARKET_API_AUTH` | standalone scripts | Same value, different name |
| `MONDAY_APP_TOKEN` | All services | Monday.com GraphQL token |
| `SLACK_BOT_TOKEN` | icloud-checker, telephone-inbound | Slack messaging |
| `SLACK_AUTOMATIONS_BOT_TOKEN` | icloud-checker | Slack modals and rich messages |
| `SICKW_API_KEY` | icloud-checker | iCloud lock checking |

### How to Add a New Webhook Service

1. **Create the service** with Express listening on `127.0.0.1:<port>`
2. **Create systemd unit** at `~/.config/systemd/user/bm-<name>.service`:
   ```ini
   [Unit]
   Description=BM <Name> Webhook Service
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/home/ricky/builds/backmarket/services/bm-<name>
   ExecStart=/usr/bin/node index.js
   Restart=on-failure
   RestartSec=5
   EnvironmentFile=/home/ricky/config/.env

   [Install]
   WantedBy=default.target
   ```
3. **Enable and start:**
   ```bash
   systemctl --user daemon-reload
   systemctl --user enable bm-<name>
   systemctl --user start bm-<name>
   ```
4. **Update nginx** — change the `proxy_pass` in `/etc/nginx/sites-enabled/mission-control` from `127.0.0.1:8010` to `127.0.0.1:<port>` for the relevant route:
   ```bash
   sudo vim /etc/nginx/sites-enabled/mission-control
   sudo nginx -t
   sudo systemctl reload nginx
   ```
5. **Verify:**
   ```bash
   curl -s https://mc.icorrect.co.uk/webhook/bm/<name> -X POST -d '{}'
   journalctl --user -u bm-<name> -f
   ```

### Rollback

If a webhook breaks after changes:

1. **Revert nginx** to backup: `sudo cp /etc/nginx/sites-enabled/mission-control.backup-20260324 /etc/nginx/sites-enabled/mission-control && sudo nginx -t && sudo systemctl reload nginx`
2. **Revert icloud-checker binding** if needed: change `'127.0.0.1'` back to removing the second arg in `app.listen(PORT, ...)`, restart
3. **Revert Monday webhooks** to `http://46.225.53.159:8010/...` via Monday web UI

---

## Other Ports (Not BM — Out of Scope)

These ports are publicly exposed but are NOT BackMarket-related:

| Port | Service | Risk | Owner |
|------|---------|------|-------|
| 3001 | icorrect-parts | Medium (crash-looping) | Infrastructure |
| 18789 | OpenClaw Gateway | Medium (has auth token) | Infrastructure |
| 8765 | Xero OAuth temp | Low (temporary) | Infrastructure |
| 4174/4175 | Intake form | Low (static content) | Infrastructure |
| 5678 | n8n | Low (has own auth) | Infrastructure |

These should be locked down separately. Not part of the BM rebuild.

---

## Verification Log

| Webhook | Test | Result | Date |
|---------|------|--------|------|
| icloud-check | Serial entry on Main Board | ✅ IC OFF returned for C02DH0W4P3XY | 24 Mar |
| grade-check | status4 → "Diagnostic Complete" on BM 1488, BM 1539 | ✅ A-number match, profitability calculated | 24 Mar |
| payout | status24 → "Pay-Out" on BM 1488 | ✅ BM API reached, 422 (order state — auth confirmed) | 24 Mar |
| shipping-confirmed | status4 → "Shipped" on BM 1194 | ✅ Full chain, stopped safely on missing BM order ID | 24 Mar |
| Slack recheck button | Clicked on BM 1504 (iCloud locked) | ✅ SickW check ran, "still locked" | 24 Mar |
| Public IP refused | `curl http://46.225.53.159:8010/...` | ✅ Connection refused | 24 Mar |

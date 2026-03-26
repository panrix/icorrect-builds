# BackMarket Ingress Map

**Last updated:** 25 Mar 2026, post BM webhook cutover
**Author:** Code / Codex
**Status:** BM webhook split services are deployed and validated with real Monday webhooks (26 Mar).

---

## Live State (25 Mar 2026)

### BM Service Port Map

| Port | Bind | Service | systemd Unit | Status |
|------|------|---------|-------------|--------|
| 8010 | `127.0.0.1` | icloud-checker (monolith) | `icloud-checker.service` | Running. Still handles iCloud + remaining unsplit BM routes. |
| 8003 | `127.0.0.1` | telephone-inbound (Slack router) | `telephone-inbound.service` | Running. Routes Slack interactions. |
| 8011 | `127.0.0.1` | bm-grade-check | `bm-grade-check.service` | Live. nginx proxies `/webhook/bm/grade-check` to 8011. |
| 8012 | `127.0.0.1` | bm-payout | `bm-payout.service` | Live. nginx proxies `/webhook/bm/payout` to 8012. |
| 8013 | `127.0.0.1` | bm-shipping | `bm-shipping.service` | Live. nginx proxies `/webhook/bm/shipping-confirmed` to 8013. |

Port 8010 is **not reachable on the public IP**. All traffic goes through nginx (`mc.icorrect.co.uk`) with SSL.

### Nginx Routes (mc.icorrect.co.uk)

All BM and iCloud webhook routes. No auth (Monday and Slack are the callers).

| Route | Proxies to | Notes |
|-------|-----------|-------|
| `/webhook/bm/grade-check` | `127.0.0.1:8011` | Live standalone service. |
| `/webhook/bm/payout` | `127.0.0.1:8012` | Live standalone service. |
| `/webhook/bm/shipping-confirmed` | `127.0.0.1:8013` | Live standalone service. |
| `/webhook/bm/counter-offer-action` | `127.0.0.1:8010` | Stays in monolith until decomposition. |
| `/webhook/icloud-check/slack-interact` | `127.0.0.1:8003` | telephone-inbound, forwards non-phone actions to 8010. |
| `/webhook/icloud-check/spec-check` | `127.0.0.1:8010` | Read-only Apple spec lookup. |
| `/webhook/icloud-check/health` | `127.0.0.1:8010` | Health check endpoint. |
| `/webhook/icloud-check` | `127.0.0.1:8010` | Main iCloud check webhook (catch-all). |

**Nginx config file:** `/etc/nginx/sites-enabled/mission-control`
**Backup:** `/etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover`

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

## Cutover Status

The BM webhook split is complete. All three routes are validated with real Monday webhooks (26 Mar) and the monolith handlers have been removed (26 Mar).

Nginx backup kept at `/etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover`.
Monolith backup kept at `/home/ricky/builds/icloud-checker/src/index.js.bak-pre-removal`.

**Port allocation:**

| Port | Service | Status |
|------|---------|--------|
| 8010 | icloud-checker (intake + counter-offer + to-list) | Live — shipping/payout/grade-check removed 26 Mar |
| 8011 | bm-grade-check | Live |
| 8012 | bm-payout | Live |
| 8013 | bm-shipping | Live |

---

## Runbook

### Services

| Service | systemd Unit | Port | Restart | Logs |
|---------|-------------|------|---------|------|
| icloud-checker | `icloud-checker.service` | 8010 | `systemctl --user restart icloud-checker` | `journalctl --user -u icloud-checker -f` |
| bm-grade-check | `bm-grade-check.service` | 8011 | `systemctl --user restart bm-grade-check` | `journalctl --user -u bm-grade-check -f` |
| bm-payout | `bm-payout.service` | 8012 | `systemctl --user restart bm-payout` | `journalctl --user -u bm-payout -f` |
| bm-shipping | `bm-shipping.service` | 8013 | `systemctl --user restart bm-shipping` | `journalctl --user -u bm-shipping -f` |
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
systemctl --user status bm-grade-check bm-payout bm-shipping
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

**If a standalone service breaks (8011/8012/8013):**
1. Check logs: `journalctl --user -u bm-<name> -f`
2. Restart the service: `systemctl --user restart bm-<name>`
3. If the service won't start, restore the monolith handler and point nginx back to 8010:
   - `cp /home/ricky/builds/icloud-checker/src/index.js.bak-pre-removal /home/ricky/builds/icloud-checker/src/index.js`
   - `systemctl --user restart icloud-checker`
   - `sudo cp /etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover /etc/nginx/sites-enabled/mission-control`
   - `sudo nginx -t && sudo systemctl reload nginx`
   - This restores all three BM routes to the monolith on 8010.

**If nginx breaks:**
1. `sudo nginx -t` to see the error
2. Restore backup: `sudo cp /etc/nginx/sites-enabled/mission-control.backup-20260325-bm-cutover /etc/nginx/sites-enabled/mission-control && sudo nginx -t && sudo systemctl reload nginx`

Do NOT point Monday webhooks at the public IP (`46.225.53.159:8010`) — port 8010 is closed to external traffic.

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
| grade-check | `curl -sk -X POST https://mc.icorrect.co.uk/webhook/bm/grade-check -d '{}'` | ✅ nginx routed to 8011, returned OK | 25 Mar |
| payout | `curl -sk -X POST https://mc.icorrect.co.uk/webhook/bm/payout -d '{}'` | ✅ nginx routed to 8012, returned OK | 25 Mar |
| shipping-confirmed | `curl -sk -X POST https://mc.icorrect.co.uk/webhook/bm/shipping-confirmed -d '{}'` | ✅ nginx routed to 8013, returned OK | 25 Mar |
| payout (standalone 8012) | Monday webhook: status24 → Pay-Out on BM 1536 | ✅ Pre-flight passed, BM API 422 (already validated) — correct | 26 Mar |
| shipping (standalone 8013) | Monday webhook: status4 → Shipped on BM 1402 | ✅ Tracking found, hard-gated on missing BM order ID — correct | 26 Mar |
| grade-check (standalone 8011) | Monday webhook: status4 → Diagnostic Complete on BM 1508 | ✅ A2485 matched, Fair grade, £698 sell, 97% margin — PROFITABLE | 26 Mar |
| Slack recheck button | Clicked on BM 1504 (iCloud locked) | ✅ SickW check ran, "still locked" | 24 Mar |
| Public IP refused | `curl http://46.225.53.159:8010/...` | ✅ Connection refused | 24 Mar |

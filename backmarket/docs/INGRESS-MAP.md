# BackMarket Ingress Map

**Last updated:** 24 Mar 2026
**Author:** Code (Agent 1)

---

## Current State (Live, 24 Mar 2026)

### Port Map

| Port | Bind | Process | Service | systemd/PM2 | Public? |
|------|------|---------|---------|-------------|---------|
| 8010 | `*` (0.0.0.0) | node src/index.js | icloud-checker (monolith) | `icloud-checker.service` | **YES — UNSAFE** |
| 8003 | `127.0.0.1` | python3 server.py | telephone-inbound (Slack router) | `telephone-inbound.service` | No (localhost) |
| 8002 | `127.0.0.1` | python3 | agent-trigger (FastAPI) | `agent-trigger.service` | No (localhost) |
| 8001 | `127.0.0.1` | python3 | marketing-intelligence API | — | No (localhost) |
| 8004 | `127.0.0.1` | node | llm-summary | `llm-summary.service` | No (localhost) |
| 8080 | `127.0.0.1` | python3 | Xero OAuth2 callback | — | No (localhost) |
| 3001 | `*` (0.0.0.0) | node src/index.js | icorrect-parts | PM2 (crash-looping) | **YES — UNSAFE** |
| 18789 | `0.0.0.0` | openclaw-gateway | OpenClaw Gateway | `openclaw-gateway.service` | **YES — UNSAFE** |
| 8765 | `0.0.0.0` | python3 xero_oauth2.py | Xero OAuth temp server | — | **YES — UNSAFE** |
| 4174 | `0.0.0.0` | python3 -m http.server | intake-form static | — | **YES — UNSAFE** |
| 4175 | `0.0.0.0` | nginx proxy → 4174 | intake-form nginx wrapper | — | **YES — UNSAFE** |
| 5678 | `0.0.0.0` | n8n | n8n workflow engine | — | **YES** (has own auth) |

### Nginx Routes (mc.icorrect.co.uk, SSL)

| Route | Proxies to | Auth | Notes |
|-------|-----------|------|-------|
| `/webhook/icloud-check/slack-interact` | `127.0.0.1:8003` | None | Telephone-inbound Python server, which forwards to `127.0.0.1:8010/slack-interact` (double-hop) |
| `/webhook/icloud-check` | `127.0.0.1:8010` | None | icloud-checker monolith |
| `/parts-webhook` | `127.0.0.1:3001/webhook` | None | icorrect-parts service |
| `/slack/` | `127.0.0.1:8003` | None | Telephone inbound Slack commands |
| `/api/summarize-updates` | `127.0.0.1:8004` | None | LLM summary |
| `/api/` | `127.0.0.1:8002` | None | Agent trigger (FastAPI) |
| `/` | Static files (dashboard) | Basic auth | Mission Control dashboard |

### What's NOT behind nginx

| Endpoint | Port | Reached via | Risk |
|----------|------|-------------|------|
| `/webhook/bm/payout` | 8010 | `http://46.225.53.159:8010` direct | **CRITICAL — triggers real BM payouts** |
| `/webhook/bm/shipping-confirmed` | 8010 | `http://46.225.53.159:8010` direct | **CRITICAL — marks orders as shipped** |
| `/webhook/bm/grade-check` | 8010 | `http://46.225.53.159:8010` direct | **HIGH — triggers Slack alerts** |
| `/webhook/bm/counter-offer-action` | 8010 | `http://46.225.53.159:8010` direct | **HIGH — counter-offer actions** |
| `/webhook/icloud-check/recheck` | 8010 | `http://46.225.53.159:8010` direct | MEDIUM |
| `/webhook/icloud-check/spec-check` | 8010 | `http://46.225.53.159:8010` direct | LOW (read-only) |
| `/webhook/icloud-check/health` | 8010 | `http://46.225.53.159:8010` direct | LOW (read-only) |

### Slack Interactivity Routing (Confirmed)

```
Slack button click
  → nginx mc.icorrect.co.uk /webhook/icloud-check/slack-interact
    → 127.0.0.1:8003 (telephone-inbound/server.py line 576)
      → 127.0.0.1:8010/slack-interact (forwarded via requests.post, line 658)
        → icloud-checker Express handler (index.js line 743)
```

This is a double-hop. The telephone-inbound server acts as a router for Slack interactions — it handles both phone-related Slack commands AND forwards iCloud/BM Slack interactions to the icloud-checker.

### Monday Webhooks (Need manual verification)

These are the webhooks that SHOULD exist on Monday based on the monolith's endpoints. Actual URLs need confirming in the Monday web UI:

| Board | Trigger | Expected URL | Notes |
|-------|---------|-------------|-------|
| 349212843 | Serial entered (text4) | Unknown — likely `http://46.225.53.159:8010/webhook/icloud-check` or via nginx | |
| 349212843 | status24 → "Pay-Out" | Unknown — likely `http://46.225.53.159:8010/webhook/bm/payout` | **Direct to public IP** |
| 349212843 | status4 → "Shipped" | Unknown — likely `http://46.225.53.159:8010/webhook/bm/shipping-confirmed` | **Direct to public IP** |
| 349212843 | Grade changed | Unknown — likely `http://46.225.53.159:8010/webhook/bm/grade-check` | **Direct to public IP** |

**BLOCKER:** Cannot confirm Monday webhook URLs without Monday web UI access or API access. Need Ricky to check, or need Monday API token with webhook read permissions.

---

## Target State (After Agent 1)

### Port Map (Changes Only)

| Port | Current Bind | Target Bind | Change |
|------|-------------|-------------|--------|
| 8010 | `*` (0.0.0.0) | `127.0.0.1` | **CHANGE** — bind to localhost |
| 8011 | — | `127.0.0.1` | **FUTURE** — bm-grade-check (Agent 2 builds) |
| 8012 | — | `127.0.0.1` | **FUTURE** — bm-payout (Agent 2 builds) |
| 8013 | — | `127.0.0.1` | **FUTURE** — bm-shipping (Agent 2 builds) |

Ports 8011-8013 don't exist yet. Agent 1 adds the nginx routes as placeholders (return 502 until services are deployed). This way Agents 2+ can deploy services without touching nginx.

### Nginx Routes (New/Changed on mc.icorrect.co.uk)

```nginx
# ── BM Webhook Routes (NEW) ──

# Grade check — Monday webhook fires on status4 = "Diagnostic Complete"
location /webhook/bm/grade-check {
    auth_basic off;
    proxy_pass http://127.0.0.1:8011;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Payout — Monday webhook fires on status24 = "Pay-Out"
location /webhook/bm/payout {
    auth_basic off;
    proxy_pass http://127.0.0.1:8012;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Shipping confirmation — Monday webhook fires on status4 = "Shipped"
location /webhook/bm/shipping-confirmed {
    auth_basic off;
    proxy_pass http://127.0.0.1:8013;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Counter-offer action — Slack button handler (temporary, until monolith decomposition)
location /webhook/bm/counter-offer-action {
    auth_basic off;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Spec check — read-only Apple spec lookup API
location /webhook/icloud-check/spec-check {
    auth_basic off;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Health check
location /webhook/icloud-check/health {
    auth_basic off;
    proxy_pass http://127.0.0.1:8010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Note:** During the transition period (before Agents 2+ deploy separate services), the `/webhook/bm/payout`, `/webhook/bm/shipping-confirmed`, and `/webhook/bm/grade-check` routes proxy to port 8010 (the monolith still handles them). Once the separate services are deployed on 8011-8013, the routes are updated to point to the new ports.

### Monday Webhook URLs (Target)

| Board | Trigger | Target URL |
|-------|---------|-----------|
| 349212843 | Serial entered | `https://mc.icorrect.co.uk/webhook/icloud-check` |
| 349212843 | status4 → "Diagnostic Complete" | `https://mc.icorrect.co.uk/webhook/bm/grade-check` |
| 349212843 | status24 → "Pay-Out" | `https://mc.icorrect.co.uk/webhook/bm/payout` |
| 349212843 | status4 → "Shipped" | `https://mc.icorrect.co.uk/webhook/bm/shipping-confirmed` |

---

## Rollout Order

1. **Add nginx routes** — all BM endpoints proxy to 8010 initially (monolith still handles them)
2. `sudo nginx -t` — validate config
3. `sudo systemctl reload nginx` — apply
4. **Verify nginx routes work:** `curl -k https://mc.icorrect.co.uk/webhook/icloud-check/health`
5. **Update Monday webhook URLs** to `https://mc.icorrect.co.uk/...` (manual — web UI)
6. **Verify Monday webhooks fire** through nginx (trigger a test status change)
7. **Bind icloud-checker to 127.0.0.1** — edit index.js line 1907
8. **Restart icloud-checker** — `systemctl --user restart icloud-checker`
9. **Verify public IP refused:** `curl http://46.225.53.159:8010/webhook/bm/payout` → connection refused
10. **Verify nginx path works:** trigger a real payout/shipping/grade-check and confirm it works end-to-end

### Rollback Plan

If Monday webhooks break after URL change:
1. Revert Monday webhook URLs to `http://46.225.53.159:8010/...`
2. Revert icloud-checker bind to `0.0.0.0`
3. Restart icloud-checker

---

## File Changes Required

| File | Change | Risk |
|------|--------|------|
| `/etc/nginx/sites-enabled/default` (mc.icorrect.co.uk block) | Add 6 new location blocks for BM webhooks | Low — additive only |
| `icloud-checker/src/index.js` line 1907 | `app.listen(PORT)` → `app.listen(PORT, '127.0.0.1')` | Medium — breaks direct IP access |
| Monday.com board 349212843 webhook settings | Update URLs from `http://IP:8010/...` to `https://mc.icorrect.co.uk/...` | Medium — manual, reversible |

---

## Blockers

| Blocker | Resolution |
|---------|-----------|
| Cannot verify Monday webhook URLs without web UI access | Ricky must check or provide API access |
| Slack interactivity URL unknown | Check Slack app settings — if it points to the public IP, it needs updating to `https://mc.icorrect.co.uk/webhook/icloud-check/slack-interact` |

---

## Out of Scope (For Other Agents)

These ports are also publicly exposed but are NOT BackMarket-related:

| Port | Service | Risk | Owner |
|------|---------|------|-------|
| 3001 | icorrect-parts | Medium (crash-looping) | Infrastructure |
| 18789 | OpenClaw Gateway | Medium (has auth token) | Infrastructure |
| 8765 | Xero OAuth temp | Low (temporary) | Infrastructure |
| 4174/4175 | Intake form | Low (static content) | Infrastructure |
| 5678 | n8n | Low (has own auth) | Infrastructure |

These should be locked down separately. Not part of the BM rebuild.

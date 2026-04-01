# Plan: Monday Status Notification Migration to VPS

**Date:** 2026-03-30
**Author:** Claude Code (with QA review by Codex)
**Status:** Shadow service was implemented on 2026-03-30, fully verified on 2026-03-31, and cut over to live Intercom sending on 2026-04-01. The remaining work is monitoring and final automation cleanup.

## Context

Two Monday.com automations (537444955 and 530471762) fire on **every column change**, burning ~4,000+ automation actions/day. Both are active with unknown destinations. The automation audit says 537444955 should be parts-only and 530471762 should be status-only for Intercom notifications.

The status notification system currently works via: Monday webhooks → Cloudflare Worker (`icorrect-macros`) → n8n Cloud → Intercom. This routes through 3 external services when the VPS already hosts 6 similar webhook services.

**Outcome:** Build a VPS service that replaces the Cloudflare Worker + n8n path for status notifications. Kill the token-burning automations once their destinations are confirmed in Monday UI.

**Out of scope:** Shopify Contact Form / Quote Wizard migration (separate plan for Ferrari).

## Current State (as of 2026-04-01)

- VPS shadow service exists at `/home/ricky/builds/monday/services/status-notifications/`.
- systemd unit exists at `~/.config/systemd/user/status-notifications.service` and is running with `SHADOW_MODE=false`.
- Live nginx route exists at `/etc/nginx/sites-enabled/mission-control` for `POST /webhook/monday/status-notification`.
- The service has already received real production webhook traffic and written shadow records to `/home/ricky/logs/status-notifications-shadow.jsonl`.
- A synthetic verification run on 2026-03-31 exercised every remaining missing template branch plus the missing-Intercom-ID skip path, then cleaned up the temporary Monday items.
- A final pre-cutover check on 2026-03-31 confirmed:
  - the Monday challenge response path works
  - a forced Intercom 404 triggers a Slack alert in the configured status-notification channel
  - representative rendered outputs match the legacy template source text in `monday/icorrect-status-notification-documentation.md`
- The temporary Intercom test contact used for the synthetic run was deleted. The seed conversation could not be deleted through the current Intercom API version and should be ignored/closed manually if needed.
- The old n8n workflow `TDBSUDxpcW8e56y4` is disabled.
- A controlled live smoke test on 2026-04-01 sent a real `ready-walkin` reply through the VPS service and verified the expected Intercom body content.
- The cutover exposed a unit-file precedence issue: `Environment=SHADOW_MODE=false` must appear after `EnvironmentFile=/home/ricky/config/.env` or the shared env can override it.
- Source capture is committed in git. Further changes should be incremental follow-up commits.

---

## Discovery (COMPLETED 2026-03-30)

All artefacts in `builds/webhook-migration/discovery/`.

| Artefact | File | Key Finding |
|----------|------|-------------|
| Monday webhooks | `monday-webhooks.md` | 31 webhooks. Status notifications use properly-filtered webhooks (264095774, 337386341). The catch-all automations are separate. |
| Cloudflare Worker source | `cloudflare-icorrect-macros.js` | The REAL notification router (474 lines). Named `icorrect-macros`, not `icorrect-status-router` as docs say. Handles item_created + email_updated + status4 changes. |
| n8n workflow export | `n8n-exports/status-notifications.json` | Full workflow JSON (56KB). Contains Extract Data, Merge Contact Name, Send Intercom Reply nodes. |
| Intercom API proof | `intercom-api-proof.md` | All write endpoints proven live: conversations, tickets, companies, contact search/create. |

---

## Conventions

- **Env:** `/home/ricky/config/.env` via systemd `EnvironmentFile=`
- **Token:** `process.env.INTERCOM_API_TOKEN` (no fallback needed)
- **Express routes:** Full external path (`app.post("/webhook/monday/status-notification", ...)`)
- **Nginx:** `auth_basic off;` on webhook locations (server block has global auth)
- **Failures:** Slack alert on every Intercom API failure

---

## Phase 1 — Shadow Service (port 8014)

**Replaces:** Cloudflare Worker `icorrect-macros` (status notification path only) + n8n workflow `TDBSUDxpcW8e56y4`

### Implemented

**Directory:** `/home/ricky/builds/monday/services/status-notifications/`

**Files:**
| File | Purpose | ~Lines |
|------|---------|--------|
| `index.js` | Express server: webhook handler, Monday fetch, routing, Intercom calls | ~320 |
| `templates.js` | 14 email template functions | ~180 |
| `package.json` | Express dependency | — |
| `status-notifications.service` | Repo copy of the deployed user unit | — |

**`index.js` route: `POST /webhook/monday/status-notification`**

1. Monday challenge: if `body.challenge`, return it immediately
2. Respond 200 immediately, then process async (matching bm-shipping pattern)
3. Filter: only process `event.columnId === "status4"` — log + skip others
4. Fetch full item from Monday GraphQL API (port `fetchItemData()` from Cloudflare Worker)
5. Extract: service (`service`), client type (`status`), passcode (`text8`)
6. `determineWebhookType()` — 14-scenario switch (port from Cloudflare Worker)
7. If no webhook type → log, stop
8. **Intercom ID gate:** If `text_mm087h9p` is empty → log warning, stop
9. `GET /conversations/{intercomId}` → extract `contacts.contacts[0].id`
10. `GET /contacts/{contactId}` → extract first name (`name.split(' ')[0]`), fallback to Monday item name
11. Select + interpolate template from `templates.js`
12. **SHADOW_MODE:** If env `SHADOW_MODE=true` → log rendered template + all context, do NOT send reply. If false → `POST /conversations/{intercomId}/reply`:
    ```json
    {"message_type": "comment", "type": "admin", "admin_id": "9702337", "body": "<html>"}
    ```
13. **On Intercom failure:** Log error + send Slack alert
14. `GET /health` — health check

**Gophr Time Window:** Column ID `text_mm084vbh`. Keep in templates.

**Date formatting:** Port exact JS from n8n Extract Data node (UTC → Europe/London, ordinal suffixes). Source: `discovery/n8n-exports/status-notifications.json`.

**Contact name merge:** Port from n8n Merge Contact Name node: `contact.name.split(' ')[0]`, fallback `contact.first_name`, then `itemName`.

**Source of truth for porting:**

| Component | Primary source |
|-----------|---------------|
| 14-scenario routing | Cloudflare Worker (`discovery/cloudflare-icorrect-macros.js`) |
| Email templates | notification-docs lines 579-780 (verified against n8n) |
| Date formatting | n8n Extract Data node (`discovery/n8n-exports/status-notifications.json`) |
| Contact name merge | n8n Merge Contact Name node (same export) |
| Intercom reply payload | n8n Send Intercom Reply node (same export) |
| Column IDs | notification-docs lines 122-136 + Gophr TW: `text_mm084vbh` |

### Deploy State

1. `npm install` completed in the service directory
2. systemd unit created at `~/.config/systemd/user/status-notifications.service`
3. `systemctl --user enable --now status-notifications` completed
4. Nginx route added in `/etc/nginx/sites-enabled/mission-control`:
   ```nginx
   location /webhook/monday/status-notification {
       auth_basic off;
       proxy_pass http://127.0.0.1:8014;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
5. nginx reload completed; route is live

### Verify (Shadow Mode)

- [x] Health check: `curl http://127.0.0.1:8014/health` → 200
- [x] Challenge: POST `{"challenge":"test"}` → `{"challenge":"test"}`
- [x] Non-status4 events logged and skipped
- [x] Monday webhook is reaching the VPS route in shadow mode
- [x] Real status4 changes have been shadow-rendered without sending to Intercom
- [x] Representative shadow output checked against legacy source templates and workflow material
- [x] Scenario coverage complete: all 14 templates + missing-intercomId case exercised in shadow
- [x] Failure alert path exercised via forced Intercom error; Slack alert observed in the configured channel

### Next Gate

After live cutover:

1. Monitor logs and Slack alerts for 48 hours.
2. Confirm there are no duplicate or missed production notifications.
3. Review Monday automation destinations in the UI before disabling token-burner automations.

---

## Phase 2 — Cutover

**No parallel live sending.** Old path disabled before new path goes live.

### Step 1: Verify parity
Shadow output matches n8n output for all 14 scenarios.

### Step 2: Disable old sender
Deactivate n8n workflow `TDBSUDxpcW8e56y4`.
**Rollback:** Re-enable the n8n workflow (30 seconds in n8n UI).

### Step 3: Enable live sending
Set `SHADOW_MODE=false`, restart service.

### Step 4: Verify live
- [x] Status4 change on controlled live item → Intercom reply appears
- [x] No duplicate emails from the old n8n sender
- [ ] Monitor 48 hours

### Step 5: Disable broken automations
**Prerequisite:** Ricky confirms destination URLs in Monday UI.
- If 537444955 confirmed dead/to-Cloudflare → disable
- If 530471762 confirmed dead/to-Cloudflare → disable
- [ ] Automation token usage drops

---

## Phase 3 — Cleanup (after 1 week stable)

1. Cloudflare Worker `icorrect-macros`: keep alive for now (also handles item_created + email_updated). Deactivate the status notification path only when fully proven.
2. n8n workflow `TDBSUDxpcW8e56y4`: already disabled in Phase 2. Keep for reference.

---

## Files Modified/Created

| Action | File |
|--------|------|
| CREATE | `/home/ricky/builds/monday/services/status-notifications/index.js` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/templates.js` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/package.json` |
| CREATE | `/home/ricky/builds/monday/services/status-notifications/status-notifications.service` |
| CREATE | `~/.config/systemd/user/status-notifications.service` |
| EDIT | `/etc/nginx/sites-enabled/mission-control` (add 1 location block) |
| EDIT | `/home/ricky/builds/monday/services/status-notifications/index.js` (board guard added 2026-03-31) |

## Compromises

- **No retry queue** — failures after 200 ACK logged + Slack alerted, not retried. Same pattern as bm-shipping, bm-payout, icloud-checker.
- **Templates hardcoded in JS** — matches current n8n approach.
- **item_created + email_updated not migrated** — Cloudflare Worker stays alive for those paths. Only status notifications move to VPS.
- **Gophr Time Window kept** — column `text_mm084vbh` marked for DROP in board audit, but Gophr automations being built this week.

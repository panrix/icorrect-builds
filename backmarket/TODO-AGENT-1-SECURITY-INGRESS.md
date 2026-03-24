# TODO: Agent 1 — Security & Ingress Hardening

**Owner:** Code
**Canonical plan:** `PLAN-BM-REBUILD-MASTER.md` Phase 1
**Blocks:** All other agents (no live rollout until ingress is secured)

---

## Scope

- Webhook binding to `127.0.0.1`
- Nginx route design for all BM and icloud-check endpoints
- Confirmation of live ingress paths
- Service/port map
- Health-check and restart/runbook notes

## NOT in scope

- Business logic changes (payout, shipping, listing, pricing, buyback)
- Shared library build (separate task, but should follow immediately after)
- KB writing beyond infra facts

---

## Step 1: Map current-state ingress

- [ ] List every port bound to `0.0.0.0` (public) vs `127.0.0.1` (local)
- [ ] Identify the process behind each port (PID, service name, systemd unit or PM2)
- [ ] List every nginx `location` block and where it proxies to
- [ ] Identify which Monday webhook URLs are configured on boards 349212843 and 3892194968
- [ ] Identify the Slack interactivity URL (which port/path receives Slack button clicks)
- [ ] Check what's on port 8003 (nginx proxies Slack interact there — audit flagged this)
- [ ] Check if any cron jobs or scripts send directly to public IP endpoints
- [ ] Document: what is live now vs what is only planned

**Deliverable:** Current-state ingress map (table: port, bind address, process, nginx route, public reachable yes/no)

---

## Step 2: Define target-state ingress

- [ ] Define target port allocation for all BM webhook services:
  - 8010: icloud-checker (intake) — existing
  - 8011: bm-grade-check — future (Phase 4 of master plan)
  - 8012: bm-payout — future (Phase 5)
  - 8013: bm-shipping — future (Phase 6)
- [ ] Define nginx route map for all `/webhook/bm/*` and `/webhook/icloud-check/*` paths
- [ ] Define which routes exist TODAY vs which are placeholders for future services
- [ ] Define Monday webhook URL targets (all must go through `https://mc.icorrect.co.uk/...`)
- [ ] Define Slack interactivity URL target

**Deliverable:** Target-state ingress map (table: port, bind, service, nginx route, Monday webhook trigger)

---

## Step 3: Identify concrete file changes

- [ ] `icloud-checker/src/index.js` line 1907 — change `app.listen(PORT)` to `app.listen(PORT, '127.0.0.1')`
- [ ] Nginx config — add proxy routes for `/webhook/bm/grade-check`, `/webhook/bm/payout`, `/webhook/bm/shipping-confirmed`
- [ ] Nginx config — confirm existing route for `/webhook/icloud-check` is correct
- [ ] Nginx config — resolve the port 8003 Slack interact routing question
- [ ] systemd unit for icloud-checker — confirm `EnvironmentFile` and `WorkingDirectory` are correct
- [ ] Any other services bound to `0.0.0.0` that should be locked down (audit flagged: 18789, 8765, 4174, 4175, 5678, 3001)
- [ ] List any hardcoded `http://46.225.53.159:8010` references in scripts or Monday webhooks

**Deliverable:** Exact list of file changes with before/after for each

---

## Step 4: Identify blockers and unknowns

- [ ] Can we check Monday webhook URLs via API, or must it be done manually in the web UI?
- [ ] Which Slack app's interactivity URL needs updating?
- [ ] Is port 8003 a Python router that forwards to 8010? Or something else?
- [ ] Are there any other services that depend on the public IP binding (external integrations, n8n, etc.)?
- [ ] Will binding to `127.0.0.1` break anything that currently works?

**Deliverable:** Blockers list with resolution path for each

---

## Step 5: Define safe rollout order

- [ ] Write rollout sequence:
  1. Add nginx routes first (before changing bindings — so traffic has a path)
  2. `sudo nginx -t` to validate config
  3. `sudo systemctl reload nginx`
  4. Update Monday webhook URLs from `http://IP:8010/...` to `https://mc.icorrect.co.uk/...`
  5. Verify Monday webhooks fire through nginx (test with a status change)
  6. Bind icloud-checker to `127.0.0.1`
  7. Restart icloud-checker
  8. Verify public IP is refused: `curl http://46.225.53.159:8010/...`
  9. Verify nginx path works: `curl https://mc.icorrect.co.uk/webhook/bm/payout`
- [ ] Define rollback plan if something breaks
- [ ] Schedule during quiet hours (Ricky is UTC+8, London team UTC+0)

**Deliverable:** Numbered rollout steps with verification command after each

---

## Step 6: Apply changes

- [ ] Execute rollout steps in order
- [ ] Verify each step before proceeding to next
- [ ] Confirm all BM webhook endpoints refuse on public IP
- [ ] Confirm all BM webhook endpoints work through nginx
- [ ] Confirm Slack buttons still work (iCloud recheck, counter-offer)
- [ ] Confirm Monday webhooks still fire correctly

---

## Step 7: Document and commit

- [ ] Write `backmarket/docs/INGRESS-MAP.md` with:
  - Port allocation table (current + future)
  - Nginx route table
  - Monday webhook URL table
  - systemd service names and restart commands
  - Health check endpoints
  - How to add a new webhook service (for Agents 2-5)
- [ ] Commit all changes
- [ ] Push to remote

---

## Exit Criteria

- [ ] No BM webhook endpoint is reachable on the public IP
- [ ] All traffic goes through nginx with SSL
- [ ] Monday webhooks confirmed firing through new URLs
- [ ] Slack interactivity confirmed working
- [ ] Port/route/service map documented
- [ ] Rollback plan documented
- [ ] Other agents can reference the ingress map to know how to deploy their services

# Cutover Checklist — Monday Status Notifications

## Pre-Cutover

- [x] `status-notifications` code and docs captured in git
- [x] `SHADOW_MODE=true` verified on the running unit before cutover
- [x] All 14 template branches + missing-Intercom-ID skip covered in shadow
- [x] Representative shadow outputs compared against old n8n output
- [x] Monday challenge path tested
- [x] Intercom failure alerting tested
- [ ] Ricky confirms which Monday automation/webhook destinations are safe to disable

## Cutover

1. Disable the old sender first.
   - n8n workflow: `TDBSUDxpcW8e56y4`
   - Do not run old and new live in parallel.
   - Result 2026-04-01: disabled

2. Enable live sending.
   - update the unit so `EnvironmentFile=/home/ricky/config/.env` loads before `Environment=SHADOW_MODE=false`
   - `systemctl --user daemon-reload`
   - `systemctl --user restart status-notifications.service`
   - Result 2026-04-01: completed

3. Verify immediate health.
   - `curl http://127.0.0.1:8014/health`
   - confirm `shadowMode` is `false`
   - check `journalctl --user -u status-notifications.service -n 50 --no-pager`
   - Result 2026-04-01: passed

## Post-Cutover

- [x] Trigger one known-safe `status4` change and confirm the Intercom reply appears
- [x] Confirm no duplicate message from n8n
- [ ] Watch logs for 48 hours
- [ ] Confirm no unexpected failures or Slack alerts

## Rollback

1. Re-enable n8n workflow `TDBSUDxpcW8e56y4`
2. Set `SHADOW_MODE=true` after `EnvironmentFile=` in the unit so it wins
3. `systemctl --user daemon-reload`
4. `systemctl --user restart status-notifications.service`

## Notes

- The service had full shadow coverage before cutover and completed a controlled live smoke send on 2026-04-01.
- Monday board automations can move items between groups when statuses change; live verification should account for that.

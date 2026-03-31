# Cutover Checklist — Monday Status Notifications

## Pre-Cutover

- [ ] `status-notifications` code and docs captured in git
- [ ] `SHADOW_MODE=true` verified on the running unit
- [ ] All 14 template branches + missing-Intercom-ID skip covered in shadow
- [ ] Representative shadow outputs compared against old n8n output
- [ ] Monday challenge path tested
- [ ] Intercom failure alerting tested
- [ ] Ricky confirms which Monday automation/webhook destinations are safe to disable

## Cutover

1. Disable the old sender first.
   - n8n workflow: `TDBSUDxpcW8e56y4`
   - Do not run old and new live in parallel.

2. Enable live sending.
   - change `SHADOW_MODE=true` to `SHADOW_MODE=false` in `~/.config/systemd/user/status-notifications.service`
   - `systemctl --user daemon-reload`
   - `systemctl --user restart status-notifications.service`

3. Verify immediate health.
   - `curl http://127.0.0.1:8014/health`
   - confirm `shadowMode` is `false`
   - check `journalctl --user -u status-notifications.service -n 50 --no-pager`

## Post-Cutover

- [ ] Trigger one known-safe `status4` change and confirm the Intercom reply appears
- [ ] Confirm no duplicate message from n8n
- [ ] Watch logs for 48 hours
- [ ] Confirm no unexpected failures or Slack alerts

## Rollback

1. Re-enable n8n workflow `TDBSUDxpcW8e56y4`
2. Set `SHADOW_MODE=true`
3. `systemctl --user daemon-reload`
4. `systemctl --user restart status-notifications.service`

## Notes

- The service now has full shadow coverage, but live cutover still depends on final parity confidence and ops signoff.
- Monday board automations can move items between groups when statuses change; live verification should account for that.

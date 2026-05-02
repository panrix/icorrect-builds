# Todo — Monday Status Notifications

**Date:** 2026-04-01
**Status:** Live cutover completed. VPS sender is live, old n8n sender is disabled, and one controlled live Intercom reply was verified. Remaining work is monitoring and final ops cleanup.

## Current State

- Service path: `/home/ricky/builds/monday/services/status-notifications/`
- systemd unit: `~/.config/systemd/user/status-notifications.service`
- nginx route: `POST /webhook/monday/status-notification`
- Runtime mode: `SHADOW_MODE=false`

Completed:

- code written
- nginx and systemd wired
- board guard added
- shadow traffic observed from real production events
- all 14 template branches exercised
- missing-Intercom-ID skip path exercised
- challenge response path exercised
- failure alert path exercised and Slack alert observed
- representative shadow output compared against the legacy template source
- old n8n sender `TDBSUDxpcW8e56y4` disabled
- live systemd cutover completed on 2026-04-01
- one controlled live `ready-walkin` send verified in Intercom
- temporary Monday test items cleaned up

Reference docs:

- `plan-status-notifications.md`
- `verification/status-notifications-shadow-verification-2026-03-31.md`
- `verification/status-notifications-live-cutover-2026-04-01.md`
- `cutover-checklist-status-notifications.md`

## Remaining After Cutover

1. Monitor logs and Slack alerts for 48 hours.
2. Watch for duplicate or missed notifications on real production events.
3. Confirm whether the disposable Intercom smoke-test conversation should be manually closed.
4. Review only the remaining legacy catch-all webhooks in the Monday UI.

## Cutover Record

1. Disable old n8n sender:
- `TDBSUDxpcW8e56y4` is now disabled

2. Enable live sending:
- fix unit precedence so `EnvironmentFile=/home/ricky/config/.env` loads before `Environment=SHADOW_MODE=false`
- `systemctl --user daemon-reload`
- `systemctl --user restart status-notifications.service`

3. Verify immediately:
- `curl http://127.0.0.1:8014/health`
- confirmed `shadowMode` is `false`
- inspect `journalctl --user -u status-notifications.service -n 50 --no-pager`

4. Run one controlled live smoke test and confirm:
- disposable Monday item `11647225955`
- disposable Intercom conversation `215473729031128`
- service log: `✓ Sent ready-walkin for item 11647225955 to conversation 215473729031128`
- expected Intercom reply content observed: `your device is ready for collection`
- no duplicate from n8n, because the old workflow remains disabled

5. Monitor for 48 hours:
- logs
- Slack alerts
- duplicates
- missed notifications

## Rollback

1. Re-enable n8n workflow `TDBSUDxpcW8e56y4`
2. Set `SHADOW_MODE=true` after the shared env file line in the unit so it wins
3. Reload and restart the user unit

## Post-Cutover

After Monday is stable:

1. Review Monday automation destinations in the Monday UI.
2. Status notification token-burners were remapped on 2026-04-08:
   - `530471762` removed
   - exact `status4` hooks now handle only the six live notification statuses
3. Parts token-burner `537444955` was also replaced on 2026-04-08 by a `Parts Used`-only hook:
   - see `verification/parts-webhook-remap-2026-04-08.md`
4. Confirm automation usage drops.
5. Review the remaining legacy catch-all webhooks:
   - `349863361`
   - `349863952`
   - `350113039`

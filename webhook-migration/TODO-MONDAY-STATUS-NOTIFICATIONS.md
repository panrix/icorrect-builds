# Todo — Monday Status Notifications

**Date:** 2026-03-31
**Status:** Shadow service implemented and fully branch-covered. Not yet cut over to live Intercom sending.

## Current State

- Service path: `/home/ricky/builds/monday/services/status-notifications/`
- systemd unit: `~/.config/systemd/user/status-notifications.service`
- nginx route: `POST /webhook/monday/status-notification`
- Runtime mode: `SHADOW_MODE=true`

Completed:

- code written
- nginx and systemd wired
- board guard added
- shadow traffic observed from real production events
- all 14 template branches exercised
- missing-Intercom-ID skip path exercised
- temporary Monday test items cleaned up

Reference docs:

- `plan-status-notifications.md`
- `status-notifications-shadow-verification-2026-03-31.md`
- `cutover-checklist-status-notifications.md`

## Remaining Before Cutover

1. Capture the Monday service and docs in git.

2. Test the Monday challenge path.
- POST `{"challenge":"test"}`
- confirm response echoes the challenge

3. Simulate Intercom failure.
- confirm Slack alerting fires
- confirm service logs the failure cleanly

4. Compare shadow output to old n8n output.
- use representative cases across the observed routes
- confirm body content and routing parity

5. Keep the service in shadow mode until steps 1-4 are signed off.

## Cutover Steps

1. Disable old n8n sender:
- `TDBSUDxpcW8e56y4`

2. Enable live sending:
- change `SHADOW_MODE=true` to `SHADOW_MODE=false`
- `systemctl --user daemon-reload`
- `systemctl --user restart status-notifications.service`

3. Verify immediately:
- `curl http://127.0.0.1:8014/health`
- confirm `shadowMode` is `false`
- inspect `journalctl --user -u status-notifications.service -n 50 --no-pager`

4. Trigger one safe real status change and confirm:
- one Intercom reply appears
- no duplicate from n8n appears

5. Monitor for 48 hours:
- logs
- Slack alerts
- duplicates
- missed notifications

## Rollback

1. Re-enable n8n workflow `TDBSUDxpcW8e56y4`
2. Set `SHADOW_MODE=true`
3. Reload and restart the user unit

## Post-Cutover

After Monday is stable:

1. Review Monday automation destinations in the Monday UI.
2. Only then disable token-burner automations:
   - `537444955`
   - `530471762`
3. Confirm automation usage drops.

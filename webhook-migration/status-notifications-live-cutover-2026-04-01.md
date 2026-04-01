# Status Notifications Live Cutover — 2026-04-01

## Result

The Monday status-notifications VPS service is now live.

- old n8n workflow `TDBSUDxpcW8e56y4` is disabled
- `status-notifications.service` is running with `SHADOW_MODE=false`
- `GET /health` reports `shadowMode: false`
- one controlled live Intercom reply was sent successfully through the VPS path

## 1. Old Sender Disabled

Verified through the n8n Cloud API:

- workflow: `TDBSUDxpcW8e56y4`
- name: `Status Notifications → Intercom Email`
- `active: false`

## 2. Runtime Cutover

The first restart attempt exposed an ops issue:

- the live unit was loading `/home/ricky/config/.env`
- `SHADOW_MODE=false` had been placed before `EnvironmentFile=`
- the running Node process still inherited `SHADOW_MODE=true`

Fix applied:

- reorder the unit so `EnvironmentFile=/home/ricky/config/.env` loads first
- keep `Environment=SHADOW_MODE=false` after it so the live setting wins deterministically

Verified after restart:

- service log: `Listening on 127.0.0.1:8014 (shadow=false)`
- process env: `SHADOW_MODE=false`
- health response: `{"status":"ok","service":"status-notifications","shadowMode":false,"port":8014,...}`

## 3. Controlled Live Smoke Test

Method:

- created one disposable Intercom user contact
- created one disposable Intercom conversation from that user
- created one disposable Monday item in one disposable Monday group
- set service to `Walk-In`
- set client type to `End User`
- set the Intercom conversation ID into `text_mm087h9p`
- changed `status4` to `Ready To Collect`

Observed service log:

- ` → Ready To Collect for item 11647225955`
- `✓ Sent ready-walkin for item 11647225955 to conversation 215473729031128`

Observed Intercom result:

- the conversation received the expected `ready-walkin` reply
- verified snippet: `your device is ready for collection`

Cleanup:

- disposable Monday item deleted
- disposable Monday group deleted
- Intercom smoke-test conversation remains as evidence and can be ignored or closed manually if desired

## 4. Remaining

The cutover itself is complete. Remaining work is operational:

1. monitor logs and Slack alerts for 48 hours
2. confirm no duplicate or missed production notifications
3. review Monday automation destinations before disabling token-burner automations

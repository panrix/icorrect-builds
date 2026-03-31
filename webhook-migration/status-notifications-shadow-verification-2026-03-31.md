# Status Notifications Shadow Verification — 2026-03-31

## Scope

Verify the VPS shadow service at `/home/ricky/builds/monday/services/status-notifications/` across every template branch plus the missing-Intercom-ID skip path.

## What Was Tested

Existing natural shadow traffic had already covered:

- `received-walkin`
- `received-remote`
- `booking-confirmed`
- `booking-confirmed-warranty`
- `ready-walkin`
- `return-courier`

Synthetic Monday test items were then created on 2026-03-31 to cover:

- `courier-gophr` standard
- `courier-gophr` corporate
- `courier-mailin` standard
- `courier-mailin` corporate
- `courier-warranty`
- `ready-warranty`
- `password-request`
- `password-request-empty`
- `return-courier-warranty`
- `return-courier-gophr`
- missing `Intercom ID` skip

## Result

Shadow coverage is now complete.

- All 14 expected webhook types have been observed in `/home/ricky/logs/status-notifications-shadow.jsonl`.
- The missing-Intercom-ID path logged `Item 11637106855 has no Intercom ID — skipping notification`.
- Conditional template behavior behaved correctly:
  - Gophr/mail-in standard includes the Typeform link
  - Gophr/mail-in corporate suppresses the Typeform link
  - password-with-code includes the supplied passcode
  - password-empty uses the empty-password variant
  - return Gophr includes the Gophr link and time window

## Artefacts Created

- Monday test group: `Codex Shadow Tests 2026-03-31` (`group_mm1zqk9t`)
- Intercom test contact: `69cbaa67a0e4040f9d675c8f`
- Intercom seed conversation: `215473713876517`

## Cleanup

- 11 synthetic Monday test items were deleted after verification.
- The temporary Monday test group no longer appears in the board query.
- The Intercom test contact was deleted.
- The Intercom seed conversation could not be deleted through the current API version and may need to be ignored or closed manually in Intercom.

## Observation

Some synthetic items were automatically moved into operational groups such as `Outbound Shipping` and `Awaiting Collection` when their statuses changed. That shows board automations remain active during test runs, so future live testing should assume status-driven group movement.

## Remaining Before Live Cutover

1. Capture the service and docs in git.
2. Compare representative shadow outputs against the old n8n output.
3. Test the Monday challenge path.
4. Simulate an Intercom failure and confirm Slack alerting.
5. Keep `SHADOW_MODE=true` until the above is signed off.

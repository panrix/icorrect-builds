# Status Notifications Pre-Cutover Checks — 2026-03-31

## Result

The final local checks before Monday live cutover were completed.

## 1. Challenge Path

Request:

```json
{"challenge":"codex-test-2026-03-31"}
```

Response:

```json
{"challenge":"codex-test-2026-03-31"}
```

Service log evidence:

- `Challenge received`

## 2. Failure Alert Path

Method:

- created one disposable Monday item with a bogus Intercom conversation ID: `999999999999999`
- changed `status4` to `Ready To Collect`
- observed the service error path
- queried Slack channel history for the configured status-notification alert channel

Observed service error:

- `Intercom GET /conversations/999999999999999 failed: 404`

Observed Slack message:

- `:x: Status notification error: Intercom GET /conversations/999999999999999 failed: 404`

Cleanup:

- disposable failure-test item deleted
- disposable failure-test group no longer appears in the board query

## 3. Representative Parity Check

Representative shadow outputs were compared against the legacy template source in:

- `/home/ricky/builds/monday/icorrect-status-notification-documentation.md`

Checked cases:

- `courier-gophr`
- `courier-mailin`
- `courier-warranty`
- `ready-warranty`
- `password-request`
- `password-request-empty`
- `return-courier-warranty`
- `return-courier-gophr`

Result:

- rendered HTML matches the legacy copy and conditional behavior for the representative set
- corporate suppression of Typeform links behaved correctly
- standard paths included the Typeform links where expected
- password-with-code and password-empty split correctly
- Gophr return path preserved both tracking link and time window

## Remaining

The Monday track no longer has unresolved verification gaps in the local workspace.

What remains is operational:

1. disable old n8n sender `TDBSUDxpcW8e56y4`
2. set `SHADOW_MODE=false`
3. restart the service
4. verify the first live event
5. monitor for duplicates or misses

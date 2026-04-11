# Parts Webhook Remap — 2026-04-08

## Result

The Monday parts flow was remapped off the broad catch-all webhook and onto the minimum trigger set needed for the existing VPS parts service.

## Live Parts Webhooks

Current parts-related webhook set on board `349212843`:

| Webhook ID | Event | Column / Filter | Purpose |
|---:|---|---|---|
| `520364311` | `change_status_column_value` | `color_mkzkats9` = index `1` | `Parts Deducted` -> `Do Now!` |
| `526854222` | `change_specific_column_value` | `board_relation_mm01yt93` | `Parts Required` flow |
| `562164741` | `change_specific_column_value` | `connect_boards__1` | `Parts Used` flow to VPS parts service |

All three remain live.

## Removed Webhook

Deleted during the remap:

| Webhook ID | Reason |
|---:|---|
| `537444955` | Broad `When any column changes, send a webhook` rule for the parts flow. It was burning actions on unrelated board edits. |

## Verified

Controlled live verification on 2026-04-08:

- disposable item: `11697491828`
- disposable group: `group_mm27p3em`
- test part: `6220432084` (`LCD - A2337`)
- observed webhook subscription after remap: `699420069`

Observed parts-service log sequence:

- `webhook_raw` for `columnId: "connect_boards__1"`
- `processing_changes` with `addedCount: 1`
- `quantity_updated` from `18` -> `17`
- `part_deducted`
- `changes_complete`
- second `webhook_raw` for unlink
- `processing_changes` with `removedCount: 1`
- `quantity_updated` from `17` -> `18`
- `part_restoreed`
- `changes_complete`

The parts board stock for item `6220432084` was back at `18` after the restore check.

## Telegram Note

Telegram notifications are sent by the VPS parts service itself in `icorrect-parts-service/src/notify.js` during the deduction and restore code path. There is no separate Monday webhook for Telegram.

No Telegram warning was logged during the verification run.

## Cleanup

- disposable item `11697491828` deleted
- disposable group `group_mm27p3em` no longer appears on the board after cleanup
- direct `delete_group` / `archive_group` attempts with the current app token returned `USER_UNAUTHORIZED`

## Remaining Review

This remap removes the known parts action-burner.

Still worth reviewing separately on the board:

- legacy catch-all webhooks `349863361`, `349863952`, `350113039`
- whether `520364311` and `526854222` are still both required in their current form

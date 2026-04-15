# Changelog: Customer Reply Re-Alert (2026-04-13)

## Problem

When a triage card was posted to Telegram and sat in `pending` review, any subsequent customer replies in Intercom were silently dropped. The `evaluateEmailTriageCandidate` function treated a conversation with an existing `telegram_message_id` as fully processed, without checking whether new Intercom activity had occurred after the card was posted. This meant an unanswered email could receive a follow-up reply from the customer and never resurface for attention.

**Observed case:** Conversation 215473794365328 (Liebman, iPad Pro charging port) was triaged on 2026-04-08. The customer replied again around 2026-04-11. Every subsequent incremental check logged `[excluded] reason=exclude_already_processed` for that conversation.

## Fix

### `lib/triage.js` — `evaluateEmailTriageCandidate`

Added an early-out check inside the `hasProcessedState` branch. Before returning `exclude_already_processed`, the function now compares:

- **Intercom `updated_at`** (when Intercom last recorded activity on the conversation)
- **DB `updated_at`** (when Alex last updated the local record)

If the Intercom timestamp is strictly newer, and the conversation has not yet been sent or skipped (`sent_at` and `intercom_sent_at` are both null), the function returns `flag_new_activity` instead of `exclude_already_processed`.

### `scripts/inbox-triage.js`

Added handling for the `flag_new_activity` decision reason in the per-conversation loop:

- Logs `[new_activity]` instead of `[excluded]` so the event is visible in cron logs.
- Re-posts the **existing** Telegram card (no re-classification or draft regeneration) with a `💬 Customer replied` state label.
- Calls `updateConversationAfterTelegramPost` to update the DB `updated_at` and the new `telegram_message_id`, preventing the same activity from triggering a second re-post on the next check cycle.
- Resets status to `pending` so the card enters the normal review queue.
- Increments `postedCount` so the checkpoint advances correctly.

`updateConversationStatus` was added to the db.js import list.

## Behaviour After This Change

| Scenario | Before | After |
|---|---|---|
| Customer replies after card posted, card still pending | Silently excluded | Re-posts card with "💬 Customer replied" banner |
| Customer replies after email already sent | Excluded | Excluded (sent_at is set) |
| Customer replies after card skipped | Excluded | Excluded (intercom_sent_at is set for skips — if not, re-posts) |
| No new activity since last DB update | Excluded (same as before) | Excluded |
| Same activity triggers on next check | N/A | Excluded — DB updated_at is now ≥ Intercom updated_at |

# Alex Triage Rebuild TODO

Source of truth: `BUILD-BRIEF.md` — read that for full context and specs.
This file is for tracking progress only.

## Batch 0: Setup

- [x] Initialize `package.json`
- [x] Use Node 22 built-ins for SQLite, HTTP/OpenAI calls, Telegram bot handling, HTTP service, and env loading
- [x] Create project directories: `scripts/`, `services/`, `web/`, `lib/`, `data/`, `docs/`
- [x] Add startup env validation for `INTERCOM_API_TOKEN`, `MONDAY_APP_TOKEN`, `TELEGRAM_BOT_TOKEN`, `OPENROUTER_API_KEY`

## Batch 1: Core Libraries

- [x] Implement `lib/db.js`
- [x] Create SQLite schema for `conversations`
- [x] Create SQLite schema for `edits`
- [x] Create SQLite schema for `runs`
- [x] Create SQLite schema for `checkpoints`
- [x] Implement `lib/intercom.js`
- [x] Implement Intercom conversation fetch helpers
- [x] Implement Intercom reply send helper
- [x] Implement Intercom note/tag helpers if required
- [x] Implement `lib/monday.js`
- [x] Implement Monday lookup by email
- [x] Implement Monday lookup by Intercom ID
- [x] Implement Monday item creation helper
- [x] Implement Monday update note helper
- [x] Implement `lib/telegram.js`
- [x] Implement Telegram post/edit helpers
- [x] Implement callback payload handling
- [x] Implement `lib/draft.js`
- [x] Implement Qwen via OpenRouter client

## Batch 2: Inbox Pull

- [x] Build `scripts/inbox-triage.js` orchestration flow
- [x] Pull open Intercom conversations
- [x] Handle Intercom pagination
- [x] Include all supported inbound channels: `email`, `chat`, `instagram`, `whatsapp`
- [x] Filter admin-last-message conversations
- [x] Filter tagged spam conversations
- [x] Filter snoozed conversations
- [x] Filter supplier/spam pattern conversations
- [x] Implement `--mode=morning`
- [x] Implement `--mode=check`
- [x] Read `checkpoints.last_successful_check_at`
- [x] Write `checkpoints.last_successful_check_at` after successful check runs
- [x] Record run metadata in `runs`

## Batch 3: Monday Enrichment

- [x] Build `scripts/monday-enrich.js`
- [x] Match by `text5` email first
- [x] Fall back to `text_mm087h9p` Intercom ID
- [x] Pull `status` as `client_status`
- [x] Pull `board_relation5` as `device_model`
- [x] Pull `board_relation` as `repair_type`
- [x] Pull `payment_status` as `payment_status`
- [x] Return explicit unmatched state instead of guessing

## Batch 4: Shopify Pricing

- [x] Build `scripts/shopify-pricing.js`
- [x] Pull Shopify product data
- [x] Normalize to `data/pricing.json`
- [x] Implement repair price lookup by device plus repair type
- [x] Return `Not in catalogue` when no confident price match exists

## Batch 5: Card Builder

- [x] Build `scripts/card-builder.js`
- [x] Generate structured card JSON
- [x] Populate type
- [x] Populate device
- [x] Populate client status
- [x] Populate payment
- [x] Populate priority
- [x] Populate price
- [x] Populate latest message snippet
- [x] Populate summary / what matters
- [x] Populate context links and thread metadata
- [x] Implement deterministic category classification
- [x] Implement deterministic priority rules
- [x] Persist conversation/card state to SQLite
- [x] Save immutable daily JSON to `data/triage-YYYY-MM-DD.json`

## Batch 6: Draft Generation

- [x] Compile `data/ferrari-context.md` from source docs
- [x] Create `data/learned-rules.md`
- [x] Build prompt assembly using card data, recent messages, Ferrari context, learned rules, and pricing data
- [x] Generate drafts with Qwen via OpenRouter
- [x] Store `original_draft`
- [x] Store current `draft_text`

## Batch 7: Telegram Delivery

- [x] Build `services/telegram-bot.js`
- [x] Post cards plus draft replies to the Telegram topic
- [x] Add inline buttons: `Send`, `Edit`, `Skip`
- [x] Implement status transition `pending -> sending -> sent`
- [x] Prevent duplicate sends
- [x] On send, post Intercom reply
- [x] On send, create Monday item for new enquiries with no match
- [x] On send, attach Intercom ID/link for new Monday items
- [x] On send, add Monday update note for matched items
- [x] On send, add required note/tag context for complaint/warranty/Ferrari-routed cases
- [x] If Monday write fails, do not mark as fully sent
- [x] Implement `Skip` flow

## Batch 8: Mini App Editing

- [x] Build `web/edit.html`
- [x] Build `web/edit.js`
- [x] Build `web/edit.css`
- [x] Serve Mini App via HTTP service on port `8020`
- [x] Implement `GET /api/draft/{conversation_id}`
- [x] Implement `POST /api/draft/{conversation_id}`
- [x] Validate Telegram `initData` HMAC
- [x] Update `draft_text` on submit
- [x] Store `original_draft`, `edited_draft`, and `reason` in `edits`
- [x] Update Telegram message after edit

## Batch 9: Learning Loop

- [x] Build `scripts/learning-run.js`
- [x] Pull unprocessed edits
- [x] Compute structured diffs
- [x] Group edits by tone, phrasing, factual, and structural patterns
- [x] Run Qwen extraction pass for learned rules
- [x] Append dated rule sections to `data/learned-rules.md`
- [x] Mark processed edits as consumed
- [x] Make learning reruns idempotent

## Batch 10: Deployment

- [x] Add cron for morning triage
- [x] Add cron for 15-minute checks
- [x] Add cron for Shopify pricing refresh
- [x] Add cron for weekly learning run
- [x] Add systemd user service for Telegram bot + Mini App
- [x] Add nginx reverse proxy for `alex.icorrect.co.uk` to `127.0.0.1:8020`
- [x] Add restart and failure logging strategy

## Batch 11: Verification

- [ ] Compare morning output against manual Intercom inbox review
- [ ] Verify 10 Monday matches manually
- [ ] Verify 10 Shopify price lookups manually
- [ ] Review sample cards with Ferrari
- [ ] Compare 5 Qwen drafts against real Ferrari replies
- [ ] Test full send path: Telegram -> Intercom -> Monday side effect -> SQLite
- [x] Test full edit path: Mini App open -> edit submit -> Telegram update -> SQLite edit record
- [x] Test duplicate-click protection on send
- [x] Test partial failure when Monday write fails after Intercom send
- [ ] Test cron execution
- [ ] Test bot service restart behavior
- [ ] Test Mini App over HTTPS

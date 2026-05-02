# Phase 2: Quote Building — Build Brief

**Date:** 2026-04-13
**Owner:** Code
**Status:** Not started — Phase 1 gateway blocker must be resolved first
**Depends on:** Phase 1 (alex-triage-rebuild) infrastructure

---

## Context

Ferrari is the sole person who writes and sends diagnostic quotes. The current process:

1. Saf completes a diagnostic, marks the Monday item as "Diagnostic Complete"
2. Ferrari is notified of the status change
3. Ferrari reviews diagnostic notes, drafts the quote (using AI), sends via email through Intercom
4. Ferrari copies the quote text into the Monday item as a record

This build automates steps 2-3: detect the status change, pull diagnostic data, draft the quote using the quote-building SOP, and post to Telegram for Ferrari to review, edit, and send — same flow as Phase 1 email triage.

---

## Architecture

Reuses Phase 1 infrastructure. No new services needed.

```
Monday status → "Diagnostic Complete"
  → quote-triage.js polls for items with this status (cron, every 15 min)
  → Pull from Monday item:
      - Customer name
      - Device (board_relation5 → Devices Board)
      - Requested Repairs (board_relation → Products & Pricing Board 2477699024)
      - Custom Products (board_relation0 → Custom Products Board 4570780706)
      - Diagnostic notes (update notes on the item)
      - Technician who completed diagnostic
  → Classify each fault: mandatory vs optional (from diagnostic notes)
  → Pricing lookup:
      - Standard catalogue repairs → Products & Pricing Board (2477699024)
      - Logic board repairs → leave price blank (Michael fills manually)
  → Draft quote email using Qwen + quote-building SOP as prompt
  → Post to Telegram Quotes topic (thread 775) with card + draft
  → Ferrari reviews in Telegram:
      - Edit → fill in missing prices/turnaround, adjust wording → Mini App
      - Approve → send via Intercom, update Monday status to "Quote Sent"
      - Escalate → route to Ricky (disputes, discount decisions)
```

---

## Key Decisions

- **Same Telegram review flow as Phase 1** — approve/edit/escalate/snooze buttons
- **Edit is the primary action** — unlike email triage where most cards are approve-ready, quote cards will often need Ferrari to fill in logic board pricing and turnaround time before sending
- **Quotes topic thread 775** — separate from email triage thread 774. Config already exists: `TELEGRAM_QUOTES_THREAD_ID`
- **Pricing from Monday, not Shopify** — standard repair pricing lives on Products & Pricing Board (2477699024). Shopify pricing is for email triage price references only
- **Logic board pricing always blank** — only non-catalogue repair type. Michael provides these manually
- **No turnaround times in draft** — SOP says leave blank, Michael fills in. Draft should have the placeholder visible so Ferrari knows to add it
- **Poll-based, not webhook** — same pattern as Phase 1. Cron checks for "Diagnostic Complete" items every 15 minutes during working hours
- **Date gate** — only pick up items marked "Diagnostic Complete" in the last 7 days. Skip items already processed in SQLite

---

## Quote Card Format

```
━━━ QUOTE CARD ━━━━━━━━━━━━━━━━━━━━━━━
Device: [device model + variant]
Customer: [name]
Technician: [who completed diagnostic]
Monday: #[item ID] "[item name]"
Link: [Monday item URL]

━ DIAGNOSTIC NOTES ━
[Saf's diagnostic notes — verbatim or summarised]

━ FAULTS FOUND ━
[Structured per SOP Section 3 — one block per fault]

━ PRICING ━
Required Repairs:
- [repair]: £[price from Products & Pricing] or [NEEDS PRICING]
Optional Repairs:
- [repair]: £[price] or [NEEDS PRICING]

━━ DRAFT QUOTE EMAIL ━
[Full quote email following SOP skeleton]

[✅ Approve] [✏️ Edit] [⚠️ Escalate] [💤 Snooze]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Confidence tiers:**
- 🟢 Ready — all catalogue repairs, all prices resolved, no ambiguous faults
- 🟡 Needs review — logic board repair (price blank), ambiguous fault classification, missing diagnostic detail
- 🔴 Escalate — dispute/complaint context, customer pushback history, discount request beyond Ferrari's authority

---

## Draft Generation

### Prompt structure

```
You are Alex, customer service at iCorrect. Draft a diagnostic quote email.

=== QUOTE BUILDING SOP (follow exactly) ===
[Full quote-building-sop.md — skeleton, 6-step fault pipeline, hard rules, tone]

=== LEARNED CORRECTIONS ===
[learned-rules.md — auto-generated from Ferrari's quote edits]

=== THIS ITEM ===
Customer: [name]
Device: [model + variant]
Diagnostic notes: [from Monday item]

Faults:
1. [fault] — [mandatory/optional] — [symptom] — [repair action]
2. ...

Pricing:
- [repair]: £[price] (from catalogue)
- [repair]: [LEAVE BLANK — non-catalogue, Michael will provide]

=== INSTRUCTIONS ===
Draft the full quote email following the SOP exactly.
- Use the 6-step pipeline for every fault in the Faults Found section.
- Mandatory faults first, then optional.
- Leave price fields blank where marked. Leave turnaround time blank.
- Do not confirm any repair has been completed. Always future tense.
- No chip names, IC names, or component references.
- Sign off as "Kind regards, Alex".
- Output ONLY the email text. No preamble, no explanation.
```

### Fallback drafts

When Qwen times out or returns malformed output:
- Generate a minimal quote skeleton with device, customer name, and fault list populated
- Mark clearly as "[DRAFT GENERATION FAILED — manual draft required]"
- Still post to Telegram so Ferrari can use the Edit flow

---

## Monday Data Extraction

### Item fields to pull

| Monday Column | Column ID | What it gives us |
|---|---|---|
| Device | `board_relation5` | Device model via linked Devices Board item |
| Requested Repairs | `board_relation` | Standard repair products via Products & Pricing Board |
| Custom Products | `board_relation0` | Non-standard repairs via Custom Products Board |
| Customer email | `text5` | For Intercom thread matching |
| Customer phone | phone column | Backup matching |
| Status | `status4` | Must be "Diagnostic Complete" |
| Updates/notes | item updates | Saf's diagnostic notes — the raw input |

### Board relation resolution

Per the quote-building SOP hard rule: do not rely on `text` alone for board_relation columns. Always resolve:
- `linked_item_ids`
- `display_value`

Only say a relation is blank if both linked item IDs and display value are empty.

### Pricing lookup

1. Resolve `board_relation` → Products & Pricing Board (2477699024)
2. Pull price from the linked product item
3. If `board_relation` is empty but `board_relation0` (Custom Products) has a linked item → pull price from there
4. If neither has pricing → mark as `[NEEDS PRICING]` (logic board / non-catalogue)

---

## Action Handlers

### ✅ Approve
- Send quote email to customer via Intercom (as admin 9702337)
- Update Monday item status to "Quote Sent"
- Add Monday update note with the quote text sent
- Update SQLite: status → `sent`, `sent_at` recorded
- Edit Telegram card to "✅ Sent [timestamp]"

### ✏️ Edit
- Opens Mini App (same as Phase 1)
- Ferrari fills in: missing prices, turnaround time, wording adjustments
- On submit: updated draft saved, original + edited stored in SQLite `edits` table
- Card updates with revised draft + Approve/Skip buttons
- Learning loop picks up edits weekly

### ⚠️ Escalate
- Route to Ricky for: pricing disputes, discount requests beyond Ferrari's authority, complaint context
- Tag Intercom conversation
- Add internal note with escalation context

### 💤 Snooze
- Same as Phase 1: 2h / tomorrow / custom
- Common use: waiting for Michael to provide logic board pricing

---

## What to build

Most infrastructure exists. New/modified files:

| File | Status | What to do |
|---|---|---|
| `scripts/quote-triage.js` | Exists (partial) | Rewrite to use 6-step SOP pipeline, proper pricing lookup, date gate |
| `lib/monday.js` | Exists | Add: resolve board_relation to Products & Pricing Board, pull pricing from linked items |
| `lib/triage.js` | Exists | Add: quote card assembly, quote classification, quote confidence tiers |
| `lib/draft.js` | Exists | Add: quote prompt template using quote-building SOP |
| `data/quote-building-sop.md` | New | Copy from alex-cs workspace — the writing spec for quote drafts |
| `data/learned-rules-quotes.md` | New | Separate learning file for quote edits (empty initially) |
| `services/telegram-bot.js` | Exists | Add: route quote callbacks to thread 775, quote-specific approve handler (Monday status → "Quote Sent") |

### Not needed
- No new service — reuses existing bot on port 8020
- No new nginx config
- No new systemd service
- No new Supabase tables (repair history already imported)

---

## Deployment

Add to existing cron:

```cron
# Quote triage check (every 15 min during working hours)
*/15 7-18 * * 1-5 cd /home/ricky/builds/alex-triage-rebuild && ALEX_ENABLE_LIVE_POSTING=1 node scripts/quote-triage.js --mode=check
```

No morning full run needed — quotes are triggered by Monday status change, not Intercom inbox state.

---

## Verification

1. **Status detection** — mark a test item "Diagnostic Complete", verify it's picked up within 15 min
2. **Board relation resolution** — verify device, repairs, and custom products all resolve from linked boards (not just `text`)
3. **Pricing lookup** — verify catalogue prices pull from Products & Pricing Board; logic board items show `[NEEDS PRICING]`
4. **Draft quality** — generate 5 quote drafts, compare against Ferrari's actual quote emails for the same items
5. **6-step pipeline** — verify every fault block in the draft follows all 6 steps in order
6. **Hard rules** — verify no chip names, no past tense, no guessed prices, correct sign-off
7. **Edit flow** — Ferrari fills in missing price + turnaround → sends → Intercom reply + Monday status update
8. **Date gate** — verify items older than 7 days with "Diagnostic Complete" are skipped
9. **Duplicate protection** — verify already-quoted items don't resurface

---

## Quote Rejection Flow (future)

When a client declines the quote (per KB SOP):
1. Monday status → "Quote Rejected"
2. Note added: reassemble the device
3. Assess salvage/buyback value
4. Diagnostic fee charged regardless
5. Device ready for collection → small storage room

This is not in scope for Phase 2 initial build but should be considered for Phase 2.1.

---

## Open Questions

1. **Quote chase automation** — KB SOP flags that quotes have no expiry and no automated chase. Should Phase 2 include a 1-2 week follow-up reminder? Or is that Phase 2.1?
2. **Xero invoice on approval** — KB SOP says invoice is sent manually via Xero after client approves. Is Xero integration in scope or separate?
3. **Products & Pricing Board completeness** — known issue: Shopify IDs are empty on this board. Does the pricing data on the board itself have good coverage, or are there gaps?

---

## Key References

- **Quote-building SOP:** `/home/ricky/.openclaw/agents/alex-cs/workspace/docs/quote-building-sop.md`
- **Quoting process SOP:** `/home/ricky/kb/operations/sop-quoting-process.md`
- **Monday board relationships:** `/home/ricky/kb/monday/board-relationships.md`
- **Products & Pricing Board:** `2477699024`
- **Custom Products Board:** `4570780706`
- **Devices Board:** `3923707691`
- **Main Board:** `349212843`
- **Telegram Quotes thread:** `775` (config: `TELEGRAM_QUOTES_THREAD_ID`)
- **Phase 1 BUILD-BRIEF:** `BUILD-BRIEF.md` (same directory)

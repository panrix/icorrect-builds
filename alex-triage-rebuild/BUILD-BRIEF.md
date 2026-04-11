# Alex Triage Card System — Build Brief

**Date:** 2026-04-07  
**Owner:** Code  
**Consolidated:** 2026-04-08  
**Status:** Ready for Codex implementation  

---

## Context

Ferrari handles all customer communication through Intercom. Currently, Alex (CS agent) runs a monolithic LLM session to triage the entire inbox — slow (10min+ timeouts), expensive (~$0.50/run), and the Telegram output is just links + drafts with no context. Fresh price enquiries sit unanswered until the next morning run.

This build replaces that with a script-first architecture: deterministic inbox pull → enrichment from Monday + Supabase + cached Shopify pricing → LLM drafts only where needed → Ferrari reviews and sends from Telegram with one tap.

**Alex workspace was rebuilt by Cowork on 2026-04-08:** SOUL, CLAUDE, AGENTS, MEMORY trimmed 90%. 4 new skills created (card-review, customer-deep-dive, cs-intelligence, escalation-packager). These load on demand, not at boot, saving context tokens. The triage card system plugs into this lean workspace.

---

## Architecture

One persistent service posting to Telegram topic thread `774` in the Alex group (`-1003822970061`). Future threads for Quotes and Invoices.

```
Cron (06:45 UTC full / every 15min during hours)
  → inbox-triage.js (Intercom pull + noise filter + orchestrator)
  → monday-enrich-v2.js (cascade matching: email → phone → fuzzy → corporate, with confidence)
  → repair-history-lookup.js (Supabase: past repairs by email/phone)
  → shopify-pricing.js (cached pricing.json from daily 05:00 UTC cron — no live API per card)
  → card-builder.js (merge: active repair + past repairs + pricing → triage card)
  → draft-reply.js (Qwen 3.6 Plus via OpenRouter with Ferrari writing library)
  → telegram-post.js (card + draft → Telegram topic 774, action buttons)

Ferrari taps Send
  → Intercom API reply (as admin)
  → Monday side effect (add update note)
  → SQLite status updated → card edits to "✅ Sent"

Ferrari taps Edit
  → Telegram Mini App opens (alex.icorrect.co.uk/edit?id=...)
  → Draft pre-filled + "Why did you change this?" field
  → Submit → updated draft saved → SQLite feedback stored → learning pipeline

Ferrari taps Snooze
  → Card hidden, reappears at chosen time (2h / tomorrow / custom)

Feedback loop (weekly)
  → learning-run.js reads edit pairs + reasons from SQLite
  → Extracts rules → appends to data/learned-rules.md
  → Future drafts include learned rules in context
```

---

## Key Decisions

- **Send from Telegram in Phase 1** — core, not Phase 3
- **All manual approval first** — graduate to auto-send after ~1 week of trust
- **Single model**: Qwen 3.6 Plus via OpenRouter for all drafts
- **SQLite for state** — persists conversations, drafts, send status, edits
- **Shopify pricing from cached JSON** — daily cron pull, never live API per card
- **Morning full run + 15-min checks** during working hours
- **Phase 1 covers all Intercom channels**: email, chat, instagram, whatsapp
- **Telegram topic**: Emails → thread `774` in group `-1003822970061`

---

## Triage Card Format

```
━━━ TRIAGE CARD ━━━━━━━━━━━━━━━━━━━━━━━
Type: [Follow Up | New Enquiry | Status Chase | Quote Confirmation |
 Warranty Claim | Complaint | Collection | Invoice Query]
Channel: [Email | WhatsApp | Instagram | Web Chat]
Device: [device model or "N/A"]
Confidence: [🟢 Ready to send | 🟡 Needs review | 🔴 Escalate]
Priority: [P1 | P2 | P3]

━ CUSTOMER ━
Name: [name from thread]
Email: [email]
Phone: [phone if available]
Type: [🔁 Returning — X repairs since YYYY | 🆕 New customer]
[If returning:]
 Last repair: [device] [repair type], [month YYYY], [outcome]
 Any issues: [None | Complaint on [date] | Warranty claim on [date]]
[If new:]
 No previous repair history.

━ ACTIVE REPAIR ━
[If Monday match exists:]
Monday: #[item ID] "[item name]"
 Status: [status4 value]
 Payment: [paid / unpaid / invoiced]
 Received: [date4 or "Not yet"]
 Expected: [date36 or "TBC"]
 Tech notes: [last update note, one line]
 Link: [Monday item URL]
[If no Monday match:]
No active repair found on Monday.

━━ DRAFT REPLY ━
[LLM-generated draft reply]

━━ SOURCE ━
KB used: [list of KB articles referenced]
Pricing: [From Monday repair ✓ | From KB ✓ | Not in KB ⚠️ | Not applicable]

[✅ Approve] [✏️ Edit] [⚠️ Escalate] [💤 Snooze]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Thread display logic:**
- ≤3 messages: show latest customer message in full
- >3 messages: compressed 2-4 line summary of thread history, then latest message

---

## Confidence Tiers

Every card gets exactly one tier. This determines button visibility.

### 🟢 Ready to send

All must be true:
- Pricing sourced from Monday or KB (not guessed)
- Customer type known (Supabase returned result or clearly new)
- Monday data consistent with draft
- Conversation type is routine: status chase, collection confirmation, old device decline, turnaround query with clear data
- Draft follows Ferrari writing rules (no em dashes, correct tone, no assumptions)

### 🟡 Needs review

Any of these:
- Pricing not in KB (flagged, not guessed)
- Corporate customer
- Warranty first-contact (acknowledgement only, no eligibility confirmed)
- Agent uncertain about any detail
- New repair enquiry with ambiguous diagnosis

### 🔴 Escalate

Any of these:
- Post-repair complaint
- Customer threatening legal action
- Back Market platform email
- Paid-not-contacted (Shopify paid, no Monday item)
- Warranty assessment required (beyond first-contact)
- Paid customer with 48+ hours silence

**🔴 cards do NOT show Approve button. Only Escalate and Snooze.**

---

## Data Lookup Chain

### 1. Supabase (customer history)

Search by email via `search_repair_history(email, phone, limit)` RPC function.

Returns:
- Total repair count
- Most recent repair: device, type, date, outcome
- Any complaint or warranty flags
- Coverage: 95% of 1,889 items have email, 99% have phone

Determines "🔁 Returning" vs "🆕 New" label. Sets tone for the draft.

### 2. Monday (active repair)

Cascade matching (confidence scores are internal; surface as 🟢🟡🔴):

1. Exact email match on `text5` → 0.95
2. Exact phone match → 0.85
3. Normalised phone match (strip +44/0, compare digits) → 0.85
4. Email domain match + same first name → 0.70
5. Corporate: company from email domain → filter active items on main board → 0.65
6. First name in item title + matching device type → 0.50

Returns best_match + alternatives. Also extracts quote_amount and paid_amount from financial columns.

Board: `349212843` (main). Corporate items sit on main with Client Type = Corporate. Only fall through to corporate board `30348537` if main returns zero AND domain is not free provider.

### 3. Intercom (thread context)

- Message count, thread age, last reply timestamp
- Full thread for summary generation
- Direct conversation URL

### 4. Shopify (cached pricing — no live API per card)

`pricing.json` refreshed daily by cron at 05:00 UTC. Read-only lookup.

Only used for pricing when Monday match doesn't exist or confidence is low.

---

## Pricing Logic

Context-aware, not one rule:

```
If Monday match (confidence >= 0.85) AND has quote/paid:
  → "Price: £289 (from repair)"
If Monday match (confidence >= 0.85) AND no quote yet (diagnostics):
  → "Price: Quote pending — device in diagnostics"
If no Monday match:
  → Use Shopify cached pricing (pricing.json)
If confidence < 0.85:
  → Use Shopify "from £X" as starting price, do NOT use Monday price
If Shopify doesn't have it:
  → "Price: Not in catalogue — diagnostic needed"
```

**Draft prompt rule:** LLM uses the price shown on the card. Never invents prices.

---

## Action Handlers

### ✅ Approve
- Sends draft to Intercom immediately as admin reply
- Only visible on 🟢 and 🟡 cards
- Monday side effect: add update note to matched item
- Card edits to "✅ Sent [timestamp]"
- SQLite: status → `sent`, `sent_at` recorded

### ✏️ Edit
- Opens Telegram Mini App at `https://alex.icorrect.co.uk/edit?id={conversation_id}`
- Draft pre-filled in editor + "Why did you change this?" field (optional but encouraged)
- On submit: sends edited version via Intercom API
- Logs: original draft, edited draft, reason → SQLite `edits` table
- Card updates: shows edited draft + Send/Skip buttons

### ⚠️ Escalate
- Quick-select target: Ferrari (default) or Ricky (legal, complaints, discount/free repair decisions)
- Optional one-line reason
- Tags Intercom conversation appropriately
- Internal note added with escalation context
- Visible on all cards (including 🔴 as the primary action)

### 💤 Snooze
- Quick-select duration: 2 hours, tomorrow morning (08:00 UTC), custom
- Card hidden from thread, reappears at chosen time
- Optional snooze reason for tracking
- Uses SQLite `checkpoints` table or a dedicated snooze mechanism

---

## Draft Quality Rules

1. **No em dashes. Ever.**
2. Tone: calm, direct, neutral, specialist. Not sales-led.
3. No gender assumptions.
4. No business address in body (footer handles it).
5. Do not claim repairs completed unless Monday `status4` confirms it.
6. Do not confirm warranty eligibility before Ferrari review.
7. Do not commit to refunds, free repairs, or outcomes on complaints.
8. Do not guess pricing. If not in KB/Monday, flag 🟡.
9. Returning customers: shorter, warmer, less explanation needed.
10. New customers: slightly more context, professional, earn trust.
11. 2+ warranty returns on same device: handle sensitively.
12. Sign off: "Kind regards, Alex"

---

## LLM Prompt Structure

```
You are Alex, customer service at iCorrect. Draft a reply for this customer.

=== WRITING RULES (follow exactly) ===
[ferrari-context.md — templates, hard rules, approved phrasing, bad/good examples]

=== LEARNED CORRECTIONS (from reviewer feedback) ===
[learned-rules.md — auto-generated rules from Ferrari's edits]

=== THIS CONVERSATION ===
TRIAGE CARD:
[full card — type, device, status, payment, price, priority, customer type]

PAST REPAIRS (Supabase):
[if found: list of past repairs with device, amount, status, warranty flags]
[if not found: "No previous repairs found"]

=== INSTRUCTIONS ===
Draft a reply following the writing rules and learned corrections exactly.
- No em dashes. Sign as "Kind regards, Alex". Future tense only for repairs.
- Use the price shown on the card. Do not invent prices.
- If past repairs exist, acknowledge them naturally.
- If 2+ warranty returns, handle sensitively.
- Returning customers: warmer tone, shorter.
- New customers: professional, slightly more context.
- Output ONLY the reply text. No preamble, no explanation.
```

---

## Files to Build

```
/home/ricky/builds/alex-triage-rebuild/
├── scripts/
│   ├── inbox-triage.js        ← Intercom pull + noise filter + orchestrator
│   ├── monday-enrich-v2.js    ← Cascade matching with confidence scores
│   ├── monday-enrich.js       ← Re-exports v2 (compatibility)
│   ├── shopify-pricing.js     ← Shopify catalog pull → pricing.json
│   ├── card-builder.js        ← Assemble triage cards from enriched data
│   ├── learning-run.js        ← Weekly: edit pairs → rules → learned-rules.md
│   ├── test-integration.js    ← End-to-end integration test
│   └── repair-history-import.js ← Parse JSON → Supabase (ALREADY RUN, 1889 items imported)
├── sql/
│   └── create-repair-history.sql ← Supabase: table + indexes + search function
├── lib/
│   ├── intercom.js            ← Intercom API client
│   ├── monday.js              ← Monday GraphQL client (search, quote/paid extraction)
│   ├── supabase.js            ← Supabase client (upsert, RPC, query)
│   ├── repair-history.js      ← Supabase repair lookup + card formatter
│   ├── draft.js               ← Qwen 3.6 Plus via OpenRouter
│   ├── db.js                  ← SQLite schema + queries
│   ├── triage.js              ← Full orchestration
│   ├── config.js              ← Config loading
│   ├── bot-actions.js         ← Telegram callback handlers
│   └── telegram.js            ← Telegram Bot API client
├── web/
│   ├── edit.html              ← Telegram Mini App editor
│   ├── edit.js                ← WebApp SDK + form submit
│   └── edit.css               ← Styles
├── data/
│   ├── pricing.json           ← Cached Shopify pricing (auto-refreshed daily)
│   ├── triage.db              ← SQLite state database
│   ├── repair-history-import-summary.json ← Import coverage stats
│   ├── ferrari-context.md     ← Writing library for LLM context
│   └── learned-rules.md       ← Auto-generated rules (starts empty)
├── BUILD-BRIEF.md             ← This file
├── package.json
└── alex-triage-rebuild.service ← systemd service file
```

**Already completed by previous Codex runs:**
- `sql/create-repair-history.sql` — table schema, indexes, search function
- `lib/supabase.js` — Supabase client (upsert, RPC, count)
- `lib/repair-history.js` — Lookup + `formatPastRepairs()` function
- `lib/monday.js` — Monday GraphQL client
- `lib/config.js` — Config loading
- `lib/bot-actions.js` — Bot action handlers
- `scripts/import-repair-history.js` — 376 lines, processes 1,889 items (✅ RUN: 1,889 rows, 95% email, 99% phone coverage)
- `scripts/monday-enrich-v2.js` — 217 lines, cascade matching
- `scripts/card-builder.js` — Updated card assembly
- `scripts/inbox-triage.js` — 238 lines, Intercom + noise filter
- `scripts/test-repair-history-integration.js` — 100 lines
- `lib/triage.js` — 13,968 bytes, full orchestration
- `scripts/learning-run.js` — 120 lines, weekly learning
- `scripts/shopify-pricing.js` — 88 lines, Shopify pull
- `data/repair-history-import-summary.json` — Import coverage stats

**Still needs implementation:**
- Telegram bot service (`telegram-bot.js` or `bot-actions.js` as persistent service)
- Mini App (`web/edit.html`, `edit.js`, `edit.css`, Express endpoints)
- Card format update: merge confidence tiers, thread summary logic, past repairs section
- Snooze handler
- Escalate handler with target selection
- Button behavior: hide Approve on 🔴 cards
- Conditional Shopify: use cached pricing for non-payment emails (no live API)
- Integration with Cowork's 4 skills (card-review on every draft)
- systemd service + nginx config + crontab entry

---

## Build Order

1. **Card builder + confidence tiers** — merge all data sources into card format with 🟢🟡🔴 tiers
2. **Telegram bot service** — persistent service, post to topic 774, handle Send/Approve callback
3. **Mini App** — edit.html + Express API endpoints at port 8020
4. **Draft generation** — integrate LLM with card context, past repairs, pricing logic
5. **Edit snooze** — snooze persistence, reappear at chosen time
6. **Snooze** — snooze persistence, reappear at chosen time
7. **Escalation handler** — quick-select, tag Intercom, add internal note
8. **Integration tests** — end-to-end with real Intercom conversation, real Monday data, real card output
9. **Deployment** — systemd + nginx + crontab

**Already done:**
- Supabase schema + 1,889 items imported
- Monday cascade matching (monday-enrich-v2.js)
- Repair history lookup (lib/repair-history.js)
- Monday GraphQL client (lib/monday.js)

Each step gets committed and tested before moving to the next.

---

## Deployment

```cron
# Morning full triage (06:45 UTC weekdays)
45 6 * * 1-5 cd /home/ricky/builds/alex-triage-rebuild && node scripts/inbox-triage.js --mode=morning

# 15-min check during working hours (09:00-17:30 UTC weekdays)
*/15 9-17 * * 1-5 cd /home/ricky/builds/alex-triage-rebuild && node scripts/inbox-triage.js --mode=check

# Daily Shopify pricing refresh (05:00 UTC)
0 5 * * * cd /home/ricky/builds/alex-triage-rebuild && node scripts/shopify-pricing.js

# Weekly learning run (Sunday 22:00 UTC)
0 22 * * 0 cd /home/ricky/builds/alex-triage-rebuild && node scripts/learning-run.js
```

**Telegram bot + Mini App runs as systemd user service** on port 8020 (restarts on failure).

**Nginx:** `alex.icorrect.co.uk` → `127.0.0.1:8020` with Let's Encrypt SSL.

---

## Verification

1. **Card generation** — run morning mode, verify cards post to Telegram topic 774 with correct format, confidence tiers, and all sections populated
2. **Monday matching** — pick 10 conversations, verify correct matches with appropriate confidence scores
3. **Supabase lookup** — spot-check 5 known customers, verify past repairs return correctly
4. **Draft quality** — generate 5 drafts, compare against Ferrari's actual replies
5. **Send flow** — Send → Intercom reply lands → Monday note added → SQLite status → Telegram confirmation
6. **Edit flow** — Edit → Mini App opens → edit draft → submit → card updates → learn rule stored
7. **Confidence tiers** — verify 🔴 card has no Approve button, only Escalate + Snooze
8. **Pricing logic** — active repair shows Monday price, new enquiry shows Shopify, diagnostics shows "pending"
9. **Snooze flow** — snooze at 2h → card disappears → reappears after 2h
10. **Service stability** — bot stays up, handles concurrent callbacks, restarts on failure

---

## Phase 2: Quote Building (next build)

**Trigger:** Monday status "Diagnostic Complete"  
**Flow:** Monday event → pull diagnostic notes → LLM drafts quote → Quotes topic → Ferrari reviews → Send → Intercom  
**Shared with Phase 1:** Same bot service, SQLite, Monday/Intercom clients, Telegram buttons  

## Phase 3: Invoicing (future)

**Trigger:** Quote approved by customer  
**Flow:** Xero invoice created → Invoices topic → Ferrari confirms → sent  
**Blocker:** Xero API integration  

## Auto-Send Graduation (future)

After Phase 1 runs for ~1 week:
1. Review which categories are 100% approve-without-edits
2. Add to `auto_send` config list
3. Auto-sent still post as confirmation cards ("✅ Auto-sent")

---

## Key References

- **Alex workspace:** `/home/ricky/.openclaw/agents/alex-cs/workspace/`
- **Cowork rebuild handoff:** `docs/vps-handoff-alex-rebuild.md`
- **Ferrari writing library:** `.../workspace/knowledge/ferrari-writing-library.md`
- **Reply templates:** `.../workspace/docs/reply-templates.md`
- **Quote building SOP:** `.../workspace/docs/quote-building-sop.md`
- **Triage mapping:** `.../workspace/docs/triage-mapping.md`
- **Intercom API ref:** `.../workspace/docs/intercom-api-reference.md`
- **Monday API ref:** `.../workspace/docs/monday-api-reference.md`
- **Quoting process SOP:** `/home/ricky/kb/operations/sop-quoting-process.md`
- **Repair history analysis:** `/home/ricky/builds/agent-rebuild/repair-history-analysis.md`
- **Raw repair data:** `/home/ricky/builds/agent-rebuild/data/repair-history-full.json`
- **Supabase schema:** `sql/create-repair-history.sql`
- **Env file:** `/home/ricky/config/api-keys/.env` (INTERCOM_API_TOKEN, MONDAY_APP_TOKEN, TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY, SHOPIFY_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- **Main Monday board:** `349212843`
- **Alex Telegram group:** `-1003822970061`
- **Email triage topic:** thread `774`
- **Mini App domain:** `alex.icorrect.co.uk` (port 8020, nginx reverse proxy)
- **Existing nginx pattern:** see `/etc/nginx/sites-enabled/` for reverse proxy examples

---

## Issues from 2026-04-08 live tests — SLOPPY, NOT ACCEPTABLE

### 1. Quote triage pulls ALL historical items with NO date filter
The script pulls every Monday item with status "Quote Sent" / "Diagnostic Complete" from any date. Amjad's iPhone 5C (item 7070405040) was from months ago — already resolved — and still got posted as a fresh card.
**Fix required:** Date gate (last 7 days default) + skip items already processed in SQLite.

### 2. Quote cards posted to same topic as email cards
Quote cards went to thread 774 (Emails), not thread 775 (Quotes). The quote-triage.js doesn't respect the quotesThreadId config.
**Fix required:** Quote cards → topic 775, email cards → topic 774.

### 3. "Quote pending" drafts are useless
When no pricing found in structured Monday fields, the draft says "The price for this repair is Quote pending". Monday notes clearly contained "£299 minimum + £29 diagnostic" in free text.
**Fix required:** Parse £ amounts from Monday notes text, not just structured fields.

### 4. Device shows "N/A" when device_model from Monday is just the customer name
Notes said "iPhone 5C" but card showed "Device: N/A".
**Fix required:** Extract device from Monday notes when structured field is unusable.

### 5. No date filter on inbox-triage.js Intercom calls
First morning run tried to pull ALL 31K conversations. Intercom's list API doesn't support server-side date filtering.
**Status:** Intercom cleanup (closing pre-2025 conversations) is running in background. After complete, checkpoint-based incremental pulls will be fast.

### 6. Bot service was left polling when it should have been stopped
The service kept running during testing and posting unintended cards. Took multiple commands to stop.
**Fix required:** Clear on/off controls, never poll without explicit enable.

# Alex Triage Card System — Build Brief

**Date:** 2026-04-07
**Owner:** Code
**Consolidated:** 2026-04-08
**Last updated:** 2026-04-13
**Status:** Batches 0-10 complete. Crons disabled — blocked on Telegram gateway outbound fix.

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

**All files implemented (Batches 0-10 complete).** See TODO.md for batch-by-batch tracking.

Additional scripts built during remediation:
- `scripts/validate-email-triage.js` — fixture-based validation runner (14 test cases)
- `scripts/qa-send-flow.js` — QA test harness for send path
- `scripts/quote-triage.js` — quote extraction (scoped separately from email triage)
- `scripts/spam-audit.js` — spam/noise analysis tooling
- `lib/http.js` — mini HTTP server helper

**Pending (Batch 11 — Verification):**
- Controlled live run proving checkpoint advance + Telegram message id persistence
- Compare morning output against manual Intercom review
- Manual verification of 10 Monday matches and 10 Shopify price lookups
- Sample card review with Ferrari
- Compare 5 Qwen drafts against real Ferrari replies
- Test cron execution, bot service restart, Mini App over HTTPS

---

## Build Order (all complete through Batch 10)

1. ~~Card builder + confidence tiers~~ ✅
2. ~~Telegram bot service~~ ✅
3. ~~Mini App~~ ✅
4. ~~Draft generation~~ ✅
5. ~~Snooze~~ ✅
6. ~~Escalation handler~~ ✅
7. ~~Integration tests~~ ✅ (fixture-based, 14/14 pass)
8. ~~Deployment~~ ✅ (systemd + nginx + crontab)
9. **Verification (Batch 11)** — in progress, blocked on Telegram gateway

---

## Deployment

```cron
# Morning full triage (06:45 UTC daily) — --limit=30 prevents SIGKILL on full pulls
45 6 * * * cd /home/ricky/builds/alex-triage-rebuild && ALEX_ENABLE_LIVE_POSTING=1 node scripts/inbox-triage.js --mode=morning --limit=30

# 15-min check during working hours (07:00-18:00 UTC Mon-Fri)
*/15 7-18 * * 1-5 cd /home/ricky/builds/alex-triage-rebuild && ALEX_ENABLE_LIVE_POSTING=1 node scripts/inbox-triage.js --mode=check

# Daily Shopify pricing refresh (05:00 UTC)
0 5 * * * cd /home/ricky/builds/alex-triage-rebuild && node scripts/shopify-pricing.js

# Weekly learning run (Sunday 07:30 UTC)
30 7 * * 0 cd /home/ricky/builds/alex-triage-rebuild && node scripts/learning-run.js
```

**Current state: ALL CRONS DISABLED** — Telegram outbound delivery broken ("Outbound not configured for channel: telegram"). Suspect gateway version mismatch (gateway 2026.3.24, config 2026.4.9).

**Telegram bot + Mini App runs as systemd user service** on port 8020 (restarts on failure).

**Nginx:** `alex.icorrect.co.uk` → `127.0.0.1:8020` with Let's Encrypt SSL.

### Environment Variables

**Critical (no defaults):**
- `INTERCOM_API_TOKEN`, `MONDAY_APP_TOKEN`, `TELEGRAM_BOT_TOKEN`, `OPENROUTER_API_KEY`
- `SHOPIFY_STORE`, `SHOPIFY_ACCESS_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Important (with defaults — verify these):**
- `INTERCOM_ADMIN_ID` — must be `9702337` (Support), NOT `9702338` (Alex). Fixed 2026-04-10.
- `TELEGRAM_CHAT_ID` — default `-1003822970061`
- `TELEGRAM_EMAILS_THREAD_ID` — default `774`
- `ALEX_ENABLE_LIVE_POSTING` — must be explicitly `1` in cron. Accepts `1/0`, `true/false`, `yes/no`, `on/off`.

---

## Verification

### Passed (fixture-based, 2026-04-11)

14/14 email triage fixture tests — see `docs/validation/email-triage-validation-2026-04-11.md`:
1. ✅ Fresh Monday match with email
2. ✅ Returning customer with previous repairs visible
3. ✅ History without Monday match
4. ✅ Weak/missing pricing flagged correctly
5. ✅ Stale conversation excluded
6. ✅ Already-processed conversation excluded
7. ✅ Contact Form forwards kept triageable
8. ✅ Spam patterns blocked (hard + soft + repair-intent protection)
9. ✅ Corporate repair recognised
10. ✅ Quote noise excluded from email thread
11-14. ✅ Additional edge cases (see validation doc)

6/6 Telegram review flow tests — see `docs/validation/telegram-review-flow-2026-04-11.md`:
- ✅ Approve (single + retry), Edit, Escalate, Snooze, Routing

### Still pending (Batch 11 — blocked on gateway)

- [ ] Controlled live run: card → Telegram → message_id persisted → checkpoint advanced
- [ ] Compare morning output against manual Intercom inbox review
- [ ] Manual verification of 10 Monday matches
- [ ] Manual verification of 10 Shopify price lookups
- [ ] Sample card review with Ferrari
- [ ] Compare 5 Qwen drafts against real Ferrari replies
- [ ] Test cron execution end-to-end
- [ ] Test bot service restart behaviour
- [ ] Test Mini App over HTTPS

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

## Issues Log

### 2026-04-08 live tests — RESOLVED

1. ~~Quote triage pulls ALL historical items with NO date filter~~ — date gate + SQLite dedup added
2. ~~Quote cards posted to same topic as email cards~~ — quote cards now → topic 775
3. ~~"Quote pending" drafts are useless~~ — now parses £ amounts from Monday notes free text
4. ~~Device shows "N/A" when device_model is just the customer name~~ — device extraction from notes
5. ~~No date filter on inbox-triage.js Intercom calls~~ — checkpoint-based incremental pulls + --limit=30 safety valve
6. ~~Bot service was left polling when it should have been stopped~~ — explicit ALEX_ENABLE_LIVE_POSTING control

### 2026-04-09/10 — Alex Sender Route (RESOLVED)

**Problem:** Customer quotes sent via Alex admin ID (9702338) instead of Support (9702337), causing delivery failures.
**Root cause:** `INTERCOM_ADMIN_ID` env var not set; code default was wrong.
**Fix:** Changed env to `INTERCOM_ADMIN_ID=9702337`, restarted service. 2 affected conversations found and corrected.

### 2026-04-11 — Remediation (RESOLVED)

Full remediation via Codex ACP (commit 30e1e30 + follow-ups):
- **Env boolean parsing**: accepts `1/0`, `true/false`, `yes/no`, `on/off`
- **Telegram fail-closed**: client now validates `ok` + `message_id` in response; fails before checkpoint update
- **Quote-noise exclusion**: historical quote threads no longer leak into email review
- **Fallback drafts**: category-specific safe drafts when Qwen times out (not just generic fallback)
- **Card enrichment**: previous repairs, Monday link, latest visible message all present
- **Pricing pagination**: 879 products synced (was 250)

Live verification passed: card posted to thread 774, telegram_message_id 2170 persisted, checkpoint advanced.

### 2026-04-11 — Spam/Noise Filter (RESOLVED)

53% of email conversations should not become triage cards (12% spam + 42% noise).
- Noise: Quote Request notifications, admin@icorrect outbound, mailer@shopify.com, BM no-reply, voicemail/telesphere
- Hard spam: parts suppliers, phishing, reputation management, .cn manufacturing, platform scam
- Soft spam: SEO/cold outreach (protected by repair-intent signal: device + fault keywords)
- **Critical correction**: michael.f Contact Form forwards are real customer enquiries (n8n SMTP hack attribution) — kept triageable
- 14/14 fixture tests pass

### CURRENT BLOCKER — Telegram gateway outbound

**Problem:** All crons disabled. Telegram delivery fails with "Outbound not configured for channel: telegram".
**Status:** Config looks correct. Suspect gateway version mismatch (gateway 2026.3.24, config 2026.4.9). Awaiting infra fix.

### Known minor issues

- Morning full-pull SIGKILL on memory (mitigated with --limit=30)
- Wesley Murphy platform spam still slipping through (subject-only pattern)
- Monday API intermittent 500s (retries handle it)
- Buyback buy-box monitor: 25 days stale, disabled (separate system)

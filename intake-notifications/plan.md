# Intake Notifications — Build Plan

**Created:** 2026-04-08
**Owner:** Ricky + Code
**Status:** Planning

---

## Vision

Two-phase rebuild of customer intake flow:

- **Phase 1** — Fix what exists: replace broken n8n→Slack notifications with a self-hosted Node.js service. Typeform stays as the customer-facing form. Slack gets clean, enriched notifications that actually help the team.
- **Phase 2** — Own the surface: replace Typeform with a custom client-facing web interface, and move team operations from Slack to Telegram. Full control, no third-party form dependencies.

---

## Phase 1: Improved Typeform → Slack Notifications

**Goal:** When a customer submits a Typeform (collection, drop-off, or walk-in), the team gets a clean, enriched Slack notification with everything they need — no Monday lookup required.

### What's broken today
- LLM summary silently fails on most submissions (n8n timeout)
- Accessories section picks up garbage (Intercom URLs, item descriptions)
- Notes dump raw unformatted blobs
- Wrong data in wrong sections (complaints in "Accessories")
- Internal labels exposed ("Case column: No Case")
- Flags fire incorrectly (repair difficulties on 80%+ of notifications)

### Architecture

```
Typeform webhook → VPS Node.js service (port TBD) → Monday lookup + LLM summary → Slack
```

Single Express service. Absorbs LLM summary inline (no separate port 8004 microservice). Runs as systemd user service behind nginx.

### Phase 1A: Service Foundation + Collection Flow
**Priority:** Build first — all verified, ready to go.

Deliverables:
1. **Node.js service scaffold**
   - Express server with health endpoint
   - Typeform webhook receiver with signature verification (if TYPEFORM_SECRET available)
   - Monday.com GraphQL client (lookup by ID, email, name)
   - LLM summary module (absorbed from `/home/ricky/builds/llm-summary-endpoint/server.js`)
   - Slack message builder + poster
   - systemd service + nginx proxy

2. **Collection notification** (replaces n8n workflow `FB83t0dN0PNlEOpd`)
   - Typeform `vslvbFQr` → webhook at `/webhook/collection`
   - Slack channel: `C09G72DRZC7` (collection-form-responses)
   - Monday groups: `new_group34086` (Awaiting Collection), `group_mkwkapa6` (QC)
   - Customer lookup: monday_id → email → name (in priority order)
   - Device name from Monday item (not Typeform's vague dropdown)
   - Payment detection: `dup__of_quote_total` column + title pattern `*Paying £X on collection`
   - Case/accessories: ONLY from `status_14` column — no text scanning
   - Flags: `color_mkse6rw0` (repair problem) + `color_mkse6bhk` (client problem), with tightened keyword detection
   - LLM summary: 3 sections (client said / what we found / what we did), 15s timeout
   - Repeat customer check: same-email items excluding current + BM items
   - Intercom link from `link1` column
   - Clean formatting: no internal labels, no raw data

   **Slack output format:**
   ```
   📦  John Smith — Collection

   MacBook Pro 16" M3 Pro  ·  Screen Repair  ·  Ready To Collect

   💰  Paid: £449  /  ⚠️ Paying £449 on collection
   👤  End User

   ⚠️ Repair difficulties detected
   😤 Customer chasing/upset detected

   📝  Notes
   💬 Client said: Screen cracked after drop, MagSafe charger included
   🔍 Found: Display assembly damaged, no logic board issues
   ✅ Done: Genuine display replacement, calibrated True Tone

   🧳  Case: No
   🔄  First visit  /  Returning customer (2 previous repairs)

   Monday · Intercom
   ```

**Acceptance criteria:**
- Service starts, health endpoint responds
- Typeform collection submission → enriched Slack message within 10s
- LLM summary works reliably (fallback to "N/A" sections if it fails, not garbage)
- No internal labels, no wrong-section data, no garbage accessories
- Flags only fire when genuinely relevant

### Phase 1B: Drop-Off Notification
**Depends on:** Phase 1A service running.

Deliverables:
- Typeform `nNUHw0cK` → webhook at `/webhook/dropoff`
- Slack channel: `C09GW4LNBL7` (appointment-form-responses)
- Monday groups: `new_group70029` (Today's Repairs), `new_group77101__1` (New Orders), `new_group34198` (Incoming Future)
- Shopify flag if `color_mkzmbya2` (source) contains "shopify"
- Same enrichment engine as collection, different header (📋 instead of 📦)
- No payment-on-collection detection (not relevant for drop-offs)

### Phase 1C: Walk-In Notification
**Depends on:** Phase 1A service running.

Deliverables:
- Typeform `LtNyVqVN` (the live-wired form) → webhook at `/webhook/walkin`
- Slack channel: `C05KVLV2R6Z` (walk-in-form-responses)
- Notification only — Intercom ticket + Monday item creation stays in n8n (`kDfU2wWWv207T24J`)
- Customer match by email if available, name fallback
- Walk-in specific: show data backup status, intent (drop off now vs book later)

### Phase 1 Cutover Plan
For each flow:
1. Deploy service, test with manual webhook replay
2. Add new Typeform webhook URL (Typeform supports multiple webhooks)
3. Verify new notifications arrive correctly in Slack
4. Disable old n8n webhook on the Typeform
5. Monitor for 48h before deactivating n8n workflow

### Phase 1 Dependencies (all confirmed by readiness audit 2026-04-06)
- [x] Typeform IDs verified live
- [x] Monday column IDs verified live
- [x] Slack channel IDs verified live
- [x] Monday group IDs verified live
- [x] Credentials available in `/home/ricky/config/api-keys/.env`
- [x] LLM summary endpoint code available to absorb
- [ ] TYPEFORM_SECRET — not available, not a blocker (skip signature verification)

---

## Phase 2: Custom Client Interface + Telegram Ops (Future)

**Goal:** Replace Typeform (client-facing) and Slack (team-facing) entirely. Customers use our own web form. Team manages intake via Telegram.

### Why
- Typeform costs £70/month for limited customisation
- Slack is a notification dump — team has to context-switch between Slack and Monday
- No ability to add real-time pricing, smart device detection, or conditional flows in Typeform
- Telegram is where the team already communicates — ops should live there too

### Client-Facing Web Interface
A custom form hosted on our domain (e.g. `intake.icorrect.co.uk`) that replaces all 4 Typeforms:

- **Smart device selection** — brand → model → common faults (from our data)
- **Returning customer detection** — email match surfaces their history inline
- **Conditional flows** — collection shows different fields than walk-in
- **Booking integration** — date/time picker for appointments
- **Confirmation page** — "We've got your details, here's what happens next"
- **Mobile-first** — most customers submit from their phone

Tech: React/Next.js static site, calls the same backend API as Phase 1's service.

### Telegram Team Operations
Replace Slack notifications + future intake modals with Telegram bot interactions:

- **Intake notification** → Telegram message with inline buttons
- **Complete Intake** → Telegram inline form (device check, passcode, power, etc.)
- **Collected / Declined** → button press → Monday write-back
- **Voice notes** → native Telegram voice → Whisper transcription → Monday update
- **Daily briefing** → morning message with today's appointments

Why Telegram over Slack:
- Team already uses Telegram for comms
- Bot API is simpler and more flexible than Slack's
- Inline keyboards + callback queries = clean interactive flows
- Voice notes are native (no third-party integration)
- No per-seat licensing

### Phase 2 Build Order (rough)
1. Telegram bot scaffold + notification delivery (mirror Phase 1 Slack output to Telegram)
2. Telegram inline buttons (Collected, Complete Intake)
3. Monday write-back from Telegram callbacks
4. Custom web form (collection flow first)
5. Web form: drop-off + walk-in + enquiry
6. Voice note pipeline (Telegram → Whisper → Monday)
7. Cutover: disable Typeform webhooks, point customers to new form
8. Decommission Typeform subscription

### Phase 2 Open Questions
- Domain for client form? (`intake.icorrect.co.uk` or page on main site?)
- Which Telegram group/chat for intake notifications? Existing or new?
- Do we need separate Telegram bots per function or one unified bot?
- Monday write-back: which columns need updating from intake? (phone column ID still unidentified)

---

## Out of Scope (Both Phases)
- Changing Monday board structure or column IDs
- Walk-in Intercom ticket + Monday item creation (stays in n8n until Phase 2)
- LLM model upgrade (gpt-4o-mini is fine for summaries)
- Image upload at intake (future consideration)
- Enquiry flow branching (requires Typeform changes that aren't done)

---

## File Structure (Phase 1)

```
builds/intake-notifications/
├── plan.md                  ← this file
├── REBUILD-BRIEF.md         ← original technical spec
├── server.js                ← Express entry point
├── src/
│   ├── monday.js            ← Monday GraphQL client (lookup, updates, repeat check)
│   ├── slack.js             ← Slack message builder + poster
│   ├── llm-summary.js       ← LLM summary (absorbed from port 8004 service)
│   ├── typeform.js           ← Webhook parser + signature verification
│   ├── enrichment.js         ← Column parsing, flags, payment detection, name cleaning
│   └── config.js             ← Form IDs, channel IDs, group IDs, column mappings
├── routes/
│   ├── collection.js         ← /webhook/collection handler
│   ├── dropoff.js            ← /webhook/dropoff handler
│   └── walkin.js             ← /webhook/walkin handler
├── package.json
├── specs/                    ← existing spec documents
└── archive/                  ← old workflow exports
```

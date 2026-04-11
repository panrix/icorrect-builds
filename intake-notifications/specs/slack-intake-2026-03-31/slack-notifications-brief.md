# Slack Notification Rebuild: Code Agent Brief

**Written:** 2026-03-16
**Priority:** High (customer-facing workflow, Andres uses this daily)
**Owner:** Code agent
**Slack channel:** `C09G72DRZC7`

---

## The Problem

When a customer submits a Typeform (collection, drop-off, or walk-in), an n8n workflow fires that:
1. Looks up the customer on Monday.com
2. Pulls their repair updates, payment status, accessories, repeat history
3. Posts an enriched Slack notification so Andres knows what he's dealing with

The notifications are broken. They're dumping raw data, leaking URLs, and the LLM summary layer isn't firing reliably.

---

## What's Wrong (real examples from Slack)

### Example 1: Abdur Rahman (Collection, Mar 12)

**Accessories field is garbage:**
```
Accessories: Case column: No Case
  From updates: Magsafe charger came in the middle while shutting the screen; com/a/inbox/pt6lwaq6/inbox/conversation/215473434038966Items:- MacBook Air 15-inch 'M2' A2941 (2023) Screen Repair (Genuine Display) (£449
```
- Raw Intercom URL fragments leaking in
- Monday item text dumped verbatim
- Completely useless to Andres

**Notes says "No notes"** despite the item having updates with repair difficulties flagged.

### Example 2: Dean Christian (Collection, Mar 12)

**Notes section dumps raw voice note:**
```
💬 Voice Note TranscriptionFrom: Andres EgasTime: 2026-03-10 15:01 UTCCustomer mentioned that if the repair is more than £100, it's not worth for him.
```
- No line breaks between metadata and content
- "TranscriptionFrom:" is one word
- Useful info buried in formatting mess

**Accessories again broken:**
```
Accessories: Case column: Case
  From updates: com/a/inbox/pt6lwaq6/inbox/conversation/215473422402765Items:- iPhone 15 Pro Max Volume Button Repair (£99
```

### Example 3: Tola Oderinwale (Collection, Mar 13)

- No notes section at all
- Accessories section contains the complaint text instead: "Customer claims that we damaged her top case and lid during the previous warranty repair"
- That's important context, but it's in the wrong section

### Example 4: TEST FERRARI (Test, Mar 12) — THE ONLY ONE THAT WORKED

```
Notes:
• client upset about turnaround time. had to chase multiple times. managed to turn the situation around but be careful an...
```
This is the LLM summary actually firing. Clean, useful, actionable. This is what every notification should look like.

---

## Root Causes

1. **LLM endpoint isn't firing on most real notifications.** The `fetch()` call in the n8n Enrichment Analysis node silently fails and falls back to keyword extraction. Likely: timeout too short, error handling swallowing failures, or the updates array format doesn't match what the endpoint expects.

2. **Accessories extraction is naive keyword matching.** It scans all updates for words like "case", "charger", "cable" and grabs the surrounding sentence. But Monday updates contain Intercom URLs, item descriptions, and other text that includes those words. Result: garbage.

3. **"Case column" label is exposed to the user.** Andres doesn't need to know it came from a column. Just say "No Case" or "Case included".

4. **Voice note format not parsed.** The voice note pipeline writes structured text ("From: X / Time: Y / Content: Z") but the keyword extractor treats it as one blob.

5. **"CLIENT FORM RESPONSE SUMMARY" updates not fully filtered.** These automated entries from the intake form contain item descriptions and URLs that leak into accessories and notes.

---

## What It Should Look Like

```
📦  Abdur Rahman — Collection

MacBook Air 15" M2 A2941  ·  Screen Repair  ·  Ready To Collect

💰  ✅ Paid (£449)
🔄  First visit

📝  Notes
💬 Client: Magsafe charger got caught while closing the screen
🔍 Found: Screen damage confirmed, genuine display replacement needed
✅ Done: Genuine display installed and calibrated

🧳  Case: No  ·  Charger: Yes (MagSafe)

🔗 Monday · Intercom
```

Key differences:
- Device model and repair type extracted properly (not just "MacBook")
- LLM summary in 3 sections (client said / what we found / what we did)
- Accessories: clean, structured, no raw data dumps
- Links at the bottom, compact
- No "Case column:" labels or raw URL fragments

---

## Current Architecture

### n8n Workflows (cloud-hosted)
- **Collection:** `FB83t0dN0PNlEOpd` (active)
- **Drop-off:** `lTHrOPUnD6naN28p` (active)
- Both last updated Mar 13 14:35 UTC

### Workflow Nodes (same structure in both)
1. `Webhook: Collection/Drop-Off Form` — receives Typeform submission
2. `Extract Form Data` — pulls name + device type from Typeform
3. `Monday: Smart Lookup` — searches Main Board (349212843) by name
4. `Process Monday Results` — formats the match
5. `Needs Alert?` — if no Monday match, sends alert to Slack
6. `Monday: Fetch Updates` — pulls last 15 updates from the matched item
7. `Monday: Repeat Customer Check` — searches by email for previous repairs
8. `Enrichment Analysis` — JavaScript node that builds the notification (THIS IS WHERE THE BUGS ARE)
9. `Slack: Collection/Drop-Off Notification` — posts to `C09G72DRZC7`

### LLM Summary Endpoint (VPS)
- **URL:** `https://mc.icorrect.co.uk/api/summarize-updates` (POST)
- **Health:** `https://mc.icorrect.co.uk/api/summarize-updates/health` (GET)
- **Service:** systemd user service `llm-summary`, port 8004
- **Code:** `/home/ricky/builds/llm-summary-endpoint/`
- **Model:** gpt-4o-mini
- **API key header:** `X-API-Key: 7ff53ec858bf2c7cdc1b94c051e3478d`
- **Status:** running (uptime 2.8 days as of Mar 16)
- Accepts: `{ updates: [{body, created_at, creator}], context: {clientName, deviceType, service, status}, type: "collection"|"drop-off" }`
- Returns: `{ summary: { clientSaid, whatWeFound, whatWeDid }, fallback: bool }`

### Monday Board Structure
- **Main Board:** 349212843
- **Key columns:**
  - `service` — repair type
  - `status4` — repair status
  - `status` — client type (Corporate, End User, Warranty, BM, etc.)
  - `dup__of_quote_total` — paid amount
  - `status_14` — case status
  - `color_mkse6rw0` — problem: repair
  - `color_mkse6bhk` — problem: client
  - `text_mm087h9p` — Intercom conversation ID
  - `link1` — Intercom link
  - `text5` — customer email

### n8n API Access
- **Header:** `X-N8N-API-KEY` with token from `N8N_CLOUD_API_TOKEN` in `/home/ricky/config/api-keys/.env`
- **Base URL:** `https://icorrect.app.n8n.cloud/api/v1/`

### Credentials
- All in `/home/ricky/config/api-keys/.env`
- Monday: `MONDAY_APP_TOKEN`
- OpenAI (for LLM endpoint): `OPENAI_API_KEY`
- n8n: `N8N_CLOUD_API_TOKEN`

---

## What Needs Doing

### 1. Fix the Enrichment Analysis node
- Make the LLM endpoint call reliable (proper error logging, longer timeout, validate response)
- If LLM fires: use 3-section summary, drop the keyword extraction entirely
- If LLM fails: log the error visibly (not silently), use a simple fallback that doesn't dump raw data

### 2. Fix accessories extraction
- Only use the Monday "Case" column (`status_14`) for case status
- Don't scan update text for accessory keywords (this is what's causing the garbage)
- Format cleanly: "Case: Yes/No" and nothing else unless the column has specific info

### 3. Fix update text filtering
- Filter out: "CLIENT FORM RESPONSE SUMMARY", automated entries, raw Intercom URLs
- Parse voice notes properly (split "From:", "Time:", content onto separate lines)
- Strip HTML tags, Intercom link fragments, Monday item descriptions

### 4. Clean up the Slack template
- Device info: pull the actual model from Monday item name (not just "MacBook" from Typeform)
- Repair type from `service` column
- Links: compact footer, not inline URLs
- Remove "Case column:" label prefix
- Remove "From updates:" label prefix

### 5. Test with real data
- Trigger test collections and drop-offs
- Verify LLM summary fires
- Verify accessories are clean
- Verify no raw data leaks

---

## Files to Reference

| File | Purpose |
|------|---------|
| `/home/ricky/builds/llm-summary-endpoint/server.js` | LLM endpoint source |
| `/home/ricky/config/api-keys/.env` | All API credentials |
| This brief | Full context |

---

## Out of Scope (for now)

- Walk-in notification workflow (separate n8n workflow, not yet enriched)
- Changing the Typeform structure
- Monday board column changes
- LLM model upgrade (gpt-4o-mini is fine for this)

# Intake Notifications: Full Rebuild Brief

**Goal:** Replace n8n-hosted Typeform→Slack notification workflows with a self-hosted Node.js service on our VPS. When a customer submits a Typeform (collection, drop-off, or walk-in), the service looks them up on Monday.com, summarises their repair history with an LLM, and posts an enriched Slack notification so Andres knows what he's dealing with.

**Date:** 2026-03-22

---

## Current Architecture (being replaced)

```
Typeform → n8n cloud webhook → n8n JS nodes (Monday lookup, enrichment) → Slack
                                    ↓
                          VPS LLM endpoint (port 8004, gpt-4o-mini)
```

### What's broken
1. **LLM call silently fails** on most real submissions. The n8n fetch() times out or errors, falls back to dumb keyword extraction, nobody knows because errors are swallowed.
2. **Accessories extraction is garbage.** Scans Monday update text for words like "case"/"charger", picks up Intercom URLs and item descriptions instead.
3. **Notes dump raw data.** Voice note transcriptions come through as unformatted blobs. Some notifications have no notes despite the item having updates.
4. **Wrong data in wrong sections.** Customer complaint text appearing in "Accessories" instead of "Notes".
5. **Internal labels exposed.** "Case column: No Case" instead of just "No Case".

### What works fine
- Typeform webhook triggers reliably
- Monday lookup logic (by ID, email, or name) is solid
- Repeat customer check works
- The LLM endpoint itself works when called properly (the one test that succeeded produced clean output)

---

## Target Architecture

```
Typeform → VPS webhook endpoint (Express) → Monday lookup + LLM summary → Slack
```

Single Node.js service on the VPS. No n8n dependency. Absorb the LLM summary logic inline (no separate microservice needed).

---

## Three Workflows to Rebuild

### 1. Collection Form
- **Typeform ID:** `vslvbFQr`
- **Current n8n webhook path:** `collection-form-webhook`
- **Slack channel:** `C09G72DRZC7` (collection-form-responses)
- **Monday groups to search:** `new_group34086` (Awaiting Collection), `group_mkwkapa6` (Quality Control)
- **Special logic:** Payment detection from item title pattern `*Paying £X on collection`

### 2. Drop-Off Form
- **Typeform ID:** `nNUHw0cK`
- **Current n8n webhook path:** `dropoff-form-webhook`
- **Slack channel:** `C09GW4LNBL7` (appointment-form-responses)
- **Monday groups to search:** `new_group70029` (Today's Repairs), `new_group77101__1` (New Orders), `new_group34198` (Incoming Future)
- **Special logic:** Shopify order detection from source column

### 3. Walk-In Form
- **Typeform ID:** `LtNyVqVN`
- **Slack channel:** `C05KVLV2R6Z` (walk-in-form-responses)
- **Current n8n workflow:** `kDfU2wWWv207T24J`
- **Note:** This workflow also creates Intercom tickets and Monday items. For now, only rebuild the Slack notification part. The Intercom+Monday creation stays in n8n until we migrate that too.

---

## Typeform Webhook Payload Structure

Typeform sends POST with this shape:
```json
{
  "form_response": {
    "hidden": { "monday_id": "...", "email": "..." },
    "answers": [
      { "field": { "id": "..." }, "type": "email", "email": "user@example.com" },
      { "field": { "id": "..." }, "type": "text", "text": "John Smith" },
      { "field": { "id": "..." }, "type": "choice", "choice": { "label": "MacBook Pro" } },
      { "field": { "id": "..." }, "type": "boolean", "boolean": true }
    ],
    "definition": {
      "fields": [
        { "id": "...", "title": "What is your name?", "type": "short_text", "ref": "..." }
      ]
    }
  }
}
```

Hidden fields may or may not be populated. Lookup priority: monday_id > email > name search.

---

## Monday.com Integration

### Board & Columns
- **Board ID:** `349212843` (Main Board)
- **API:** `https://api.monday.com/v2` (GraphQL)
- **Auth header:** `Authorization: <MONDAY_APP_TOKEN>`

| Column ID | Purpose |
|-----------|---------|
| `service` | Repair type |
| `status4` | Repair status |
| `status` | Client type (Corporate, End User, Warranty, BM) |
| `dup__of_quote_total` | Paid amount |
| `status_14` | Case status |
| `color_mkse6rw0` | Problem: repair |
| `color_mkse6bhk` | Problem: client |
| `text_mm087h9p` | Intercom conversation ID |
| `link1` | Intercom link |
| `text5` | Customer email |
| `color_mkzmbya2` | Source (Shopify detection) |

### Lookup Methods

**By Monday ID** (best):
```graphql
{ items(ids: [<id>]) { id name group { id title } column_values { id text value } } }
```

**By email**:
```graphql
{ items_page_by_column_values(board_id: 349212843, limit: 10, columns: [{column_id: "text5", column_values: ["<email>"]}]) { items { id name group { id title } column_values { id text value } } } }
```

**By name** (fallback, searches specific groups):
```graphql
{ boards(ids: [349212843]) { groups(ids: ["<group_ids>"]) { items_page(limit: 200) { items { id name group { id title } column_values { id text value } } } } } }
```

Name matching strips prefixes (`#1117 - `, `BM 1234`), suffixes (`*Paying...`, `(notes)`), then does fuzzy match on all name parts. Falls back to surname only, then first name only.

### Fetch Updates
```graphql
{ items(ids: [<id>]) { updates(limit: 15) { body created_at creator { name } } } }
```

### Repeat Customer Check
Same email lookup as above, filter out the current item and BM/trade-in items.

---

## LLM Summary

### Current Endpoint (can be absorbed into main service)
- **Location:** `/home/ricky/builds/llm-summary-endpoint/server.js`
- **Model:** `gpt-4o-mini` via OpenAI API
- **What it does:** Takes Monday updates, strips HTML, filters junk (parts checks, automated entries, form response summaries), sends to GPT with a prompt asking for 3 sections:
  1. What the client told us
  2. What we found
  3. What we did
- **Timeout:** 5 seconds to OpenAI (too short, increase to 15s)
- **Returns:** `{ summary: { clientSaid, whatWeFound, whatWeDid }, fallback: bool }`

### Update Filtering Rules
Skip updates containing:
- "parts check"
- "***" (separator lines)
- "automated"
- "client form response summary" / "form response summary"

Strip HTML tags, decode entities, convert `<br>` to newlines.

### Prompt
```
You are categorizing repair workshop notes for a customer [collection/drop-off].
Client: [name], Device: [device], Service: [service], Status: [status]

Below are chronological updates from our repair system. Each has a date and the name
of the person who wrote it (CS agents handle intake, techs do repairs).

Categorize into exactly 3 sections. Use concise bullet points. If a section has no
relevant info, write "N/A".

1. What the client told us
2. What we found
3. What we did

Respond in JSON: {"clientSaid":"...","whatWeFound":"...","whatWeDid":"..."}
```

---

## Slack Message Format

### Target Output (Collection)
```
📦  John Smith — Collection

MacBook Pro 16" M3 Pro  ·  Screen Repair  ·  Ready To Collect

💰  ⚠️ Outstanding: Paying £449 on collection
👤  End User

⚠️ Repair difficulties detected
😤 Customer chasing/upset detected

📝  Notes
💬 Client said: Screen cracked after drop, MagSafe charger included
🔍 What we found: Display assembly damaged, no logic board issues
✅ What we did: Genuine display replacement, calibrated True Tone

🧳  Case: No
🔄  First visit

Monday · Intercom
```

### Key Rules
- Device info from Monday item name (not Typeform's vague "MacBook" choice)
- Repair type from `service` column
- Payment: check `dup__of_quote_total` first, then title pattern for "Paying £X on collection"
- Case: ONLY from `status_14` column. Do NOT scan update text for accessory keywords.
- Flags from `color_mkse6rw0` and `color_mkse6bhk` columns, plus keyword scan of updates for difficulty/upset words
- Links as compact footer
- No internal labels ("Case column:", "From updates:")

### Drop-Off Differences
- Header emoji: 📋 instead of 📦
- No payment-on-collection detection
- Add Shopify flag if source column contains "shopify"
- Different Monday groups searched

---

## Infrastructure

### VPS
- **Host:** 46.225.53.159
- **Domain:** `mc.icorrect.co.uk` (SSL via Let's Encrypt, nginx terminates)
- **Nginx** already proxies `/api/summarize-updates` to port 8004. New service needs its own port + nginx location block.

### Credentials
All in `/home/ricky/config/api-keys/.env`:
- `MONDAY_APP_TOKEN` - Monday.com API
- `OPENAI_API_KEY` - for LLM summary
- `SLACK_BOT_TOKEN` - Slack posting
- `TYPEFORM_SECRET` - webhook signature verification (if available)

### Systemd
Create a systemd user service like the existing `llm-summary.service`:
```ini
[Unit]
Description=Intake Notification Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/ricky/builds/intake-notifications
ExecStart=/usr/bin/node server.js
EnvironmentFile=/home/ricky/config/api-keys/.env
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=intake-notifications

[Install]
WantedBy=default.target
```

---

## Existing Code to Extract From

### n8n Collection Workflow (full JS)

The Enrichment Analysis node contains all the business logic. Key functions worth keeping:

1. **Column helper** - parses Monday column values (handles JSON-encoded labels)
2. **Name cleaning** - strips `#1234 -` prefixes and `*Paying...` suffixes
3. **Payment detection** - regex on item title + paid amount column
4. **Flag detection** - difficulty/upset keyword scanning + problem columns
5. **Repeat customer filtering** - excludes current item and BM items

The full n8n workflow exports are saved at:
- `/tmp/n8n-collection-workflow.json`
- `/tmp/n8n-dropoff-workflow.json`

### LLM Summary Endpoint
`/home/ricky/builds/llm-summary-endpoint/server.js` - clean, working code. Absorb the `stripHtml()`, `shouldSkip()`, `formatUpdates()`, `buildPrompt()` functions directly.

---

## Typeform Webhook Setup

After the VPS service is running, update Typeform webhook URLs:
- Collection: point `vslvbFQr` to `https://mc.icorrect.co.uk/webhook/collection`
- Drop-off: point `nNUHw0cK` to `https://mc.icorrect.co.uk/webhook/dropoff`
- Walk-in: point `LtNyVqVN` to `https://mc.icorrect.co.uk/webhook/walkin` (notification only; Intercom+Monday creation stays in n8n)

Typeform can verify webhooks with a signing secret. Implement signature verification if `TYPEFORM_SECRET` is available.

---

## Out of Scope
- Walk-in Intercom ticket + Monday item creation (stays in n8n for now)
- Changing Typeform form structure
- Monday board column changes
- LLM model upgrade (gpt-4o-mini is fine)

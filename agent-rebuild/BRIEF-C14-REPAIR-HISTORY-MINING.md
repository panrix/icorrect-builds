# Brief C14: Repair History Edge Case Mining

**For:** Codex agent
**Output:** `builds/agent-rebuild/repair-history-analysis.md`
**Priority:** High — feeds directly into SOP edge cases and system design

---

## Context

We're building SOPs for iCorrect and need real edge cases, not guesses. The Monday boards contain 12,920 repair items with update threads where the team discussed issues, delays, decisions, and problems. Mining these updates will reveal the actual patterns that SOPs need to handle.

## Boards

| Board | ID | Items | Notes |
|-------|-----|-------|-------|
| iCorrect Main Board | 349212843 | 4,477 | Active + completed repairs |
| Main Board Archive: 2021-2023 | 6162422834 | 8,443 | Historical repairs |

**Credentials:** Source from `/home/ricky/config/api-keys/.env` — use `MONDAY_APP_TOKEN`.

**Monday API:** `POST https://api.monday.com/v2` with GraphQL.

## Task

### Phase 1: Sample and categorise (do this first)

Pull ALL completed repairs from both boards. Paginate through everything.

**Main board (349212843):** Pull all items where `Repaired` date (`date_mkwdan7z`) is populated. Paginate using `items_page` with cursor:
**CRITICAL: You MUST include replies in the query.** The previous pull missed all reply data. Monday stores team conversations as replies nested under update headers like `**** TECH NOTES ****`, `**** GENERAL NOTES ****`, etc. The replies contain the actual team notes, diagnostic findings, and edge case details. Without replies, you get empty placeholder headers.

```graphql
{ boards(ids:[349212843]) { items_page(limit:50, query_params:{rules:[{column_id:"date_mkwdan7z", compare_value:["2023-04-07","2026-12-31"], operator:between}], order_by:{column_id:"date_mkwdan7z", direction:desc}}) { cursor items { id name column_values { id text value } updates { text_body created_at creator { name } replies { text_body created_at creator { name } } } } } } }
```
Then paginate with `next_items_page(cursor: "...")` until all items are retrieved.

**Archive board (6162422834):** Same approach using `collection_date`:
```graphql
{ boards(ids:[6162422834]) { items_page(limit:50, query_params:{rules:[{column_id:"collection_date", compare_value:["2023-04-07","2023-12-31"], operator:between}], order_by:{column_id:"collection_date", direction:desc}}) { cursor items { id name column_values { id text value } updates { text_body created_at creator { name } replies { text_body created_at creator { name } } } } } } }
```

**Note:** Reduced page size to 50 because replies add significant payload per item. Adjust if hitting complexity limits.

**Activity logs:** After pulling all items with updates and replies, pull activity logs for each item. Activity logs are at the board level but can be filtered by item ID:
```graphql
{ boards(ids:[349212843]) { activity_logs(limit:100, item_ids:[ITEM_ID]) { event data created_at user_id } } }
```
This gives the full status change history: every column change, group move, and name update with timestamps and who did it. Store activity logs alongside each item in the output JSON.

**Batch the activity log pulls** — do 5 items per second max to stay within rate limits. This is the most API-intensive part of the pull so add appropriate delays.

**Rate limiting:** Monday API allows 10,000 complexity points per minute. Add 2-second delays between pages. If you hit rate limits, back off and retry.

**Save raw data:** Write all pulled items + updates + replies to `builds/agent-rebuild/data/repair-history-full.json` (not overwriting the previous `repair-history-raw.json`). This is the raw source layer — immutable after creation. We will query this file for multiple purposes: edge cases, team patterns, response times, common faults, and more.
3. Read through the updates and categorise each item by what happened:

**Categories to look for:**
- Normal flow (no issues)
- Parts delay (waiting for parts)
- Extra fault found (tech found additional problem)
- Customer communication issue (can't reach, slow response, changed mind)
- Pricing dispute (customer disagrees with quote)
- Diagnostic complexity (harder than expected, multiple rounds)
- QC rejection (failed quality check, rework needed)
- Warranty/return (device came back)
- Handoff failure (dropped between team members)
- Data quality issue (wrong info, missing fields)
- Escalation (went to Ferrari/Ricky)
- Client no-show / abandoned (never collected)
- Insurance/corporate special handling
- Liquid damage complexity
- Board-level repair complexity

### Phase 2: Pattern extraction

From the categorised sample:
1. For each category, extract **3-5 real examples** (item name, what happened, how it was resolved)
2. Count frequency — which categories appear most?
3. Identify **recurring phrases** in updates that signal problems (e.g. "waiting for customer", "parts not in stock", "needs approval", "tried calling")
4. Note which team members are involved in which types of issues

### Phase 3: Edge case catalogue

Produce a structured catalogue:

| # | Edge Case | Frequency | Current Handling | SOP Gap? | Example Item |
|---|-----------|-----------|-----------------|----------|-------------|

For "Current Handling" — describe what the team actually did based on the updates.
For "SOP Gap" — YES if there's no documented process for this, NO if an existing SOP covers it.

### Phase 4: Recommendations

- Which edge cases are most frequent and should be in SOPs immediately?
- Which edge cases could be prevented by better systems (e.g. automated alerts)?
- Which ones are genuinely rare and can be handled ad-hoc?

## Important

- **Rate limit:** Monday API allows 10,000 complexity points per minute. Use pagination, don't pull everything at once. Add delays between batches.
- **Focus on updates/replies, not just item fields.** The gold is in the conversation threads.
- **The archive board (6162422834) uses the same schema** as the main board. If the 200-item sample from the main board isn't rich enough, pull another 100 from the archive.
- **Do NOT modify any Monday data.** Read-only.
- Source credentials from `/home/ricky/config/api-keys/.env`.

# Brief C15: Main Board Cleanup Analysis

**For:** Codex agent (read-only research)
**Output:** `builds/agent-rebuild/main-board-cleanup-analysis.md`
**Priority:** High — board has 4,477 items, most are dead weight slowing everything down

---

## Context

The iCorrect Main Board (349212843) has 4,477 items. Only ~100-150 are active repairs. The rest are completed, collected, abandoned, or stale. We need to clean it up before migrating to Main Board v2 (18401861682). We can move items via the `move_item_to_board` API mutation, but we need to know exactly what's safe to move first.

## Task

### 1. Group inventory

Pull all groups from board `349212843` and count items per group:

```graphql
{ boards(ids:[349212843]) { groups { id title } } }
```

Then for each group, count items and get a sample of statuses:

```graphql
{ boards(ids:[349212843]) { groups { id title items_page(limit:5) { items { id name } } } } }
```

Use `items_count` or paginate to get accurate counts per group.

### 2. Status breakdown

Pull the main status column values and count items per status. Identify which statuses mean "done" vs "active":

- Completed / Collected / Shipped / Delivered = archivable
- In Progress / Diagnostics / Waiting for Parts / Waiting for Approval = active
- Any other statuses — categorise as active, stale, or archivable

### 3. Age analysis

For all items, check:
- Items with a `Repaired` date (`date_mkwdan7z`) — these are done
- Items with no activity (no updates) in the last 90 days — likely abandoned
- Items with no `Repaired` date and no updates in 180+ days — definitely stale

Produce a breakdown:

| Category | Count | Criteria | Safe to Archive? |
|----------|-------|----------|-----------------|
| Completed (has Repaired date) | ? | `date_mkwdan7z` populated | YES |
| Collected (status = collected) | ? | status check | YES |
| Stale (no updates 180+ days, no Repaired date) | ? | last update check | PROBABLY — flag for review |
| Active (recent updates or active status) | ? | status + recency | NO |
| Ambiguous | ? | doesn't fit above | FLAG |

### 4. Column mapping check

For the archive move to work, we need column compatibility. Pull the full column list from board `349212843`:

```graphql
{ boards(ids:[349212843]) { columns { id title type } } }
```

And from the existing archive board `6162422834`:

```graphql
{ boards(ids:[6162422834]) { columns { id title type } } }
```

Compare: which columns match by ID? Which match by name but different ID? Which are on the main board but not the archive? This tells us whether we can move to the existing archive board or need a new one.

### 5. Subitem check

How many items on the main board have subitems? Subitems move with items via the API, but we need to know the volume:

```graphql
{ boards(ids:[349212843]) { items_page(limit:100) { items { id name subitems { id } } } } }
```

Count items with 1+ subitems.

### 6. Recommendations

Based on findings, recommend:
- How many items are safe to archive immediately
- Whether to use the existing archive board (6162422834) or create a new one
- Which items need manual review before archiving
- Suggested batch size for the move (to avoid API issues)
- Any items that should be deleted rather than archived (test items, duplicates, empty items)

## Important

- **Do NOT move, modify, or delete any items.** Read-only analysis.
- Source credentials from `/home/ricky/config/api-keys/.env` — use `MONDAY_APP_TOKEN`.
- Rate limit: 10,000 complexity points per minute. Add delays between queries.

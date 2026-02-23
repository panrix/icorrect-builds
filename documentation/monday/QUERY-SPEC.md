# Monday Repair Flow Trace — Query Spec for Code

**Author:** Jarvis
**Date:** 23 Feb 2026
**Output:** `builds/documentation/monday/repair-flow-traces.md`
**Board:** iCorrect Main Board (349212843)

---

## Objective

Trace the actual status journey of completed repairs to document how items really move through Monday. This feeds into the Supabase schema design and the Monday cleanup plan.

---

## Samples Required

Pull 10 completed items for each combination. "Completed" = status is Returned, Ready To Collect, Shipped, or similar end state.

| # | Client (status column: `status`) | Type | Filter | Timeframe |
|---|----------------------------------|------|--------|-----------|
| 1 | Walk-in (Service `service` = "Walk-In") | Repair (Repair Type `status24` = "Repair") | Last 90 days | |
| 2 | Walk-in | Diagnostic (`status24` = "Diagnostic") | Last 90 days | |
| 3 | Mail-in (Service `service` = "Mail-In" or "External Mail-In") | Repair | Last 90 days | |
| 4 | Mail-in | Diagnostic | Last 90 days | |
| 5 | Corporate (Client `status` = "Corporate") | Repair | Last 90 days | |
| 6 | Corporate | Diagnostic | Last 90 days | |
| 7 | BM (Client `status` = "BM") | Functional (Function Reported `color_mkqg578m` = functional equivalent) | Last 7 days | |
| 8 | BM | Not Functional (Function Reported = not functional equivalent) | Last 7 days | |

**Total: 80 items**

If a combination doesn't have 10 items in the timeframe, take as many as exist and note the shortfall.

---

## Column IDs Reference

**Filters:**
- Service type: `service` (status column)
- Client type: `status` (status column — yes the ID is literally "status")
- Repair type: `status24` (status column)
- Main status: `status4` (status column)
- Function Reported: `color_mkqg578m` (status column)
- Function Actual: `color_mkqgj96q` (status column)

**Data to pull per item:**
- `name` — item name
- `item_id` — Monday item ID
- `service` — service type
- `status` — client type
- `status24` — repair type
- `status4` — current status
- `date4` — received date
- `date_mkypmgfc` — intake timestamp
- `date_mkwdmm9k` — diagnostic complete date
- `date_mkwdwx03` — quote sent date
- `collection_date` — date repaired
- `date3` — collection date
- `date_mkypt8db` — QC time
- `person` — technician
- `multiple_person_mkyp2bka` — QC by

**BM items additionally:**
- `color_mkqg66bx` — Battery (Reported)
- `color_mkqg4zhy` — Battery (Actual)
- `color_mkqg7pea` — Screen (Reported)
- `color_mkqgtewd` — Screen (Actual)
- `color_mkqg1c3h` — Casing (Reported)
- `color_mkqga1mc` — Casing (Actual)
- `color_mkqg578m` — Function (Reported)
- `color_mkqgj96q` — Function (Actual)
- `color_mkqg8ktb` — Liquid Damage?
- `color_mkypbg6z` — Trade-in Status
- `text_mky01vb4` — BM Trade-in ID

---

## Activity Log Query

For each of the 80 items, pull the activity log to get status change history:

```graphql
{
  boards(ids: [349212843]) {
    activity_logs(item_ids: [ITEM_ID], column_ids: ["status4"]) {
      event
      data
      created_at
    }
  }
}
```

Parse each activity log entry to extract:
- Previous status value
- New status value  
- Timestamp of change
- Who made the change (if available)

Build the full timeline: Status A (timestamp) → Status B (timestamp) → Status C (timestamp) etc.

Calculate duration in each status (time between transitions).

---

## Output Format

Write to `builds/documentation/monday/repair-flow-traces.md`

### Structure per flow type:

```
## Walk-in + Repair (10 items)

### Common Pattern
New Repair → Received → Diagnostics → Diagnostic Complete → Queued For Repair → Under Repair → Repaired → Ready To Collect → Returned
Average total time: X days
Longest dwell: [status] at X days

### Item Traces
1. [Item Name] (ID: xxxxx) — Received: [date], Tech: [name]
   New Repair (0h) → Received (2h) → Diagnostics (1d) → ...
   Total: X days

2. [Item Name] ...
   ...

### Anomalies
- Item 4 went Repair Paused for 5 days (awaiting customer approval)
- Item 7 had QC Failure → back to Under Repair → Repaired
```

### BM section additionally includes:

```
## BM + Functional (10 items)

### Reported vs Actual Comparison
| Item | Battery R/A | Screen R/A | Casing R/A | Function R/A | Liquid? |
|------|-------------|------------|------------|--------------|---------|
| BM-xxx | Good/Good | Good/Fair | Good/Good | Yes/Yes | No |
...

### Discrepancy Rate
- X/10 items had at least one reported vs actual mismatch
- Most common mismatch: [column]
```

---

## After Completion

1. Push to GitHub: `cd /home/ricky/builds && git add -A && git commit -m "Monday repair flow traces — 80 items across 8 flow types" && git push`
2. Note any items where activity log was empty or incomplete
3. Note any flow types with fewer than 10 items
4. Flag any status transitions that seem wrong (e.g. skipping expected steps)

---

## API Notes

- Monday API rate limit: 10,000,000 complexity points per minute. Each query costs ~1,000-10,000 depending on items returned. 80 items + activity logs should be well within limits.
- Use `items_page` with `query_params` for filtering
- Activity logs may need pagination for items with many status changes
- Monday API token: source from `/home/ricky/config/api-keys/.env` as `MONDAY_API_TOKEN`

---

## Files to Read First

- `builds/documentation/monday/board-schema.md` — full column inventory and group mapping
- `builds/documentation/raw-imports/monday-schema.md` — Claude.ai's partial schema (for additional context)

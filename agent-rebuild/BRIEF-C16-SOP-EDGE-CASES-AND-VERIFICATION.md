# Brief C16: SOP Edge Case Enrichment + Monday Verification

**For:** Codex agent
**Output:** `builds/agent-rebuild/sop-edge-cases-and-verification.md`
**Priority:** High — new team member starting on these SOPs this week

---

## Context

We have 12 SOPs in `/home/ricky/kb/operations/`. They cover happy paths only. A new team member (Naheed) is starting this week handling intakes, BM diagnostics, shipping, and parts intake. Before we give him these SOPs, we need to:

1. Add edge cases from real repair history data
2. Verify every Monday reference (column names, statuses, groups) is correct

## Data Sources

**Repair history with full team conversations:**
`/home/ricky/builds/agent-rebuild/data/repair-history-full.json`
- 1,889 items, 40,290 replies, 17,992 activity logs
- Structure: `items[].updates[].replies[]` and `items[].activity_logs[]`

**Edge case analysis (from first pass):**
`/home/ricky/builds/agent-rebuild/repair-history-analysis.md`

**Current SOPs:**
All files matching `/home/ricky/kb/operations/sop-*.md`

**Monday board schema (live verified):**
- `/home/ricky/kb/monday/main-board.md`
- `/home/ricky/kb/monday/bm-devices-board.md`
- `/home/ricky/kb/monday/parts-board.md`

**Monday API for live verification:**
Source credentials from `/home/ricky/config/api-keys/.env` — use `MONDAY_APP_TOKEN`.

---

## Task Part 1: Edge Case Enrichment

For each SOP, search the repair history JSON for real examples of what goes wrong at that stage.

### Method

For each SOP file:
1. Read the SOP and identify the key process steps
2. Search the repair history replies for conversations that relate to that process stage. Use keyword matching on reply text:
   - Walk-in intake → search for: "walk-in", "walked in", "no appointment", "drop off", "dropped off", "passcode", "wrong password", "no booking"
   - Mail-in → search for: "mail-in", "posted", "courier", "shipped to us", "received device", "doesn't match"
   - BM trading → search for: "trade-in", "buyback", "BM", "grade", "functional cracked", "non-functional"
   - BM sale → search for: "listed", "sold", "buy box", "dispatch", "label"
   - Diagnostics → search for: "diagnostic", "fault found", "extra fault", "additional issue", "liquid damage", "board level"
   - Collection → search for: "collect", "picked up", "no show", "abandoned"
   - Quoting → search for: "quote", "price", "too expensive", "not worth it", "declined", "approved"
   - Parts → search for: "out of stock", "low stock", "parts", "ordered", "waiting for parts"
   - QC → search for: "QC", "quality check", "failed", "rework", "rejection"
   - Shipping → search for: "ship", "dispatch", "label", "wrong device", "wrong address"
   - Handoff → search for: "who's doing", "assigned", "waiting on", "forgot", "nobody"
   - Customer comms → search for: "can't reach", "no reply", "tried calling", "customer said", "not happy"

3. For each match, extract:
   - Item name and ID
   - The relevant reply text (the actual team conversation)
   - What went wrong
   - How the team handled it
   - What the SOP should say about this scenario

4. Group edge cases by SOP and by type (parts delay, customer comms, extra fault, etc.)

### Output format for Part 1

For each SOP, produce:

```
### sop-walk-in-simple-repair.md

#### Edge Cases Found: X

**1. Wrong password at intake (5 occurrences)**
Real examples:
- "Dwayne Morris" (11020062035): Customer had to call back with passcode before work could start
- [more examples]

What to add to SOP:
> At intake, verify device passcode with the customer before they leave. If passcode is wrong or missing, do not accept the device without recording an alternative contact method and expected callback time.

**2. Extra fault found during repair (3 occurrences)**
[etc.]
```

---

## Task Part 2: Monday Field Verification

For each SOP, extract every reference to Monday — column names, status values, group names, field names.

Then verify each one against the live Monday API:

```graphql
{ boards(ids:[349212843]) { columns { id title type settings_str } groups { id title } } }
```

And for BM board:
```graphql
{ boards(ids:[3892194968]) { columns { id title type settings_str } groups { id title } } }
```

Use `settings_str` to extract the actual status label options for status columns.

### Output format for Part 2

For each SOP, produce:

```
### sop-walk-in-simple-repair.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Move to Diagnostics group" | Group "Diagnostics" exists (id: new_group12345) | YES | — |
| "Set status to In Progress" | Status column has "In Progress" option | YES | — |
| "Update Repair Notes field" | No column called "Repair Notes" — closest is "long_text5" titled "Repair Notes" | PARTIAL | Use column ID long_text5 |
| "Check Parts Required" | Column "board_relation" exists for Parts | YES | — |
```

### Also check:
- Are there Monday statuses used in practice (from activity logs) that no SOP mentions?
- Are there groups that items move through (from activity logs) that no SOP covers?
- Are there columns that techs fill in (from activity logs) that no SOP references?

Pull this from the activity logs in the repair history JSON — `activity_logs[].event == "update_column_value"` and `activity_logs[].event == "move_pulse_from_group"` will show actual column and group usage.

---

## Task Part 3: Gap Summary

Produce a single summary:

| SOP | Edge Cases Found | Monday Issues | Ready for Naheed? |
|-----|-----------------|---------------|-------------------|
| sop-walk-in-simple-repair.md | 8 | 2 field name mismatches | NO — needs fixes |
| sop-bm-trading.md | 12 | 0 | YES after edge case additions |
| [etc.] | | | |

And a priority list: which SOPs does Naheed need first (based on his role: intakes, BM diagnostics, shipping, parts intake)?

---

## Important

- **Do NOT modify any SOP files.** Produce recommendations only. Ricky will review and approve changes.
- **Do NOT modify Monday data.** Read-only API calls for verification.
- The repair history JSON is 55MB. Use streaming/chunked reads if needed. Search by keyword, don't try to load the entire file into context at once.
- Source credentials from `/home/ricky/config/api-keys/.env`.

# Research Brief: Monday Data Quality Audit

## Objective
Quantify how much of the Monday main repair board is real active WIP versus zombie/stale data. The business currently shows 900 non-terminal items. We need to know the true state before building automation on top.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/monday-data-quality-audit.md`

## Required analysis

1. Pull the full main repair board item inventory via Monday GraphQL API
2. Classify every non-terminal item into: active WIP (touched in last 30 days), stale (30-90 days untouched), zombie (90+ days untouched), and ambiguous
3. Break down by status group and status label
4. Identify the top stale status clusters (e.g. how many "Awaiting Confirmation" items are 6+ months old)
5. Flag items with missing critical fields (no customer name, no device, no status date)
6. Quantify: of the 900 non-terminal items, what % is genuinely actionable vs dead weight
7. Recommend: cleanup candidates (archive/close) vs items needing human review vs genuinely active

## Credentials
Source `/home/ricky/config/api-keys/.env` for MONDAY_APP_TOKEN.
Monday GraphQL endpoint: https://api.monday.com/v2

## Context files to read first
- `/home/ricky/builds/system-audit-2026-03-31/findings.md` (sections on Monday queue state)
- `/home/ricky/builds/system-audit-2026-03-31/timing-mapping.md` (status age data)
- `/home/ricky/builds/system-audit-2026-03-31/handoff-failure-matrix.md` (H08 section)
- `/home/ricky/kb/monday/` for board schema context

## Rules
- Use the Monday API directly with curl
- Rate limit: max 1 request per second, respect complexity limits
- Do NOT modify any Monday data. Read only.
- Write findings to the output file progressively

When completely finished, run this command to notify:
openclaw system event --text "Done: Monday data quality audit complete. Output in monday-data-quality-audit.md" --mode now

# Research Brief: Diagnostics Deep Dive

## Objective
Map the full diagnostic workflow from intake to resolution using real Monday data. We want to understand: what diagnostics look like, what gets written up, how long they take, what converts to repair, and where the bottlenecks are. The business wants to grow its non-functional/diagnostic work but needs data to inform that.

## What to produce
Write output to: `/home/ricky/builds/system-audit-2026-03-31/diagnostics-deep-dive.md`

## Board Details
Main Repair Board: 349212843
Monday GraphQL endpoint: https://api.monday.com/v2

## Required Analysis

### 1. Diagnostic Volume and Identification
- Pull all items from the main board that have gone through a diagnostic stage
- Identify diagnostic jobs by: service type containing "diagnostic" or similar, OR items that passed through a "Diagnostic Complete" status
- Count: total diagnostics in last 6 months, by month
- Break down by device type (MacBook, iPhone, iPad, Watch)
- Break down by fault type / service category where available

### 2. Written Updates / Diagnostic Reports
- For each diagnostic job, pull the item updates (Monday updates/notes)
- Extract what was actually written as the diagnostic finding
- Categorize the quality: detailed write-up vs thin/missing notes
- Look for patterns in what gets documented vs what doesn't
- Sample and quote representative examples (good and bad)
- Flag jobs where diagnostic was marked complete but no meaningful update was written

### 3. Timeline Analysis
- For each diagnostic job, extract all available date milestones:
  - Created / Received date
  - Diagnostic Complete date
  - Quote Sent date (if applicable)
  - Customer response / approval date (if traceable)
  - Repair started / Date Repaired (if converted to repair)
  - Returned / Shipped date
- Calculate:
  - Time to diagnostic complete (received → diag complete)
  - Time from diagnostic to quote sent
  - Time from quote to customer response
  - Time from approval to repair complete
  - Total end-to-end time
- Show median, p75, p90 for each stage
- Compare diagnostic-only jobs vs diagnostic-that-converted-to-repair

### 4. Conversion Funnel
- Of all diagnostics completed, how many:
  - Resulted in a quote being sent?
  - Got customer approval?
  - Converted to a completed repair?
  - Were declined / cancelled / abandoned?
  - Are still sitting in limbo (quote sent, no response)?
- Calculate conversion rate at each stage
- Break down by device type and fault category
- Identify the biggest drop-off point in the diagnostic → repair funnel

### 5. Technician Analysis (especially Safan)
- Map which technician handled each diagnostic (from the person/technician column or from update author)
- Show diagnostic volume per technician
- Show average diagnostic time per technician
- Show conversion rate per technician (do some techs write better diagnostics that convert more?)
- Specifically call out Safan's numbers: volume, speed, quality of write-ups, conversion rate
- Identify if Safan is a capacity bottleneck: what % of diagnostics flow through him?

### 6. Revenue and Margin Signal
- For diagnostics that converted to repairs: what was the average repair value?
- For diagnostic-only jobs: what was charged (if anything)?
- Estimate the revenue potential of growing diagnostic volume by 25%, 50%, using current conversion rates

### 7. Non-Functional Device Analysis
- Specifically identify non-functional / liquid damage / "won't turn on" type diagnostics
- These are the growth target. What do the numbers look like?
- Conversion rate for non-functional vs standard diagnostics
- Average repair value when non-functional diagnostics convert
- Common outcomes (repairable, BER, data recovery only, etc.)

## Credentials
Source `/home/ricky/config/api-keys/.env` for MONDAY_APP_TOKEN.

## Context files to read first
- `/home/ricky/builds/system-audit-2026-03-31/staff-performance-analysis.md` (Safan data)
- `/home/ricky/builds/system-audit-2026-03-31/timing-mapping.md` (existing timeline data)
- `/home/ricky/builds/system-audit-2026-03-31/findings.md` (diagnostic and queue findings)
- `/home/ricky/kb/monday/main-board.md` (board schema)

## Rules
- Read only. Do not modify any Monday data.
- Rate limit: max 1 request per second on Monday API
- Pull item updates via the Monday API updates query for diagnostic items
- Write findings progressively to the output file

When completely finished, run this command to notify:
openclaw system event --text "Done: Diagnostics deep dive complete. Output in diagnostics-deep-dive.md" --mode now

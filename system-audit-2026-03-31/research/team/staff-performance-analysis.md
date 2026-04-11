# Staff Performance From Repair Data

Last updated: 2026-04-01

## Scope

This file is the dedicated output for Track 2 from `RESEARCH-EXPANSION-BRIEF.md`.

Evidence base:
- activity log export: `/home/ricky/data/exports/system-audit-2026-03-31/monday/staff-performance-activity-logs-2026-04-01.json`
- item-detail export: `/home/ricky/data/exports/system-audit-2026-03-31/monday/staff-performance-items-2026-04-01.json`
- summary export: `/home/ricky/data/exports/system-audit-2026-03-31/monday/staff-performance-summary-2026-04-01.json`

Analysis window:
- `2025-10-01` through `2026-04-01`

Technician set used:
- Safan Patel (`25304513`)
- Misha Kepeshchuk (`64642914`)
- Andreas Egas (`49001724`)
- Roni Mykhailiuk (`79665360`)
- Michael Ferrari (`55780786`)

## Short Answer

- `Observed`: Safan is the clear completion-volume leader in the accessible six-month data.
- `Observed`: Misha and Andreas are the next two real bench-output contributors.
- `Observed`: Roni’s completion footprint exists but is smaller and older in the window.
- `Observed`: Ferrari is not a meaningful completion-volume resource in the accessible log slice, though that conclusion is softened by the fact that his activity log hits the API cap.
- `Observed`: QC/rework proxies are materially non-trivial across the main technical completers.
- `Observed`: paid-value attribution, where visible, is strongest per completed item for Misha, not Safan.

## 1. Completion Volume

### Unique Completed Items Attributed By Status Change

- `Observed`: the six-month pull found `1,762` completion events across `1,275` unique completed items.
- `Observed`: per-tech unique completion counts are:
  - Safan Patel: `610`
  - Misha Kepeshchuk: `339`
  - Andreas Egas: `230`
  - Roni Mykhailiuk: `89`
  - Michael Ferrari: `7`

### Monthly Trend

- `Observed`: Safan is high-volume across the whole window but trends down in raw completions:
  - Oct `139`
  - Nov `98`
  - Dec `105`
  - Jan `99`
  - Feb `86`
  - Mar `78`
- `Observed`: Misha is more stable and improves after December:
  - Oct `57`
  - Nov `64`
  - Dec `37`
  - Jan `49`
  - Feb `69`
  - Mar `62`
- `Observed`: Andreas ramps materially from December onward:
  - Oct `12`
  - Nov `15`
  - Dec `47`
  - Jan `55`
  - Feb `59`
  - Mar `41`
- `Observed`: Roni’s completion activity is concentrated earlier in the window:
  - Oct `52`
  - Nov `26`
  - Dec `6`
  - Jan `4`
  - Mar `1`
- `Inferred`: current completion capacity is primarily Safan + Misha + Andreas, not a broad evenly-distributed bench.

## 2. Speed And Efficiency

### Elapsed Speed

- `Observed`: median `Received -> Date Repaired` by completer is:
  - Ferrari: `1 day` on a tiny sample
  - Misha: `2 days`
  - Andreas: `2 days`
  - Safan: `5 days`
  - Roni: `8 days`
- `Observed`: p75 `Received -> Date Repaired` is:
  - Ferrari: `2 days`
  - Andreas: `5 days`
  - Misha: `7 days`
  - Roni: `8 days`
  - Safan: `12 days`
- `Observed`: median `Received -> Diag. Complete` is:
  - Safan: `4 days`
  - Misha: `5 days`
  - Andreas: `7 days`
  - Roni: `9 days`

### Same-Day Completion

- `Observed`: same-day completion rate is:
  - Safan: `10.5%`
  - Andreas: `8.3%`
  - Misha: `6.8%`
  - Roni: `3.4%`
  - Ferrari: `0%`

### Working-Day Output

- `Observed`: completions per working day, using days with at least one completion event, are:
  - Safan: `4.49`
  - Misha: `2.49`
  - Andreas: `2.45`
  - Roni: `2.02`
  - Ferrari: `1.00`
- `Observed`: peak daily completion counts are:
  - Safan: `10`
  - Roni: `8`
  - Misha: `5`
  - Andreas: `5`
  - Ferrari: `1`

### Time-Tracking Medians

- `Observed`: median tracked work times per completed item are:
  - Safan:
    - diagnostic `0.57h`
    - repair `0.62h`
    - refurb `1.52h`
    - total tracked lifecycle `120.15h`
  - Misha:
    - diagnostic `0.43h`
    - repair `0.65h`
    - refurb `1.68h`
    - total tracked lifecycle `75.31h`
  - Andreas:
    - diagnostic `0.55h`
    - repair `0.83h`
    - refurb `1.41h`
    - total tracked lifecycle `51.93h`
  - Roni:
    - diagnostic `0.24h`
    - repair `0.53h`
    - refurb `0.69h`
    - total tracked lifecycle `197.48h`
- `Inferred`: the tracked active bench time is tiny relative to total lifecycle time, which reinforces the broader audit conclusion that queue delay and waiting states dominate elapsed duration.

## 3. Quality Proxies

### QC Failure Proxy

- `Observed`: the analysis found `119` QC Failure events in the six-month activity-log window.
- `Observed`: when attributed back to the tech who first completed the item in the window, QC-failure proxy rates are:
  - Misha: `9.7%`
  - Safan: `8.9%`
  - Andreas: `7.4%`
  - Roni: `2.2%`
  - Ferrari: `0%`
- `Inferred`: QC/rework load is non-trivial across the main bench operators and should not be treated as isolated incidents.

### Repeat Completion Proxy

- `Observed`: items with multiple completion events in the window produce a rework/repeat-completion proxy:
  - Safan: `32.3%`
  - Roni: `25.8%`
  - Andreas: `24.3%`
  - Misha: `23.6%`
  - Ferrari: `57.1%` on a tiny sample
- `Observed`: this is a proxy, not a clean post-sale return metric.
- `Inferred`: repeat handling is a real workload layer sitting on top of first-pass throughput.

## 4. Revenue Attribution

### Paid Value Surface

- `Observed`: the usable value surface for this pass was `dup__of_quote_total` (`Paid`), not the empty quote formula field.
- `Observed`: paid-value attribution is only present on a subset of completed items, so this is partial, not complete revenue attribution.

### Paid Value By Tech

- `Observed`: visible paid value by attributed completer is:
  - Safan: `£38,622.50` across `153` items, average `£252.43`
  - Misha: `£25,671.00` across `62` items, average `£414.05`
  - Andreas: `£6,504.00` across `26` items, average `£250.15`
  - Roni: `£2,743.00` across `8` items, average `£342.88`
  - Ferrari: no visible paid-value rows in this slice
- `Inferred`: Misha appears to be touching fewer but higher-value paid jobs than Safan in the visible paid subset.

## 5. Work Mix

### Service-Type Mix

- `Observed`: the dominant visible service types are Mail-In and Walk-In.
- `Observed`: top service mix by completer is:
  - Safan:
    - Mail-In `154`
    - Walk-In `138`
    - Gophr Courier `20`
  - Misha:
    - Mail-In `97`
    - Walk-In `55`
    - Gophr Courier `8`
  - Andreas:
    - Mail-In `71`
    - Walk-In `27`
    - Unconfirmed `13`
  - Roni:
    - Mail-In `29`
    - Walk-In `8`
  - Ferrari:
    - Mail-In `3`
    - Walk-In `1`

### Client-Type Mix

- `Observed`: Safan has the broadest split across End User, BM, and Corporate work.
- `Observed`: Misha and Andreas both carry significant BM mix.
- `Observed`: Roni’s visible completion mix leans unusually Corporate in the accessible slice.

### Repair-Type Mix

- `Observed`: the current repair-type field is mixed operationally and includes categories such as `Sold`, `Repair`, and `Diagnostic`, so it is useful for workload shape but not a clean repair taxonomy.
- `Inferred`: a more precise device-type and fault-type split will need another data surface beyond the current field text exported here.

## 6. What This Means

- `Observed`: bench output is concentrated, not distributed.
- `Observed`: Safan is the main throughput engine by count.
- `Observed`: Misha appears to be the strongest visible higher-value completer in the paid subset.
- `Observed`: Andreas has become a material contributor but at lower total volume than Safan and Misha.
- `Observed`: Ferrari should not be treated as a meaningful completion-capacity buffer in current operations.
- `Inferred`: the business does not just need more “work done”; it needs protected high-skill throughput from Safan/Misha/Andreas with less queue drag and less repeat work.

## 7. Limitations

- `Observed`: Ferrari’s activity pull lands exactly on `10,000` entries, so his activity surface is likely capped and incomplete.
- `Observed`: device family could not be cleanly resolved from the current exported board-relation text surface.
- `Observed`: paid-value attribution is partial because the `Paid` column is not populated on every completed item.
- `Observed`: QC-failure and repeat-completion metrics are proxies, not a perfect root-cause attribution model.

## Conclusion

- `Observed`: the staff-performance layer is now evidence-backed enough to identify the real throughput owners and the main quality/rework pressure points.
- `Inferred`: the next improvement step is not generic productivity pressure. It is:
  - protect Safan/Misha/Andreas from avoidable queue drag
  - reduce repeat/QC burden
  - tighten the structured value/device surfaces so performance can be measured cleanly by job type and contribution

# Team Operations Summary

Last updated: 2026-04-01

## Source Priority

- `Observed`: `/home/ricky/kb/team/roster.md`
- `Observed`: `/home/ricky/builds/team-audits/CLAUDE.md`
- `Observed`: `/home/ricky/builds/team-audits/reports/*`
- `Observed`: `/home/ricky/.openclaw/agents/team/workspace/docs/team-performance-audit.md`
- `Observed`: `/home/ricky/.openclaw/shared/TEAM.md`
- `Observed`: `/home/ricky/.openclaw/agents/customer-service/workspace/docs/shared-context/team-context.md`

## Current Team State

- `Observed`: the current roster source of truth is [`roster.md`](/home/ricky/kb/team/roster.md), not the older project overview files.
- `Observed`: [`PROJECT_OVERVIEW.md`](/home/ricky/builds/team-audits/PROJECT_OVERVIEW.md) still shows multiple audits as pending.
- `Observed`: [`CLAUDE.md`](/home/ricky/builds/team-audits/CLAUDE.md) marks Ferrari, Safan, Mykhailo, Roni, Adil, and Andreas as complete audits.
- `Observed`: [`roster.md`](/home/ricky/kb/team/roster.md) records Adil as dismissed on 2026-03-05, so some February team docs are now partially historical.

## Active Team And Operational Ownership

### Ricky Panesar

- `Observed`: operational owner across systems and decisions.
- `Inferred`: primary escalation point for Monday, Back Market, finance, staffing, and automation ownership.

### Safan Patel

- `Observed`: lead repair technician, Monday user `25304513`, workshop-based, six days per week.
- `Observed`: roster notes `54%` of all repairs, `4.2` completions/day, and `11.8%` QC rework rate.
- `Observed`: team audit framework treats Safan as Type A repair-tech workload.
- `Inferred`: core owner of repair throughput, especially standard repair queue movement in Monday.

### Misha Kepeshchuk

- `Observed`: lead refurb technician, Monday user `64642914`.
- `Observed`: roster notes `3.4` completions/day and day-to-day supervision of Andreas.
- `Inferred`: operational owner of refurb workflow quality and secondary workshop leadership.

### Andreas Egas

- `Observed`: refurb technician, Monday user `49001724`.
- `Observed`: roster notes `3.2` completions/day and `2.2%` QC rework rate.
- `Observed`: older team-performance audit files show Andreas also touching intake-like serial-entry work during some periods.
- `Inferred`: refurb-focused, but occasionally absorbs front-desk or intake spillover when coverage is thin.

### Roni Mykhailiuk

- `Observed`: QC lead + BM diagnostics + parts manager, Monday user `79665360`.
- `Observed`: roster describes three concurrent roles and burnout risk.
- `Observed`: team audit scripts explicitly measure Roni against total team repair output for QC coverage.
- `Inferred`: one of the main cross-team bottleneck nodes because QC, parts, and BM diagnostics converge on one person.

### Michael Ferrari

- `Observed`: client services, Monday user `55780786`, remote in Italy.
- `Observed`: roster states average response time `45.3h` and reply rate `30%`.
- `Observed`: Ferrari audit found high context-switching, low proportion of revenue-generating work, and large missed-revenue leakage.
- `Observed`: Intercom attribution is partially obscured by the shared support admin model.
- `Inferred`: primary owner of customer comms, quotes, invoicing coordination, and some corporate/client follow-up, but with fragmented ownership boundaries.

### Suzy

- `Observed`: listed as Managing Director title-only and not operationally active.

## Historical / No Longer Current

### Adil Azad

- `Observed`: older February team audits analyze Adil as front desk + intake + BM diagnostics.
- `Observed`: the current roster marks him dismissed on 2026-03-05.
- `Inferred`: any current intake/front-desk ownership assumptions that still rely on Adil are stale and need replacement in process docs.

## Cross-Team Constraints

- `Observed`: team audits warn that Monday activity is inflated by n8n actions running under human API tokens.
- `Observed`: team audits warn that Intercom uses a shared support admin seat/account, which weakens per-person attribution.
- `Observed`: team audits rely heavily on Monday activity logs and therefore measure system activity better than physical-presence work.
- `Observed`: front-desk/intake work is especially sensitive to missing Monday events and broken Typeform -> Monday sync.

## System Ownership View

### Monday.com

- `Observed`: Monday is the main measurable operational surface for workshop technicians and front-desk process tracing.
- `Observed`: user IDs for Safan, Mykhailo, Andreas, Roni, Ferrari, and Adil are already defined in team-audit docs.
- `Inferred`: Monday remains the best system for work-allocation, queue-state, and completion-speed analysis.

### Intercom

- `Observed`: Ferrari-side work is partially visible through Intercom, but the shared support account prevents clean individual attribution.
- `Inferred`: Intercom is suitable for team-level response and coverage analysis, but weak for person-level accountability unless separate seats are introduced.

### Typeform / Intake

- `Observed`: Adil audit notes the Typeform -> Monday integration broke around early February while Slack still received submissions.
- `Inferred`: intake coverage and front-desk performance measurement are weaker than repair-tech measurement because intake-system instrumentation is less reliable.

### Back Market / QC / Parts

- `Observed`: Roni spans QC, parts, and BM diagnostics.
- `Inferred`: BM and workshop throughput cannot be modeled cleanly without treating Roni as a shared dependency across multiple workflows.

## What This Adds To The Main System Audit

- `Observed`: there is already substantial person-level audit material outside the main system-audit workspace.
- `Inferred`: the main remaining synthesis task is not “research who the team is” but “bind each workflow to the real person/team owner and handoff dependency.”
- `Observed`: the next major unmapped layer after this summary is timing:
  - customer response time
  - diagnostic response/completion time
  - repair duration
  - quote-to-approval lag
  - payment-to-closure lag

## Remaining Team Questions

- Which current front-desk/intake owner replaced the work historically measured under Adil?
- Which parts of Ferrari’s communication workload are actually handled by AI, Slack escalation, or other staff rather than Ferrari directly?
- Which workshop delays are people-capacity issues versus missing-system/queue-management issues?

# Operations System Rebuild
Last updated: 2026-04-25 05:55 UTC

## Purpose
This is the working project for rebuilding iCorrect's operating system.

The goal is not just to write SOPs.
The goal is to:
- capture how the business actually works today
- separate messy current reality from cleaner target-state design
- reduce person-dependence and hidden coordination work
- define the control layer needed before safe automation
- move toward a better operating system beyond the current Monday substrate

## Current Phase
Current phase: truth capture and operating-model rebuild.

What has already been established:
- the business problem has been framed as an operations-system rebuild, not a narrow documentation task
- key system-audit findings have been pulled into working docs
- a team ownership map has been created
- the Ferrari dependency has been reframed as partly real value and partly system weakness
- enquiry -> intake -> triage -> quote work has started

## Start Here
Read in this order:
1. `docs/business-problem-frame.md`
2. `docs/system-audit-working-map.md`
3. `docs/team-ownership-map.md`
4. `docs/ops-data-source-index.md`
5. `docs/ferrari-dependency-assessment-2026-04-24.md`

Then move into active domain docs as they are created under `docs/domains/`.

## Core Project Outputs
This project is intended to produce:
- current-state process maps
- target-state operating rules
- ownership maps
- SOP backlog and draft SOPs
- KB backlog and draft KB outputs
- decision trees and escalation rules
- automation-ready workflow specs

## Source-of-Truth Rules
- Canonical shared knowledge: `/home/ricky/kb`
- Working project docs and design artifacts: this build directory
- Historical audits and evidence sources: other relevant directories under `/home/ricky/builds/`

Do not treat old workspace memory or stale notes as stronger than verified evidence plus current project docs.

## Evidence Layer
Primary evidence for this project should come from:
- `/home/ricky/builds/system-audit-2026-03-31/`
- `/home/ricky/builds/team-audits/`
- `/home/ricky/builds/alex-triage-rebuild/`
- `/home/ricky/builds/claude-project-export/sop-project/`
- `/home/ricky/builds/intake-system/`
- `/home/ricky/builds/backmarket/`
- `/home/ricky/builds/agent-rebuild/`

## Active Thread
Most recent active thread before this README existed:
- enquiry -> intake -> triage work had progressed
- accepted diagnostic -> repair queue -> workshop handoff questioning had reached question 22
- next checkpoint question noted in workspace state was: what actually happens today if the part is not in stock?

Treat that as a working checkpoint, not final canon, until the proper domain doc is re-opened and continued.

## Next Recommended Moves
1. Create a proper `docs/INDEX.md` control file
2. Build domain folders under `docs/domains/`
3. Resume the workshop-handoff domain capture from the last verified checkpoint
4. Turn stable rules into SOP and KB outputs only after current-state truth is clean enough

## Why this README exists
This file is the explicit entry point for understanding what this project is, what it is trying to achieve, and where to start reading.

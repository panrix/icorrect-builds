# Accepted Diagnostic -> Repair Queue -> Workshop Handoff Domain Index
Last updated: 2026-04-24 02:10 UTC
Status: active

## Purpose
This folder is the working control layer for the accepted diagnostic -> repair queue -> workshop handoff domain.

It exists to keep this adjacent domain cleanly separated from intake, quote creation, QC, and dispatch.

This folder should show:
- what the domain is
- what has been captured
- what still needs clarification
- which SOPs need to be written
- which KB entries need to be created
- which supporting docs belong to this domain

---

## Core Working Docs
- `process-truth.md`
  - main current-state + target-state process capture for this domain
- `session-notes/`
  - checkpoint summaries and dated session captures
- `references/`
  - supporting domain-specific notes extracted from wider build work

## Output Tracking
- `sops/INDEX.md`
  - master SOP backlog and status for this domain
- `kb/INDEX.md`
  - master KB backlog and status for this domain

---

## Current Domain Status
- accepted diagnostic readiness gate: partially captured from prior intake work
- quote accepted -> repair queue readiness logic: partially captured
- practical owner map through workshop handoff: not yet fully captured
- physical queue assignment and workshop handoff controls: not yet fully captured
- blocked states, exceptions, and delay communication rules: not yet fully captured

## What is already documented
- accepted diagnostic should not move into repair queue until parts, slot, payment, and deadline are confirmed
- simple repair vs diagnostic parts-check timing split
- Ferrari currently owns much of acceptance, payment chase, and movement into repair
- current queue movement risk includes missing parts, missing physical movement, and stale Monday state

## What still needs work
- define the clean current-state path from accepted quote to technician pickup
- document how queue readiness is actually decided today
- clarify owner boundaries across Ferrari, Ronnie, Naheed, Saf, and workshop team
- define exception / hold states between quote acceptance and workshop touch
- turn the captured truth into explicit SOP and KB backlogs

---

## File Rules For This Folder
- keep process truth in `process-truth.md`
- put dated conversation checkpoints in `session-notes/`
- put supporting extracted notes in `references/`
- do not create loose one-off docs in this folder unless they clearly belong to one of those categories
- use `sops/INDEX.md` and `kb/INDEX.md` as the live backlog trackers, not random note files

---

## Immediate Next Outputs
1. capture the real accepted diagnostic -> repair queue -> workshop handoff flow
2. define the main failure modes and blocked states in this domain
3. create the first SOP backlog for this domain
4. create the first KB backlog for this domain

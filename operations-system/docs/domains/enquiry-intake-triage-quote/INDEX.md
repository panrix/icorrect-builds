# Enquiry / Intake / Triage / Quote Domain Index
Last updated: 2026-04-24 02:02 UTC
Status: active

## Purpose
This folder is the working control layer for the enquiry -> intake -> triage -> quote domain.

It exists to stop this build from turning into a flat pile of notes.

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
- current-state enquiry/intake/triage/quote flow: partially captured
- intake completion and readiness gates: captured
- simple repair vs diagnostic gate split: captured
- intake hold concept: captured
- ownership map: partially captured
- downstream workshop handoff beyond quote acceptance: not yet fully captured

## What is already documented
- current-state channel map
- intake ownership update, including Naheed as live intake owner
- triage logic and not-fit logic
- normal repair vs diagnostic flow split
- stage-by-stage failure modes
- target-state speed principles
- intake gate model and signoff logic

## What still needs work
- tighten the role boundary between Naheed and Ferrari
- formalize received-but-on-hold customer communication rules
- define accepted diagnostic -> repair queue -> workshop handoff in the next adjacent domain pass
- convert process truth into explicit SOP and KB backlogs

---

## File Rules For This Folder
- keep process truth in `process-truth.md`
- put dated conversation checkpoints in `session-notes/`
- put supporting extracted notes in `references/`
- do not create loose one-off docs in this folder unless they clearly belong to one of those categories
- use `sops/INDEX.md` and `kb/INDEX.md` as the live backlog trackers, not random note files

---

## Immediate Next Outputs
1. create the first SOP backlog for this domain
2. create the first KB backlog for this domain
3. continue the adjacent next domain: accepted diagnostic -> repair queue -> workshop handoff

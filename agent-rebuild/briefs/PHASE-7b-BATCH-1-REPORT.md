# Phase 7b Batch 1 Report

**Date:** 2026-05-05
**Status:** physical move complete; parent repo cleanup PR created
**Scope:** low-risk dormant/fleet-meta folders only

## Summary

Batch 1 moved dormant or fleet-meta folders out of `~/builds/` into their Phase 7b domain homes. Active Back Market, Intake, and Shopify work lanes were not included.

## Moves

| Old path | New path | Reason |
|---|---|---|
| `~/builds/voice-notes` | `~/archive/2026-05-voice-notes-dead` | Dead folder per inventory; preserved for audit trail. |
| `~/builds/data-architecture` | `~/fleet/archive/data-architecture` | Archived/fleet reference, not active build. |
| `~/builds/qa-system` | `~/fleet/qa-system` | Fleet QA system material. |
| `~/builds/templates` | `~/fleet/templates` | Fleet template library. |
| `~/builds/mutagen-guide` | `~/fleet/mutagen-guide` | Fleet setup guide. |
| `~/builds/documentation` | `~/fleet/documentation` | Fleet documentation staging/imports. |
| `~/builds/research` | `~/fleet/research` | Fleet/OpenClaw/runtime research. |

## Verification

- Each moved folder retained or already had an `INDEX.md`.
- Added local root indexes at:
  - `~/fleet/INDEX.md`
  - `~/archive/INDEX.md`
- Parent `panrix/icorrect-builds` cleanup removes the moved folders from `~/builds`.

## Deferred

- `intake-system/react-form` remains in place until the active Intake lane is quiet.
- Active services and repo-owned domain moves continue in later batches.
- `scripts`, `system-audit-2026-03-31`, and `webhook-migration` remain audit-first split folders.

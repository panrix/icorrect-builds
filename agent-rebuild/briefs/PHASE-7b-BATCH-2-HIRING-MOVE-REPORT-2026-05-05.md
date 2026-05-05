# Phase 7b Batch 2 Hiring Move Report - 2026-05-05

## Status

Physical move complete; parent repo cleanup PR created.

## Scope

This was the smallest Batch 2 proof move:

`~/builds/hiring` -> `~/team/hiring`

No Back Market, Intake, Inventory, Shopify, cron, systemd, or live service paths were changed.

## Reason

`hiring` is dormant team-domain collateral, not an active build lane. It contains a single staged Technical Operations Coordinator job description draft plus empty standard folders.

## Moved Files

| New path | Purpose |
|---|---|
| `~/team/INDEX.md` | Team-domain landing index |
| `~/team/hiring/INDEX.md` | Hiring folder index, updated with move note |
| `~/team/hiring/docs/staged/2026-03-31/operations-coordinator-jd-v3.md` | Technical Operations Coordinator JD draft |
| `~/team/hiring/{archive,briefs,decisions,scratch}/.gitkeep` | Standard folder placeholders |

## Verification

- Local source removed: `/Users/ricky/vps/builds/hiring` no longer exists.
- Live VPS source removed: `/home/ricky/builds/hiring` no longer exists.
- Local destination exists under `/Users/ricky/vps/team/hiring`.
- Live VPS destination exists under `/home/ricky/team/hiring`.
- JD checksum matched local and live VPS:

`ff635e3a323e7d5f1d86ecb85535310b5ef34cd11f4124fe6a870fefef07d66f`

- `vps-core` remained connected and watching after the move.

## GitHub Cleanup

The parent `panrix/icorrect-builds` repo now removes the old tracked `hiring/` files, matching the Batch 1 pattern for folders physically moved out of `~/builds`.

## Follow-up

`repair-analysis` was reviewed next and archived under `~/fleet/archive/repair-analysis-2026-05`; see `PHASE-7b-BATCH-2-REPAIR-ANALYSIS-ARCHIVE-REPORT-2026-05-05.md`.

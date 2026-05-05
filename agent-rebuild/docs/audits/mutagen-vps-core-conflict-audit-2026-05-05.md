# Mutagen VPS Core Conflict Audit - 2026-05-05

## Status

`vps-core` replaced the unsafe whole-home `vps-mirror` session.

- Alpha: `/Users/ricky/vps`
- Beta: `ricky@46.225.53.159:/home/ricky/`
- Mode: `two-way-safe`
- VCS: ignored
- Symlinks: ignored
- Synchronizable payload: 1.2G on both sides
- VPS disk after cleanup: 51G used, 21G free, 71%
- Mutagen remote state after rebuild: about 184M

The old failure mode was Mutagen staging huge `.git` packs and runtime/cache trees into a full VPS. The new session excludes Git internals, dependency folders, tool runtime folders, browser/runtime state, archives, backups, OpenClaw live state, and large generated data.

## Active Conflicts

Mutagen reports 10 active conflicts plus 11 excluded conflicts. The excluded conflicts are now behind ignore rules and do not need immediate action. The active conflicts below should be resolved lane by lane only after the relevant active agent has finished.

| Path | Lane | Alpha size | Beta size | Recommendation |
|---|---:|---:|---:|---|
| `builds/alex-triage-rebuild/scripts/intercom-cleanup-2025plus-dry-run.js` | Alex | 12,382 | 28,712 | Hold. Beta is much larger; compare with Alex lane owner before resolving. |
| `builds/backmarket/test/unit/sent-orders-title-map.test.js` | Back Market | 1,152 | 812 | Hold. Back Market agent has active work; compare with pushed BM branch before resolving. |
| `builds/intake-system/backend/.env.example` | Intake | 129 | 149 | Hold. Intake agent active. |
| `builds/intake-system/backend/package.json` | Intake | 720 | 786 | Hold. Intake agent active. |
| `builds/intake-system/backend/src/adapters/mock-adapters.ts` | Intake | 1,645 | 8,726 | Hold. Beta is much larger; likely active Intake work. |
| `builds/intake-system/backend/src/adapters/types.ts` | Intake | 1,493 | 2,193 | Hold. Beta adds adapter surface. |
| `builds/intake-system/backend/src/app.ts` | Intake | 1,138 | 2,093 | Hold. Beta has broader app changes. |
| `builds/intake-system/backend/src/config/env.ts` | Intake | 682 | 770 | Hold. Beta has extra env config. |
| `builds/intake-system/backend/src/services/intake-service.ts` | Intake | 12,091 | 25,195 | Hold. Beta is much larger; likely active Intake service work. |
| `builds/intake-system/shared/types.ts` | Intake | 4,626 | 10,016 | Hold. Beta has substantial shared type additions. |

## Cleanup Decision

Do not use Mutagen conflict resolution as a merge tool for these files. The safe path is:

1. Let Back Market and Intake agents finish their branches.
2. Pull/merge their GitHub branches into the proper source-of-truth branch.
3. Once Git has the intended result, resolve Mutagen by making the local mirror match the Git-backed source.
4. Re-run `mutagen sync list` and confirm conflict count drops to zero.

## Next Cleanup Batch

After active lane conflicts are resolved, continue Phase 7b with inactive folders only. Do not move or delete:

- `builds/backmarket`
- `builds/backmarket-browser`
- `builds/intake-system`
- `builds/alex-triage-rebuild`

Next candidates should be selected from inactive, non-runtime folders and handled one batch at a time with a Git PR plus physical VPS move.

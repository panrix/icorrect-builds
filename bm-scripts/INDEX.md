# bm-scripts

**State:** dormant (last activity: 2026-03-27)
**Owner:** backmarket
**Purpose:** Tiny leftover folder containing a single Back Market reconciliation output JSON. Does not currently look like an active project — appears to be a leftover from earlier BM scripting work. The backmarket workspace MEMORY.md notes "bm-scripts/ deleted. All canonical scripts are at builds/backmarket/scripts/" — but the folder itself still exists with a `test-output/` subdir.
**Last updated:** 2026-05-02 UTC (Phase 7a folder-standard rollout)

## Current state

Dormant. Last meaningful change: 2026-03-27. Reason for dormancy: superseded — canonical BM scripts moved to `~/builds/backmarket/scripts/`.

**Phase 7c review candidate:** assess whether to revive, archive, or delete. The `~/.openclaw/agents/backmarket/workspace/MEMORY.md` already documents this folder as deprecated.

## Structure

- `briefs/` — empty (gitkeep)
- `decisions/` — empty (gitkeep)
- `docs/` — empty (gitkeep)
- `archive/` — empty (gitkeep)
- `scratch/` — empty (gitkeep)
- `test-output/` — single reconciliation JSON (kept as-is — historical output from a 2026-03-27 reconciliation run)

## Key documents

None at root level. Only contents are `test-output/reconciliation-2026-03-27.json`.

## Inbound references

- `~/.openclaw/agents/backmarket/workspace/MEMORY.md` line 15: references this folder as deprecated ("bm-scripts/ deleted. All canonical scripts are at `builds/backmarket/scripts/`.") — no path patch needed
- `~/claude-audit-rebuild/vps-audit.md` line 109: size measurement only — no path patch needed
- `~/kb/backmarket/product-id-resolution.md` line 102: notes "some historical docs still reference the obsolete bm-scripts path" — informational only

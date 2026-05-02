# intercom-config

**State:** active
**Owner:** alex-cs
**Purpose:** Research and strategy folder for Intercom private-API deployment and inbox-view configuration. Combines endpoint inventory, bundle reverse-engineering, and inbox-view strategy.
**Last updated:** 2026-05-02

## Current state

### In flight
- Inbox-views strategy (`strategy/inbox-views.md`) — Phase 1 corporate inbox view deployment using documented heuristic (idea-inventory row 168, P2). Phase 2 intent-based views gated on auto-tag workflow (rows 173, 182).

### Recently shipped
- Private-API discovery and bundle grep complete (2026-04-28).

### Next up
- Deploy Phase 1 corporate inbox view.
- Define and deploy auto-tag workflow before enabling Phase 2 intent-based views.

## Structure

- `briefs/` — empty (proposals currently captured in `strategy/inbox-views.md` — pending classification)
- `decisions/` — empty
- `docs/` — `private-api-discovery.md` (canonical reference), `api-inventory.json` (endpoint inventory), `bundle-grep.json` (bundle reverse-engineering output)
- `archive/` — empty
- `scratch/` — empty
- `strategy/` — pre-existing: `inbox-views.md` (active strategy doc; tracked from `~/builds/agent-rebuild/idea-inventory.md`)

## Key documents

- [`docs/private-api-discovery.md`](docs/private-api-discovery.md) — private API discovery write-up (was at root)
- [`docs/api-inventory.json`](docs/api-inventory.json) — endpoint inventory data (was at root)
- [`docs/bundle-grep.json`](docs/bundle-grep.json) — JS bundle grep output (was at root)
- [`strategy/inbox-views.md`](strategy/inbox-views.md) — Phase 1/2 inbox-view rollout strategy

## Open questions

- Should `strategy/inbox-views.md` move into `briefs/` (it is effectively a proposal/spec) and the `strategy/` subfolder be retired? Left as-is during Phase 7a per "no restructuring of pre-existing subdirs" rule.

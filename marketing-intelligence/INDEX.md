# marketing-intelligence

**State:** active
**Owner:** marketing
**Purpose:** Stub + snapshot docs for the iCorrect self-hosted marketing intelligence platform. The local folder is a planning/snapshot surface; the live MI implementation lives elsewhere on the VPS (currently disabled).
**Last updated:** 2026-05-02 (Phase 7a folder-standard rollout)

## Current state

### In flight
- no live state captured — needs population by owner agent (marketing). Inventory marks this folder as a snapshot-of-other-work; the live MI service is `marketing-intelligence-api.service` (disabled) plus nginx `marketing-intel` route.

### Recently shipped
- Last folder activity 2026-04-30 (`.remember/` runtime artifacts only). README + spec snapshot dates from 2026-02-22.

### Next up
- Per `system-rethink.md`: revive scrapers via crontab; fix DB-path confusion; rebuild dashboard once API is trustworthy.

## Structure

- `briefs/` — empty (placeholder for new MI proposals)
- `decisions/` — empty — backfill in Phase 7c if useful
- `docs/` — empty (canonical reference TBD; live runtime lives outside this folder)
- `archive/` — empty
- `scratch/` — empty
- `snapshot/` — pre-existing snapshot dir kept in place (per "no code-dir restructuring"). Holds `marketing-intelligence-platform-spec.md` and `MI-BUILD-BRIEF.md` from 2026-02-22.
- `.remember/` — runtime/agent state, untouched.

## Key documents

- [`README.md`](README.md) — stub status, why parked, what would unblock
- [`snapshot/marketing-intelligence-platform-spec.md`](snapshot/marketing-intelligence-platform-spec.md) — original MI platform spec (2026-02-22)
- [`snapshot/MI-BUILD-BRIEF.md`](snapshot/MI-BUILD-BRIEF.md) — original MI build brief (2026-02-22)

## Open questions

- **SECURITY (Phase 6.95):** inventory flags this folder for plaintext basic-auth / env material. The MI dashboard auth is nginx HTTP basic-auth via `/etc/nginx/.htpasswd` (per `claude-audit-rebuild/.remember/remember.md`). Rotate before any external publishing of folder contents.
- Whether `snapshot/` content should move to `archive/2026-02-22-mi-original-spec/` once a fresh brief lands in `briefs/`.

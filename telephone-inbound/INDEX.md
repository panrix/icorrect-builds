# telephone-inbound

**State:** active
**Owner:** operations
**Purpose:** Flask-based Slack intake server for phone calls. Opens a modal, posts call notes to `#phone-enquiries`, can route follow-ups. Runs as `telephone-inbound.service` (systemd user unit) on port 8003, ExecStart `python3 -u /home/ricky/builds/telephone-inbound/server.py`.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- No live state captured — needs population by owner agent.

### Recently shipped
- `server.py` last touched 2026-03-24; service running steady-state since.

### Next up
- n/a.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `data/` — `telephone-inbound.log` (carries PII per folder-inventory; needs redaction in Phase 7c).
- `server.py` — live Flask server (referenced by systemd absolute path).
- `telephone-inbound.service` — systemd unit copy (live unit lives in `~/.config/systemd/user/`).

## Key documents

- `server.py` — Flask intake.
- (no README; operational notes could be added.)

## Open questions

- PII redaction sweep for `data/telephone-inbound.log` — flagged for Phase 7c.

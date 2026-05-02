# llm-summary-endpoint

**State:** active
**Owner:** operations
**Purpose:** Minimal Node/Express service that accepts Monday.com repair updates, sends them to OpenRouter/Claude for summarisation, and returns the result. Runs as `llm-summary.service` (systemd user unit), ExecStart `node server.js`.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- No live state captured — needs population by owner agent.

### Recently shipped
- `server.js` last touched 2026-04-14.

### Next up
- n/a — service is steady-state.

## Structure

- `briefs/` — empty.
- `decisions/` — empty; backfill in Phase 7c if useful.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `server.js` — live entrypoint (referenced by systemd `llm-summary.service`).
- `package.json` / `package-lock.json` — manifest at root.

## Key documents

- `server.js` — live endpoint.
- (no README.md present — operational doc could be added later.)

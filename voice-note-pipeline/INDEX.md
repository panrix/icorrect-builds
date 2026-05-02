# voice-note-pipeline

**State:** active
**Owner:** operations
**Purpose:** Python worker that watches intake-related Slack threads for audio replies, transcribes them with Whisper, and posts structured summaries back. Runs as `voice-note-worker.service` (systemd user unit), ExecStart `python3 -u /home/ricky/builds/voice-note-pipeline/voice-note-worker.py`.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

**Phase 7c retirement candidate:** Module deprecated 2026-05-02 — pending Phase 7c retirement. Live worker still running, will be killed in Phase 7c.

### In flight
- No live state captured — needs population by owner agent.

### Recently shipped
- `voice-note-worker.py` last touched 2026-03-11; service running steady-state since.
- Live state JSON + log capture (`data/.voice-note-state.json`, `data/voice-note-worker.log`) updated continuously.

### Next up
- n/a.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.
- `data/` — runtime state (`.voice-note-state.json`) and rolling log (`voice-note-worker.log`, ~22MB; carries PII per folder-inventory).
- `voice-note-worker.py` — live worker (referenced by systemd absolute path).
- `voice-note-worker.service` — systemd unit copy (live unit lives in `~/.config/systemd/user/`).

## Key documents

- `voice-note-worker.py` — live worker.

## Open questions

- PII redaction + log rotation for `data/voice-note-worker.log` — flagged for Phase 7c.

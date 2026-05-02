# whisper-api

**State:** dormant (last activity: 2026-03-10)
**Owner:** operations
**Purpose:** Single bash helper that sends a local audio file to OpenAI transcription and writes a sidecar `.txt` transcript next to the source.
**Last updated:** 2026-05-02 (Phase 7a folder-standard rollout)

## Current state

Dormant since 2026-03-10. Reason for dormancy: helper is on-demand, called by OpenClaw via path reference (`openclaw.json:392`). Not run on a schedule.

**Phase 7c review candidate:** consider folding this single-script folder into a shared `~/builds/scripts/` or alongside `voice-note-pipeline/`. Owner: operations.

## Structure

- `briefs/` — empty
- `decisions/` — empty
- `docs/` — empty
- `archive/` — empty
- `scratch/` — empty
- `scripts/` — `transcribe.sh` (the helper)

## Key documents

- [`scripts/transcribe.sh`](scripts/transcribe.sh) — bash helper: takes an audio file, posts to OpenAI transcription, writes sidecar `.txt`

## Open questions

- **INBOUND REFERENCE TO PATCH (Phase 7a consolidation):** `~/.openclaw/openclaw.json:392` references `/home/ricky/builds/whisper-api/transcribe.sh`. After this reorg the path is `/home/ricky/builds/whisper-api/scripts/transcribe.sh`. The fleet-wide path-patch in the consolidation pass MUST update this reference, otherwise OpenClaw's transcription tool breaks.

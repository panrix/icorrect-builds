# server-config

**State:** active (snapshot-of-other — point-in-time VPS runtime capture)
**Owner:** none (no agent owner; main maintains)
**Purpose:** Snapshot of VPS runtime configuration and service inventory — nginx configs, systemd user units, cron, listening ports, pm2 process state. Reference material for recovery and audits.
**Last updated:** 2026-05-02 UTC (folder reorganized; underlying snapshots are from 2026-03-24)

## Current state

### In flight
- Folder is a frozen snapshot, not actively edited. New snapshots would create dated subfolders (e.g. `archive/YYYY-MM-DD-snapshot/`).

### Recently shipped
- 2026-03-24 snapshot: 26 files capturing then-current VPS state.

### Next up
- Reshoot the snapshot when meaningful infra changes land (e.g. after Phase 7 hygiene).

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- [`docs/`](docs/INDEX.md) — 16 config files (10 systemd `.service`, 6 nginx `.conf`, env-template). Has sub-INDEX.
- `archive/` — empty (future-dated snapshots will land here).
- `scratch/` — empty.
- [`data/`](data/INDEX.md) — 8 runtime data dumps (listening ports, crontab, pm2 list/show, running processes, systemd unit lists). Has sub-INDEX.
- (root) — sensitive pm2-dump files. See SECURITY warning below.

## Key documents

### Config (docs/)
See [`docs/INDEX.md`](docs/INDEX.md) for full list. Includes:
- 10 systemd `.service` units (`agent-trigger`, `icloud-checker`, `icorrect-parts`, `intake-form`, `llm-summary`, `marketing-intelligence-api`, `openclaw-gateway`, `telephone-inbound`, `voice-note-worker`).
- 6 nginx configs (`nginx.conf`, `nginx-default.conf`, `nginx-intake-form.conf`, `nginx-marketing-intel.conf`, `nginx-mission-control.conf`, `nginx-n8n.conf`).
- `env-template.txt` — placeholder template, not real secrets.

### Data dumps (data/)
See [`data/INDEX.md`](data/INDEX.md) for full list.

### Sensitive (kept at root — see SECURITY)
- `pm2-dump.json` — pm2 ecosystem dump (contains plaintext secrets in env vars).
- `pm2-dump-formatted.json` — formatted equivalent (also plaintext secrets).

## SECURITY warning

`pm2-dump.json` and `pm2-dump-formatted.json` contain plaintext secrets (env vars from each pm2-managed process). They are kept at the project root rather than redistributed across subfolders, but they remain sensitive. **Do not commit these files to a public repo, do not echo their contents anywhere, and treat any agent or build that reads them as an authorized-secrets read.** Phase 7c (folded-in 6.95 secrets rotation) is the canonical home for redacting/rotating these.

This warning was logged during the Phase 7a folder-standard rollout (batch 5).

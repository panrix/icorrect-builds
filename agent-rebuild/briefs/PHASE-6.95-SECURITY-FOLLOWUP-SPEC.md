# Phase 6.95 — Security Follow-Up (folded into Phase 7)

**Created:** 2026-05-01
**Status update 2026-05-02:** Ricky calibrated the actual risk against his setup (sole shell access, no external backups, private repo always). Realistic attack surface is near-zero in current state. **Deferring to run as part of Phase 7** rather than as a standalone phase. Rotation now happens in the same operation as file moves, not before.

**Sits within:** Phase 7 (hygiene) — as a prereq sub-step within Phase 7, not a standalone phase.
**Why this works:** the original "before Phase 7" framing was about preventing secret duplication into new git paths during file moves. Folding rotation into the same operation as the moves achieves the same outcome with one disruption instead of two.

**Goal:** rotate every plaintext secret surfaced by the 6.9 scans, redact live PII from logs, leave the underlying folders functional. Do not refactor, do not restructure, do not touch what isn't on the list.

**Non-goals:**
- This is not a security audit. Only the items the 6.9 scans surfaced.
- Do not move, rename, or archive any folder. That's Phase 7's job, with this clean.
- Do not edit `.env` keys other than the ones flagged.
- Do not commit to existing repos until rotation is confirmed (avoid leaking the old key in commit history).

---

## Findings — verbatim from 6.9 scans

### Class A — Plaintext secrets in repo files

These are credentials sitting in tracked or trackable files. Each needs: rotate the secret at source → replace the value in the file → confirm the service still works → ensure git history doesn't leak the old value.

| ID | File | What's exposed | Source service | Blast radius |
|---|---|---|---|---|
| A1 | `~/builds/icloud-checker/BRIEF.md` | Plaintext API key material | iCloud-related external API | Internet-exposed service on port 8010; key reuse elsewhere unknown |
| A2 | `~/builds/marketing-intelligence/snapshot/MI-BUILD-BRIEF.md` | Plaintext basic-auth credentials | MI dashboard (mi.icorrect.co.uk) | Dashboard login; if reused, web access |
| A3 | `~/builds/icorrect-parts-service/.env` | Plaintext .env (full) | Parts service runtime | Local service; depends on what tokens .env contains |
| A4 | `~/builds/server-config/pm2-dump-formatted.json` | Plaintext secrets | PM2 process snapshot — likely many env vars from running services | Wide — pm2-dump captures envs from every PM2-managed process |
| A5 | `~/builds/server-config/pm2-dump.json` | Same as A4 (alternate format) | Same as A4 | Same as A4 |
| A6 | `~/builds/team-audits/.env` | Plaintext .env | Team-audit tooling | Probably Monday API token or similar |

### Class B — Live PII in log files

These are runtime logs holding customer data. Each needs: redact / truncate / move outside repo → set up rotation policy so future logs don't accumulate.

| ID | File | What's exposed | Notes |
|---|---|---|---|
| B1 | `~/builds/voice-note-pipeline/voice-note-worker.log` | Plaintext voice-note transcript snippets | Most of folder size; contains Monday name-search activity. Active log — being written to. |
| B2 | `~/builds/telephone-inbound/<runtime log>` | Plaintext caller names and faults | Live log through 2026-04-30. Also contains stale credentials errors (`SLACK_SIGNING_SECRET`, `INTERCOM_ACCESS_TOKEN` missing — separate concern, see Class C). |

### Class C — Configuration drift / referenced secrets (defer to Phase 7)

Surfaced by scans but not direct exposure. Logged here so they're not lost; not in scope for 6.95.

- `~/builds/icorrect-parts-service/` CHANGELOG references stale path `/home/ricky/projects` vs live `/home/ricky/builds`
- `~/builds/xero-invoice-automation/build_workflow.py` writes `workflow.json` + `WEBHOOK_URL.txt` to `/home/ricky/projects/xero-invoice-automation` rather than its `/home/ricky/builds/` path; reads `MONDAY_APP_TOKEN` while brief calls it `MONDAY_API_TOKEN`
- `marketing-intelligence` folder references `/home/ricky/.openclaw/agents/main/agent/auth-profiles.json` as a plaintext key store
- `~/builds/telephone-inbound` log mentions missing `SLACK_SIGNING_SECRET` / `INTERCOM_ACCESS_TOKEN` — these are *missing* secrets, not exposed ones, but the log itself is the Class B concern

---

## Remediation per class

### Class A — rotation pattern

For each Class A row, the sequence is:

1. **Identify the secret** — open the file, copy the exposed value, identify which external service issues it (Meta, Monday, Apple, etc.)
2. **Rotate at source** — log in to the issuing service, generate a new credential, revoke the old. **Ricky's hands** for this step (most rotations require interactive service login).
3. **Update the live system** — the new credential goes into `~/config/.env` (the canonical credentials file per `CLAUDE.md`), not back into the repo file.
4. **Redact the repo file** — replace the secret in `BRIEF.md` / `MI-BUILD-BRIEF.md` / etc. with `<REDACTED — see ~/config/.env>` or remove the value entirely.
5. **Verify the service still works** — restart the relevant service, hit a health endpoint, confirm green.
6. **Git history audit** — for files that were ever committed:
   - If old secret is in git history, the rotation is what saves you (old secret no longer valid)
   - Optionally: rewrite history with `git filter-repo` or `BFG` to strip the value, then force-push to private mirror only. **Skip this step if the repo is local-only** — file rotation + value rotation already removes the risk for any future exposure.
7. **Commit the redaction** with a message that does not name the kind of secret (avoid signposting in history).

**Special case for A3 (parts-service .env) and A6 (team-audits .env):** `.env` files generally should not be in repos at all. Move the contents to `~/config/.env` (or a service-specific file under `~/config/`), add the `.env` path to the repo's `.gitignore`, redact + commit the empty version. If the file is already in git history, the rotation step is what protects you — the file's removal from working tree alone doesn't.

**Special case for A4/A5 (pm2-dump\*.json):** these are PM2 process snapshots, often committed by accident or for diagnostic purposes. They contain the **full env of every PM2-managed process**, which means many secrets at once.
- Add `pm2-dump*.json` to `.gitignore` permanently
- Delete the working-tree files
- Rotate every credential that PM2 was managing (check the dump to enumerate which services/env vars were captured)
- Verify PM2 services restart cleanly after rotation
- This is the highest-impact Class A item by blast radius

### Class B — log redaction pattern

For each Class B row:

1. **Stop the bleed first** — modify the worker code to redact PII at write-time before doing anything to the existing log. Changes:
   - `voice-note-worker`: redact transcript content; keep only metadata (timestamp, duration, source) at INFO level. Full transcripts go to a separate file in `~/data/voice-notes/` outside the repo, with restricted permissions
   - `telephone-inbound`: redact caller name and fault text; keep call ID + outcome only at INFO level
2. **Truncate / archive the existing log** — move the old log to `~/data/archive/security-quarantine-2026-05-01/` with `chmod 600`, keep the path documented. Do not delete (audit trail).
3. **Set up rotation** — `logrotate` config with size or time-based rotation, compression, and a retention policy (suggest 7 days for redacted logs, 0 days for any non-redacted historical content once archived).
4. **Verify** — run the worker for one cycle, inspect the new log, confirm no PII visible.

### Class C — defer

Carry forward to Phase 7. Log is in this spec so it doesn't get lost.

---

## Execution shape

Mixed human + Codex BUILDER, in this order:

| Step | Who | What |
|---|---|---|
| 1 | **Ricky + Code (this session)** | Walk through Class A list together. Confirm which services issue each credential. Identify which tokens Ricky needs to rotate himself vs which I can do via API. Build a per-row rotation checklist. |
| 2 | **Ricky** | Execute the external rotations (log into Meta, Monday, etc., generate new credentials, revoke old). |
| 3 | **Code (this session)** | Apply file-level changes once rotation is confirmed: redact the repo files, update `.gitignore`s, move secrets to `~/config/.env` where appropriate. |
| 4 | **Code (this session)** | Restart affected services, run health checks, confirm green. |
| 5 | **Codex BUILDER spawn** | Class B log redaction — modify worker code, set up rotation, archive old logs. ~30-45 min spawn. |
| 6 | **Code + Ricky** | Sign-off review. Update folder-inventory.md to mark security-flag rows as resolved. |

---

## Acceptance criteria

- All 6 Class A files have either had their secret redacted (with rotation confirmed) OR the file removed from working tree with the canonical secret moved to `~/config/.env`
- All `.env` and `pm2-dump*.json` patterns are in the relevant `.gitignore`s
- Both Class B logs have been archived to `~/data/archive/security-quarantine-2026-05-01/` with `chmod 600`, and the workers have been modified to redact PII at write-time going forward
- All affected services pass a post-rotation health check
- folder-inventory.md security flags marked resolved
- A summary commit / log entry exists at `~/data/archive/security-quarantine-2026-05-01/REMEDIATION-LOG.md` listing every action taken (redaction, rotation, file move, service restart) — this is the audit trail Phase 7 reads to confirm safe-to-proceed

---

## Risk ladder (priority order if time-constrained)

1. **A4 + A5 (pm2-dump\*.json)** — highest blast radius. Captures envs from every PM2 process at once. Do first.
2. **A1 (icloud-checker BRIEF.md)** — service is internet-exposed on port 8010, so any credential here has external attack surface.
3. **A3 (parts-service .env)** — runtime service .env, full file exposure.
4. **A2 (marketing-intelligence MI-BUILD-BRIEF.md)** — basic-auth on a dashboard. Lower blast radius (one service) but trivial to exploit if URL is known.
5. **A6 (team-audits .env)** — likely a Monday API token, similar profile to A3 but probably read-only scope.
6. **B1 + B2 (PII logs)** — ongoing exposure but not externally accessible. Important but not panic-tier; the redaction-at-write change is the durable fix.

---

## What this protects against

- Phase 7 archiving a folder that contains an active credential, leaving the credential in two places
- Future scans / shares of the affected files exposing live secrets
- Compliance risk on customer-data-bearing logs
- The "I forgot we had that token there" failure mode, six months from now

---

## What this does NOT cover (out of scope, surfaced for visibility)

- A full system-wide secret scan (run `gitleaks` or `trufflehog` later if desired)
- Rotation policy / cadence (separate ops concern)
- Multi-factor / hardware-token enforcement on the issuing services themselves
- Network-level controls (firewall on port 8010, etc.)
- Backup hygiene (any older backups containing the same secrets — separate phase)

These are real concerns but not what 6.9 surfaced. Don't expand scope here.

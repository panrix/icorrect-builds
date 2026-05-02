# QA Phase 7a — Batch 6 (Web/Marketing)
**Reviewer:** general-purpose subagent (Codex sandbox fallback)
**Date:** 2026-05-02 09:10

## Verdict per folder
- icorrect-shopify-theme: PASS
- marketing-intelligence: PASS
- quote-wizard: PASS
- website-conversion: PASS
- voice-notes: PASS
- whisper-api: PASS

## FAIL findings
*(none)*

## WARNING findings
- **icorrect-shopify-theme**: existing `reports/` and `snapshots/` subdirs at root duplicate the standard `archive/` purpose. Left in place per "no code-dir restructuring" rule. Owner-flagged in scan YAML; not a Phase 7a defect.
- **icorrect-shopify-theme**: `docs/deploy-macbook-landing-pages.sh` and `docs/posthog-web-pixel.js` are non-markdown files left in `docs/` where they pre-existed; rubric ambiguous — left in place. Acceptable.
- **icorrect-shopify-theme** scratch/: two stale HTML prototypes (`icorrect-quote-wizard-final.html`, `prototype-quote-flow.html`) classified as scratch per ambiguous-file rule; owner may want to move to `archive/2026-05-02-superseded/` once quote-wizard v2 lands. Future cleanup, not a defect.
- **marketing-intelligence**: SENSITIVE — folder area is associated with plaintext basic-auth / env material per claude-audit-rebuild remember.md. Builder did not echo or reproduce env contents (verified — no env/auth files read by QA either). Phase 6.95 / 7c rotation needed. `snapshot/` subdir kept in place per leave-alone rule. Acceptable.
- **quote-wizard**: `rebuild-wizard-menus.js` was previously executable and likely referenced as `./rebuild-wizard-menus.js` in `README.md` (left untouched per no-edit rule). Future invocations need `node scripts/rebuild-wizard-menus.js`. No external scheduler/cron/systemd reference found, so risk is low. Documented in scan YAML warnings.
- **website-conversion**: ownership conflict (arlo-website current vs marketing proposed) flagged in INDEX.md, pending Ricky signoff in Phase 6.9e. Not a Phase 7a defect.
- **voice-notes**: `kb/SCHEMA.md:16` references `/home/ricky/voice-notes/transcripts/` — outside `~/builds/`, NOT this folder. Live voice pipeline is in `voice-note-pipeline/`. No live ref to patch for this dead folder. Recorded in scan YAML.
- **whisper-api**: CRITICAL PATCH REQUIRED — `~/.openclaw/openclaw.json:392` still references the OLD path `/home/ricky/builds/whisper-api/transcribe.sh`. After reorg the file is at `/home/ricky/builds/whisper-api/scripts/transcribe.sh`. The fleet-wide consolidation pass MUST patch this or OpenClaw transcription breaks. Builder correctly flagged this in scan YAML inbound_references AND in the warnings AND in INDEX.md "Open questions". Not a Phase 7a defect — exactly what the consolidation pass is for. (Highest-priority patch in the entire phase, per spec.)

## Spot-checks performed
- Move spot-checks: 11 total
  - whisper-api: `transcribe.sh` → `scripts/transcribe.sh` confirmed (mtime preserved 2026-03-10)
  - quote-wizard: `rebuild-wizard-menus.js` → `scripts/` confirmed (mtime preserved 2026-03-18); 4× wizard JSON data files → `data/` confirmed
  - icorrect-shopify-theme: `Products.csv` + `meta-pixel-fix-brief.md` + `icorrect-quote-wizard-final.html` no longer at root, all present in correct destinations (`data/`, `briefs/`, `scratch/`)
  - website-conversion: `SPEC.md` → `briefs/SPEC.md` confirmed
- Sub-INDEX rule: 3 sub-INDEXes in icorrect-shopify-theme verified: **yes** — `briefs/INDEX.md` (7 entries), `docs/INDEX.md` (17 entries), `docs/audits/INDEX.md` (12 entries) all exist and correctly summarize their dirs.
- Inbound references: 3 spot-checked — all real and still pointing at OLD root paths (expected pre-consolidation, WARN not FAIL):
  - `arlo-website/workspace/MEMORY.md:6` → `/home/ricky/builds/icorrect-shopify-theme` (folder reference, no patch needed; folder root unchanged)
  - `claude-audit-rebuild/vps-audit.md:104` → `/home/ricky/builds/whisper-api/` (folder reference, root unchanged)
  - `marketing/workspace/AGENTS.md:39` → `~/builds/marketing-intelligence/` (folder reference, root unchanged)
- voice-notes uses DEAD template: **yes** — INDEX.md state field is `dead — candidate for Phase 7c archive`, recommendation block points to `~/archive/2026-MM-DD-dead-on-arrival/`, "Current state" collapsed to single explanatory paragraph as spec allows for dead/dormant. Distinguishes itself from live voice-note-pipeline.
- whisper-api `openclaw.json:392` patch flagged in YAML: **yes** — flagged in `inbound_references` (line 414), `warnings` block (line 425, marked CRITICAL PATCH REQUIRED), AND `new_files_created` description (line 401 — INDEX.md flags it). Triple-flagged.
- No post-Phase-7a edits to existing files: **verified by mtime check** — `find -type f -newermt "2026-05-02 08:20"` against `assets/`, `sections/`, `snippets/`, `templates/`, `layout/`, `scripts/`, `config/` in icorrect-shopify-theme returned zero results. Moved scripts in whisper-api/scripts/ and quote-wizard/scripts/ retained their original Mar 2026 mtimes (move, not modify).
- All `.gitkeep` files present in empty subdirs: **yes** — 27 `.gitkeep` files found across the 6 folders, matching the new_files_created lists in scan YAML.

## Final verdict
PASS

Batch 6 is structurally clean. All 6 folders have INDEX.md at root, 5 standard subdirs (or kept-existing equivalents), `.gitkeep` in empties, claimed file-moves all landed correctly with mtimes preserved, voice-notes correctly uses the DEAD template, and the highest-priority consolidation patch (`openclaw.json:392`) is properly surfaced in three places in the scan YAML and INDEX.md. The marketing-intelligence sensitive material was respected (no env reads). No real Phase 7a defects detected.

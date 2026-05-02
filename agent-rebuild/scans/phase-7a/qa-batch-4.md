# QA Phase 7a — Batch 4 (Ops services)
**Reviewer:** Codex (independent)
**Date:** 2026-05-02 08:33

## Verdict per folder
- icloud-checker: WARN — superseded root `index.js` and `apple-specs.js` were archived correctly and `src/` remains canonical, but spot-checked inbound docs still reference moved root files.
- llm-summary-endpoint: PASS — structure is present and `llm-summary.service` still resolves to root `server.js`.
- royal-mail-automation: FAIL — cron still resolves to the required root scripts, but `dispatch.js`, `repairs-dispatch.js`, and `buy-labels.js` are modified in git so the “unchanged” requirement is not met.
- telephone-inbound: PASS — structure is present, the log moved to `data/`, and `telephone-inbound.service` still resolves to `server.py`.
- voice-note-pipeline: FAIL — `voice-note-worker.py` still resolves, but the declared move of `.voice-note-state.json` is incomplete because the root copy still exists.
- xero-invoice-automation: WARN — `workflow_v4.json` is in `data/` and prior versions are archived, but spot-checked inbound refs still point at removed root `SETUP.md`.
- xero-invoice-notifications: WARN — the service still resolves to `check-invoices.sh`, but spot-checked inbound refs still point at removed root `BUILD-BRIEF.md`.

## FAIL findings
- `royal-mail-automation`: `git -C /home/ricky/builds/royal-mail-automation status --short` and `git diff -- dispatch.js repairs-dispatch.js buy-labels.js` show live cron-root scripts modified, violating the batch requirement that they remain unchanged at the root.
- `voice-note-pipeline`: `/home/ricky/builds/voice-note-pipeline/.voice-note-state.json` still exists at the root while `/home/ricky/builds/voice-note-pipeline/data/.voice-note-state.json` also exists, so the YAML `from:` path is not gone.

## WARNING findings
- `icloud-checker`: spot-checked inbound refs in `/home/ricky/kb/backmarket/spec-checker.md` and `/home/ricky/builds/agent-rebuild/idea-inventory.md` still point at removed root files `SOP-BM-TRADEIN-CHECK.md` and `AUDIT-AND-DECOMPOSITION.md`.
- `royal-mail-automation`: `/home/ricky/builds/agent-rebuild/idea-inventory.md` still points at removed root `REPAIRS-DISPATCH-PLAN.md`.
- `xero-invoice-automation`: `/home/ricky/builds/agent-rebuild/idea-inventory.md` still points at removed root `SETUP.md`.
- `xero-invoice-notifications`: `/home/ricky/builds/agent-rebuild/idea-inventory.md` still points at removed root `BUILD-BRIEF.md`.
- Root `INDEX.md` files across the batch have `**State:** active` but no `---` front matter; the QA loop asked for front matter, while the binding spec examples omit it, so this was treated as a standards mismatch rather than an automatic fail.
- Repo-wide `git -C /home/ricky/builds status` and `git -C /home/ricky/builds diff -- '*.js' '*.py' '*.sh' '*.json'` include substantial unrelated churn outside Batch 4, so existing-content-untouched could not be fully verified at the repo level. Within Batch 4, `royal-mail-automation` is the only folder with confirmed live-script content diffs.

## Spot-checks performed
- Move spot-checks: 15 performed across 6 folders
- Sub-INDEX rule: icloud-checker/data/INDEX.md verified yes
- Inbound references: 21 spot-checked, 16 resolved
- Existing-content-untouched: not verified
- Live-runtime preservation: cron paths resolve yes; systemd ExecStart paths resolve yes

## Final verdict
FAIL

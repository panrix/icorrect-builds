# QA Phase 7a — Batch 2 (Alex/CS)
**Reviewer:** Codex (independent)
**Date:** 2026-05-02 08:31

## Verdict per folder
- alex-triage-classifier-rebuild: FAIL — root move validates on disk, but git shows delete plus untracked add rather than rename-only output.
- alex-triage-rebuild: FAIL — existing script content was edited, two empty standard dirs lack `.gitkeep`, and large subdirs miss required sub-INDEXes.
- customer-service: WARN — root skeleton is present, but large pre-existing subdirs (`reports/`, `session-archives/`, `modules/*`) have no sub-INDEX.
- intercom-agent: FAIL — root move validates on disk, but git shows delete plus untracked add rather than rename-only output.
- intercom-config: FAIL — moved files validate on disk, but git shows deletes plus untracked adds rather than rename-only output.
- claude-project-export: FAIL — moved files validate on disk, but git shows deletes plus untracked adds and `sop-project/INDEX.md` is summary-only.

## FAIL findings
- Hard rule E failed in `alex-triage-classifier-rebuild`, `alex-triage-rebuild`, `intercom-agent`, `intercom-config`, and `claude-project-export`: `git status --short --untracked-files=all` shows deleted source files plus untracked moved targets, not rename-only entries plus new `INDEX.md`/`.gitkeep`.
- Hard rule E failed in `alex-triage-rebuild`: `git diff -- alex-triage-rebuild/scripts/intercom-cleanup-2025plus-dry-run.js` is non-empty, so an existing file in a code directory was edited.
- Structure rule A failed in `alex-triage-rebuild`: empty `archive/` and `decisions/` exist without `.gitkeep`.

## WARNING findings
- All six root `INDEX.md` files include `State`, `Owner`, `Purpose`, and `Last updated`, but `Last updated` is date-only (`2026-05-02`) rather than the spec format `YYYY-MM-DD HH:MM TZ`.
- `alex-triage-rebuild/docs/INDEX.md` exists and the claimed count is correct at 14 top-level entries, but `docs/validation/` has 10 files without its own `INDEX.md`; `data/` (42 files) and `scripts/` (21 files) also exceed the >5-file threshold with no sub-INDEX.
- `customer-service` has no claimed file moves and keeps the required skeleton, but `reports/` (16 files), `session-archives/2026-04-17/` (7 files), `modules/enquiry/` (937 files), and `modules/intake/` (3830 files) exceed the >5-file threshold with no `INDEX.md`.
- `claude-project-export/sop-project/INDEX.md` exists and the claimed 118 `.md` files check out, but the content is category-based rather than a per-file list with one-line descriptions.

## Spot-checks performed
- Move spot-checks: 14 across folders
- Sub-INDEX rule: alex-triage-rebuild/docs/INDEX.md verified yes; claude-project-export/sop-project/INDEX.md verified yes
- Inbound references: 5 spot-checked
- Existing-content-untouched: no; `git diff` shows `alex-triage-rebuild/scripts/intercom-cleanup-2025plus-dry-run.js` modified

## Final verdict
FAIL — batch has hard-rule git-status/diff violations plus unresolved structure and sub-INDEX gaps.

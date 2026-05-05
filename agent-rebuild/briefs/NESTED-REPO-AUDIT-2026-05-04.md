# Nested Repo Audit - 2026-05-04

**Scope:** read-only audit of repo-owned candidates under `/Users/ricky/vps/builds`
**Purpose:** identify what must be preserved, given a remote, moved, or archived before Phase 7b folder moves.
**Do not do yet:** do not delete local nested repos; do not fold their source into `panrix/icorrect-builds`; do not move them until remotes/source-of-truth are settled.
**Ricky decisions:** approved 2026-05-04; see decision section below.

## Approved Decisions - 2026-05-04

Ricky approved the recommended source-of-truth model:

- Fold `intake-system/react-form` into parent-owned `intake-system/frontend`.
- Create/use `panrix/royal-mail-automation` for Royal Mail automation.
- Create/use `panrix/xero-invoice-automation` for Xero invoice automation.
- Create/use `panrix/elek-board-viewer` for Elek diagnostics source.
- Keep Elek's 7.8G schematic/reference/runtime assets outside normal Git for now; only source, docs, templates, and curated small fixtures go to GitHub.

Repository existence check, 2026-05-04:

- `panrix/royal-mail-automation`: not found.
- `panrix/xero-invoice-automation`: not found.
- `panrix/elek-board-viewer`: not found.
- `gh` CLI is not installed in the current Codex environment, so repo creation must be done through GitHub UI or a machine with `gh`.

## Summary

| path | size | current branch | upstream | meaningful dirt excluding dependency/cache noise | recommended action |
|---|---:|---|---|---:|---|
| `icorrect-shopify-theme` | 16M | `docs/homepage-redesign-brief-2026-05-02` | `origin/docs/homepage-redesign-brief-2026-05-02` | 11 | Commit or archive untracked audit/brief material inside `panrix/icorrect-shopify-theme`, then move checkout to `~/marketing/shopify-theme/`. |
| `intake-system/react-form` | 844K | `master` | none | 12 | Decide whether this becomes a dedicated repo or folds into parent-owned `intake-system/frontend`; preserve untracked app files before any parent cleanup. |
| `royal-mail-automation` | 6.1M | `master` | none | 20 | Create/choose remote, commit source/docs cleanup separately, then move checkout to `~/operations/royal-mail-automation/`. |
| `icorrect-parts-service` | 1.8M | `master` | `origin/master` | 9 | Commit/push WIP to `panrix/icorrect-parts-service`, then move checkout to `~/parts/icorrect-parts-service/`. |
| `xero-invoice-automation` | 432K | `master` | none | 15 | Create/choose finance remote, commit archive/structure cleanup, then move to `~/finance/xero-invoice-automation/`. |
| `elek-board-viewer` | 7.8G | `master` | none | 26 | Decide if this gets a dedicated diagnostics repo; separate large runtime/schematic data from source before move to `~/diagnostics/elek-board-viewer/`. |

## Parent Repo Representation

Parent repo cleanup PR #7 replaces these broken gitlinks with pointer docs:

- `icorrect-shopify-theme`
- `intake-system/react-form`
- `royal-mail-automation`

That fixes the `panrix/icorrect-builds` control-plane representation only. It does not preserve or publish the nested repos themselves.

## Detailed Findings

### `icorrect-shopify-theme`

- Remote: `git@github.com:panrix/icorrect-shopify-theme.git`
- Branch: `docs/homepage-redesign-brief-2026-05-02`
- Upstream: `origin/docs/homepage-redesign-brief-2026-05-02`
- Head: `c12c51436b168dd30846f029c5ca69e9ea488925`
- Dirt: untracked audit/brief/snapshot folders and docs.
- Destination: `~/marketing/shopify-theme/`

Recommendation:

1. In the Shopify repo, decide whether the untracked audit material is source evidence or scratch.
2. Commit source evidence to the Shopify repo, or move scratch under repo-local ignored scratch/archive.
3. Keep `panrix/icorrect-builds` as pointer-only for this path.

### `intake-system/react-form`

- Remote: none
- Branch: `master`
- Head: `9d65f3dfc958e50ed3a584becc0abb12625eab83`
- Dirt: untracked Vite/React app files, `dist/`, package files, and `TASK.md`.
- Destination undecided: either dedicated repo or fold into parent-owned `intake-system/frontend`.

Recommendation:

1. Decide source-of-truth model:
   - **Dedicated repo** if this is a separate standalone frontend.
   - **Fold into `intake-system/frontend`** if it is just the frontend for the parent-owned intake system.
2. Do not commit `dist/` as source unless there is a specific deployment reason.
3. Preserve the app files before removing the old parent gitlink.

Decision:

- Fold source into `intake-system/frontend`; do not create a dedicated repo for `react-form`.

### `royal-mail-automation`

- Remote: none
- Branch: `master`
- Head: `f529677919e7536635fdeca888e7c1ec3dd471ae`
- Dirt: modified `buy-labels.js`, `dispatch.js`, `repairs-dispatch.js`; deleted old docs/scripts; new structured docs/briefs/scripts; dependency deletion noise.
- Destination: `~/operations/royal-mail-automation/`

Recommendation:

1. Create/choose a GitHub remote, likely `panrix/royal-mail-automation`.
2. Commit source/docs cleanup in that repo, excluding `node_modules`.
3. Move as repo-owned checkout under operations after remote is live.

Decision:

- Create/use `panrix/royal-mail-automation` as the remote.

### `icorrect-parts-service`

- Remote: `git@github.com:panrix/icorrect-parts-service.git`
- Branch: `master`
- Upstream: `origin/master`
- Head: `3a67dad3dcacc5f5bdd60603b338323f9cd18c91`
- Dirt: modified `src/notify.js`; untracked changelog/index/briefs/docs/replay script.
- Destination: `~/parts/icorrect-parts-service/`

Recommendation:

1. Review and test the `src/notify.js` change.
2. Commit meaningful docs/scripts in `panrix/icorrect-parts-service`.
3. Push, then move checkout to parts domain.

No Ricky decision needed unless the WIP purpose is unclear.

### `xero-invoice-automation`

- Remote: none
- Branch: `master`
- Head: `7e486f7303a0e377fd5cea24563aff4efa9afe09`
- Dirt: old root workflow docs/files deleted; new structured docs/data/scripts folders untracked.
- Destination: `~/finance/xero-invoice-automation/`

Recommendation:

1. Create/choose a finance remote, likely `panrix/xero-invoice-automation`.
2. Commit the restructuring in that repo after checking generated workflow/data files.
3. Move checkout to finance domain after remote is live.

Decision:

- Create/use `panrix/xero-invoice-automation` as the remote.

### `elek-board-viewer`

- Remote: none
- Branch: `master`
- Head: `0928cf7975fe8f7c23a28b76d7ebe978ba1fd9ae`
- Size: 7.8G
- Dirt: many old project docs deleted; new structured docs/briefs/scratch; one PDF template; large schematic/runtime data present.
- Destination: `~/diagnostics/elek-board-viewer/`

Recommendation:

1. Decide whether this deserves a dedicated repo, likely `panrix/elek-board-viewer`.
2. Before GitHub push, split large/runtime artifacts from source:
   - Keep source code, docs, templates, curated small fixtures.
   - Exclude caches, generated parser output, and large schematic/runtime exports unless Git LFS or external storage is chosen.
3. Move checkout to diagnostics domain after source/data policy is clear.

Decision:

- Create/use `panrix/elek-board-viewer` as the diagnostics source repo.
- Keep large schematic/reference/runtime assets outside normal Git for now.

## Decision Queue For Ricky

Resolved 2026-05-04. No decision blockers remain; the next blockers are repo creation and per-repo preservation.

## Recommended Execution Order

1. Finish parent gitlink pointer PR (#7).
2. Preserve repo-owned projects with existing remotes:
   - Shopify theme
   - iCorrect parts service
3. Create remotes and preserve smaller no-remote repos:
   - Royal Mail automation
   - Xero invoice automation
4. Fold `intake-system/react-form` source into `intake-system/frontend`, excluding `dist/`.
5. Design Elek data/source split before any GitHub push.
6. Only then proceed to Phase 7b folder moves.

## Repo Creation Commands

Run from a machine with GitHub CLI authenticated as `panrix`, or create equivalent private repositories in the GitHub UI:

```bash
gh repo create panrix/royal-mail-automation --private --description "Royal Mail and fulfillment automation for iCorrect operations"
gh repo create panrix/xero-invoice-automation --private --description "Xero invoice automation and finance workflow source"
gh repo create panrix/elek-board-viewer --private --description "Elek diagnostics board viewer source and curated docs"
```

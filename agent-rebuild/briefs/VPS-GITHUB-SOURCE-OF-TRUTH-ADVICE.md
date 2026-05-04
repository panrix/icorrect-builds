# VPS / GitHub Source-of-Truth Advice

**Created:** 2026-05-04
**Status:** accepted by Ricky 2026-05-04; use as Phase 7b prerequisite policy

## The Problem

The VPS and GitHub are not currently acting like one coherent system.

Observed from `/Users/ricky/vps/builds`:

- Parent repo: `panrix/icorrect-builds.git`, current branch `agent-rebuild`.
- The parent repo tracks many domain folders directly.
- Some folders are independent nested Git repos.
- Three paths are gitlinks (`mode 160000`) but there is no `.gitmodules`, so they behave like broken/unmanaged submodules from the parent repo's point of view:
  - `icorrect-shopify-theme`
  - `intake-system/react-form`
  - `royal-mail-automation`
- Other nested repos have their contents tracked by the parent as normal files, creating double ownership:
  - `elek-board-viewer`
  - `icorrect-parts-service`
  - `xero-invoice-automation`
- `node_modules` has been tracked historically in places like `buyback-monitor` and `royal-mail-automation`, so dependency cleanup appears as huge deletion noise.
- There is substantial unrelated WIP in active folders, so a top-level migration would mix structure changes with live product changes.

That is why the system feels like it is not working correctly: there is no single rule for whether a folder is owned by the parent repo, by its own repo, or by the VPS runtime only.

## Accepted Recommendation

Before Phase 7b moves folders into domain roots, enforce one ownership model per folder.

Use three classes:

| Class | Meaning | GitHub rule | VPS rule |
|---|---|---|---|
| Parent-owned | Docs, snapshots, small scripts, rebuild control files | Tracked in `panrix/icorrect-builds` | Lives under the domain root after 7b |
| Repo-owned | Real app/service/theme with its own GitHub remote | Tracked only in its own repo, not as files in `icorrect-builds` | Can live under a domain root, but parent repo should only record a pointer/manifest |
| Runtime-only | Logs, generated data, browser profiles, local credentials, caches | Ignored or outside Git entirely | Lives in `~/data`, service dirs, or ignored runtime subdirs |

## Immediate Policy

1. Do not start 7b moves until the dirty WIP is separated from structure work.
2. Do not use gitlinks unless `.gitmodules` is intentionally maintained. The current gitlinks without `.gitmodules` should be replaced with either real submodules or, preferably, plain manifest pointers.
3. Prefer avoiding submodules for this VPS. They add friction for agents and humans. A manifest is easier:

   ```markdown
   # Repo Pointer

   Local path: /home/ricky/marketing/shopify-theme
   GitHub: git@github.com:panrix/icorrect-shopify-theme.git
   Owner domain: marketing
   Runtime role: Shopify theme source
   Deploy path: <how it deploys>
   ```

4. Parent repo `icorrect-builds` should become the structural/inventory/control-plane repo, not a bag containing every app's source and every runtime artifact.
5. Domain roots can still contain app checkouts locally, but GitHub ownership must be explicit:
   - parent repo tracks the domain `INDEX.md`, decisions, briefs, docs, and repo pointers;
   - the app repo tracks its own source;
   - runtime data is ignored or moved under `~/data`.

## Finance Root

Decision: approve `~/finance/`.

Xero work should not be hidden under operations forever. It is the seed of a deterministic finance truth layer: revenue by channel, receivables, paid invoice status, cashflow, and reconciliation. Operations consumes those outputs, but finance owns the accounting truth.

## Suggested Next Sequence

1. Write a `repo-ownership-manifest.md` listing each `~/builds` folder as parent-owned, repo-owned, or runtime-only.
2. For each broken gitlink (`icorrect-shopify-theme`, `intake-system/react-form`, `royal-mail-automation`), choose:
   - convert to a proper submodule, or
   - remove the gitlink from parent tracking and replace with a repo-pointer doc.
3. For nested repos that are currently double-owned (`icorrect-parts-service`, `xero-invoice-automation`, `elek-board-viewer`), choose whether they stay parent-owned or become repo-owned only.
4. Remove tracked dependency/vendor folders in a dedicated cleanup commit, not mixed with Phase 7b moves.
5. Only then run 7b domain migration in small commits: one domain at a time, with path sweeps and runtime checks.

## Practical Lean

For this VPS, use **manifest pointers rather than submodules** unless there is a strong reason otherwise.

The agents need paths they can reason about and maintain. Submodules are technically correct but easy to leave half-updated. Manifest pointers make the source of truth explicit without making every checkout brittle.

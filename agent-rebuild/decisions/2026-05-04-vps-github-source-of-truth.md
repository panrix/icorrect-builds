# Decision: VPS / GitHub Source of Truth Before Phase 7b

**Date:** 2026-05-04
**Decision maker:** Ricky
**Status:** accepted

## Decisions

Ricky approved the recommended model:

- Create `~/finance/` as a top-level domain root for Xero, revenue, cashflow, reconciliation, and receivables work.
- Use pointer docs instead of submodules for app/service folders that have their own GitHub repo.
- Replace broken gitlink/submodule-ish setup with pointer docs for:
  - `icorrect-shopify-theme`
  - `royal-mail-automation`
  - `intake-system/react-form`
- Make repo-owned app/service folders owned by their own repo, not also tracked as source inside `panrix/icorrect-builds`.
- Treat `panrix/icorrect-builds` as the control-plane repo: indexes, docs, manifests, decisions, briefs, inventories, and repo pointers.
- Remove tracked `node_modules` in a dedicated dependency cleanup commit, separate from Phase 7b folder moves.
- Pause Phase 7b moves until existing dirty WIP is classified by domain/task.
- Split `~/builds/scripts` into `backmarket`, `operations`, and `shared-utils`.
- Split `system-audit-2026-03-31` by domain: operations, finance, marketing, team, customer-service, backmarket, and fleet evidence.
- Keep `webhook-migration` under operations, but verify whether Shopify/Intercom leftovers remain before marking it complete.

## Consequence

Phase 7b is no longer blocked by destination philosophy. It is blocked by source-of-truth cleanup:

1. Create and review a repo ownership manifest.
2. Separate dirty WIP from structure work.
3. Replace broken gitlinks with pointer docs or an explicitly documented alternative.
4. Split/audit `scripts/` and `system-audit-2026-03-31/`.
5. Then run domain migration one domain at a time.

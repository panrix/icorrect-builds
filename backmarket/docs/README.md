# BackMarket docs

Fast navigation for anyone landing here.

---

## 🎯 Start here

**[`PLAN.md`](PLAN.md)** — the current, canonical BM rebuild plan. Phase 0–7 with status, verification, rollback, and delegation model. Version tracked inside the file (currently v5, APPROVED FOR EXECUTION). **This is the source of truth for what's being built.**

---

## 📂 Live reference docs at this level

| File | Purpose |
|------|---------|
| [`PLAN.md`](PLAN.md) | Canonical rebuild plan |
| [`../CHANGELOG.md`](../CHANGELOG.md) | Deploy-level record of every change with rollback commands |
| [`rollback-log.md`](rollback-log.md) | Detailed rollback procedures per deployment |
| [`sop-script-issue-log.md`](sop-script-issue-log.md) | Ongoing SOP/script issues tracker |
| [`INGRESS-MAP.md`](INGRESS-MAP.md) | BM service port map + nginx webhook routes (26 Mar baseline; still current) |
| [`VERIFIED-COLUMN-REFERENCE.md`](VERIFIED-COLUMN-REFERENCE.md) | Monday column IDs verified against live data |

---

## 🗄️ `historical/`

Everything pre-rebuild (Feb–Mar 2026) lives here, organised by type:

| Subfolder | What's in it |
|-----------|--------------|
| `superseded-plans-2026-03/` | Old plan docs superseded by the current `PLAN.md` (includes old SOP 6/7 brief, V6 scraper plan, trusted-buyback QA compilation) |
| `specs-delivered-2026-03/` | Specs whose work is now shipped (listings registry, sent-orders rebuild, vetted-listings UUID resolution) |
| `research-2026-03/` | Exploratory research docs (BM catalog scraper) |
| `audits-2026-02-27-to-03-27/` | 18 audit reports + payout incident evidence |
| `analysis-2026-02-to-04/` | 24 Python analysis scripts from pre-rebuild era |
| `old-qa-2026-03/` | QA tracking docs from before the rebuild plan |
| `legacy-scripts-2026-03/` | 7 dead scripts retired when `list-device.js` + webhook services took over |
| `reconciliation-snapshots-2026-03-2026-04/` | 9 historical reconcile JSON snapshots |
| `staged-plans-2026-03-31-04-01/` | Transitional planning docs from the Phase 3 rebuild (now rolled into `PLAN.md`) |
| Loose `.md` files at root of `historical/` | 23 older briefs, handoffs, task lists, and transaction-flow docs. Kept for archaeology; not current. |

---

## 🔭 Where to look for ...

- **"What are we building now?"** → `PLAN.md`
- **"What changed yesterday?"** → `../CHANGELOG.md` (newest entries at top)
- **"How do I roll back X?"** → `rollback-log.md` or the Rollback section of the relevant `CHANGELOG.md` entry
- **"What column ID is Final Grade on Monday?"** → `VERIFIED-COLUMN-REFERENCE.md`
- **"What port is `bm-shipping` on?"** → `INGRESS-MAP.md`
- **"What SOP does script X implement?"** → [`../README.md`](../README.md) (top-level BM README)
- **"What SOPs exist?"** → [`../sops/`](../sops/) directory (00–12, minus 11 which was removed)
- **"What was the plan in March that got replaced?"** → `historical/superseded-plans-2026-03/`

---

_Last tidied: 2026-04-20_

# Repo Ownership Manifest Draft

**Created:** 2026-05-04
**Status:** draft; Phase 7b prerequisite
**Decision basis:** Ricky approved the pointer-doc/control-plane model on 2026-05-04.

## Classes

| Class | Meaning | Rule |
|---|---|---|
| Parent-owned | Structural docs, snapshots, specs, small scripts, and domain docs that belong in `panrix/icorrect-builds`. | Track in parent repo. Move with Phase 7b. |
| Repo-owned | Real app/service/theme with its own repository or should clearly get one. | Parent repo tracks only a pointer/manifest doc, not source. Local checkout may live under a domain root. |
| Runtime-only | Logs, generated data, browser profiles, caches, credentials, state, large datasets. | Ignore or move outside git. Never use as canonical source. |
| Split-first | Folder is too mixed to classify/move as one unit. | Audit, write split manifest, then move pieces. |
| Archive | Not an active source of truth. | Move to dated archive after path/reference check. |

## Folder-Level Ownership

| folder | ownership class | destination | notes |
|---|---|---|---|
| agent-rebuild | Parent-owned | `~/builds/agent-rebuild/` for now | Control-plane workspace for rebuild. |
| alex-triage-classifier-rebuild | Parent-owned | `~/customer-service/alex-triage-classifier-rebuild/` | Dormant brief/spec. |
| alex-triage-rebuild | Parent-owned | `~/customer-service/alex-triage-rebuild/` | Active workflow, no separate repo found. |
| apple-ssr | Parent-owned | `~/parts/apple-ssr/` | Research/build artifacts. |
| backmarket | Parent-owned | `~/backmarket/ops/` | Active BM ops workspace in parent repo. |
| backmarket-browser | Parent-owned with Runtime-only subdirs | `~/backmarket/browser/` | Source/docs parent-owned; browser profiles/session data runtime-only. |
| backmarket-seller-support | Parent-owned | `~/backmarket/seller-support/` | Snapshot docs. |
| bm-scripts | Archive | `~/backmarket/archive/bm-scripts/` | Tiny dormant leftover. |
| buyback-monitor | Parent-owned | `~/backmarket/buyback-monitor/` | Parent-owned currently; tracked `node_modules` cleanup completed in `cb3a535`. |
| claude-project-export | Parent-owned | `~/operations/claude-project-export/` | Snapshot/corpus. |
| customer-service | Parent-owned | `~/customer-service/audit-snapshot/` | Audit snapshot. |
| data | Archive or Parent-owned scratch | `~/backmarket/scratch/data/` | Ambiguous BM data drop; review before preserving. |
| data-architecture | Archive | `~/archive/2026-05-04-phase-7-retired/data-architecture/` | Ricky decision: archive. |
| documentation | Parent-owned | `~/operations/documentation-staging/` | Imported docs staging. |
| elek-board-viewer | Repo-owned candidate + Runtime-only data | `~/diagnostics/elek-board-viewer/` | Nested git repo exists but no origin configured. Needs repo decision before parent stops tracking source. |
| hiring | Parent-owned | `~/team/hiring/` | Hiring collateral. |
| icloud-checker | Parent-owned | `~/intake/icloud-checker/` | Live service in parent repo. Runtime credentials outside git. |
| icorrect-parts-service | Repo-owned | `~/parts/icorrect-parts-service/` | Nested repo with origin `panrix/icorrect-parts-service`. Parent should track pointer only. |
| icorrect-shopify-theme | Repo-owned | `~/marketing/shopify-theme/` | Gitlink without `.gitmodules`; nested repo has origin `panrix/icorrect-shopify-theme`. Replace parent gitlink with pointer doc. |
| intake-notifications | Parent-owned | `~/intake/intake-notifications/` | Spec/planning workspace. |
| intake-system | Parent-owned with repo-owned child | `~/intake/intake-system/` | Parent owns backend/shared docs; `react-form` is repo-owned child/pointer. |
| intake-system/react-form | Repo-owned | `~/intake/intake-system/react-form/` or standalone checkout | Gitlink without `.gitmodules`; no origin configured. Needs pointer doc and repo remote decision. |
| intercom-agent | Parent-owned | `~/customer-service/intercom-agent/` | Spec. |
| intercom-config | Parent-owned | `~/customer-service/intercom-config/` | Config research. |
| inventory-system | Parent-owned | `~/parts/inventory-system/` | Spec. |
| llm-summary-endpoint | Parent-owned | `~/operations/llm-summary-endpoint/` | Live minimal service; no separate repo found. |
| marketing-intelligence | Parent-owned | `~/marketing/marketing-intelligence/` | Snapshot/stub docs; service source appears elsewhere. |
| mobilesentrix | Parent-owned | `~/parts/mobilesentrix/` | Supplier discovery pack. |
| monday | Parent-owned | `~/operations/monday/` | Monday docs/scripts. |
| mutagen-guide | Parent-owned | `~/fleet/mutagen-guide/` | Shared infra guide. |
| operations-system | Parent-owned | `~/operations/operations-system/` | Process-truth workspace. |
| pricing-sync | Parent-owned | `~/operations/pricing-sync/` | Cross-system pricing audit. |
| qa-system | Parent-owned | `~/fleet/qa-system/` | Ricky decision: fleet. |
| quote-wizard | Parent-owned | `~/intake/quote-wizard/` | Intake-facing Shopify quote builder. |
| repair-analysis | Parent-owned | `~/operations/repair-analysis/` | Small analysis scripts. |
| research | Parent-owned | `~/fleet/research/` | Meta research. |
| royal-mail-automation | Repo-owned | `~/operations/royal-mail-automation/` | Gitlink without `.gitmodules`; no origin configured. Replace with pointer doc after repo remote decision. |
| scripts | Split-first | backmarket / operations / shared-utils | Ricky decision: audit and split now. |
| server-config | Parent-owned with Runtime-only exclusions | `~/fleet/server-config/` | Config snapshots. PM2 dumps ignored/redacted; live secrets not source. |
| shift-bot | Parent-owned | `~/team/shift-bot/` | Team scheduling bot. |
| system-audit-2026-03-31 | Split-first | by domain | Ricky decision: split now by domain. |
| team-audits | Parent-owned with Runtime-only secrets/data | `~/team/team-audits/` | Active audit project; `.env` ignored/runtime-only. |
| telephone-inbound | Parent-owned with Runtime-only logs | `~/intake/telephone-inbound/` | Live service; logs runtime-only. |
| templates | Parent-owned | `~/fleet/templates/` | Shared templates. |
| voice-note-pipeline | Archive after stop | archive | Deprecated; stop worker first. |
| voice-notes | Archive | `~/archive/2026-05-04-phase-7-retired/voice-notes/` | Dead per inventory. |
| webhook-migration | Parent-owned | `~/operations/webhook-migration/` | Verify completion and leftover Shopify/Intercom work. |
| website-conversion | Parent-owned | `~/marketing/website-conversion/` | Ricky decision: marketing. |
| whisper-api | Parent-owned | `~/intake/whisper-api/` | Runtime path in OpenClaw config must be patched exactly. |
| xero-invoice-automation | Repo-owned | `~/finance/xero-invoice-automation/` | Nested repo exists but no origin configured. Finance root approved. |
| xero-invoice-notifications | Parent-owned | `~/finance/xero-invoice-notifications/` | Pair with Xero automation. |

## Broken Gitlinks To Replace

These are gitlinks in the parent repo with no `.gitmodules`:

| path | current local repo origin | action |
|---|---|---|
| `icorrect-shopify-theme` | `git@github.com:panrix/icorrect-shopify-theme.git` | Replace gitlink with repo pointer doc after preserving current branch/WIP. |
| `intake-system/react-form` | none configured | Decide/create remote, then replace gitlink with pointer doc. |
| `royal-mail-automation` | none configured | Decide/create remote, then replace gitlink with pointer doc. |

## Nested Repos To Normalize

| path | current origin | action |
|---|---|---|
| `icorrect-parts-service` | `git@github.com:panrix/icorrect-parts-service.git` | Make repo-owned; parent tracks pointer only. |
| `xero-invoice-automation` | none configured | Make repo-owned under finance; decide/create remote. |
| `elek-board-viewer` | none configured | Repo-owned candidate; decide/create remote or deliberately parent-own source. |

## Runtime-Only Patterns

These should be ignored or moved outside git before/while migrating:

- `node_modules/`
- PM2 dumps
- `.env` and local credentials
- browser profiles and CDP sessions
- logs
- generated data/cache folders
- large board/schematic/runtime exports unless explicitly curated as evidence

## Next Passes

1. Dirty-WIP classification by folder/task.
2. Dependency cleanup commit for tracked `node_modules` completed in `cb3a535`.
3. Broken gitlink pointer-doc conversion.
4. `scripts/` split manifest.
5. `system-audit-2026-03-31/` split manifest.
6. Phase 7b domain moves.

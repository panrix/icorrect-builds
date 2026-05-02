# Phase 6.9d QA Report
Generated: 2026-05-01

## Executive summary
- Total P1 discrepancies: 107
- Total P2 discrepancies: 1
- Missed ideas surfaced: 10
- Ricky's overrides applied (with notes): 13
- Blueprint coverage: 38% (59/155 initiatives represented in `idea-inventory.md`)

The biggest issue is coverage, not just tagging: `idea-inventory.md` only represents 59 of 155 blueprint initiatives, and it systematically drops cron jobs, commands, and agent-task rows.

## Task 1 — Folder re-scan

Sampling note: the prompt asked for one dormant folder `>90 days` old. On 2026-05-01 there was no literal candidate in the current inventory; the oldest dormant folders sampled (`voice-notes`, `website-conversion`) were last modified on 2026-02-22, which is 68 days old. I sampled the oldest dormant stub instead and am flagging the date mismatch explicitly.

### `voice-notes`
- Evidence sampled: `README.md`, `snapshot/otter-transcript-insights.md`, `snapshot/Intake system_otter_ai.txt`, `find -maxdepth 2`, `du -sh` (`36K`).
- Re-derived: `state=dead`, `owner=main`, `canonical_status=draft`, purpose = historical transcript stub with no active implementation; live voice-note work now lives in `voice-note-pipeline`.
- Inventory says: `dormant | main | draft`.
- `P1`: state is wrong. Ricky overrode this to `dead`, and the folder evidence supports that call.

### `claude-project-export`
- Evidence sampled: top-level `README.md`, folder layout, `du -sh` (`1.1M`).
- Re-derived: `state=dormant`, `owner=operations`, `canonical_status=snapshot-of-other`, purpose = exported SOP/reference corpus whose own README is titled `Operations SOPs` and points current SOP locations to `../operations/`.
- Inventory says: `dormant | main | snapshot-of-other`.
- `P1`: owner is wrong. This should move from `main` to `operations`, matching Ricky's override and the folder's own framing.

### `scripts`
- Evidence sampled: `monday-repair-flow-traces.py`, folder listing, `du -sh` (`52K`).
- Re-derived: `state=dormant`, `owner=operations`, `canonical_status=scratch`, purpose = mixed utility folder, but the strongest live breadcrumb is Monday/ops analysis output written into the docs estate.
- Inventory says: `dormant | none | scratch`.
- `P1`: owner must change to `operations` per Ricky's override. Evidence is mixed, but the override is defensible and should be applied.

### `buyback-monitor`
- Evidence sampled: `README.md`, top-level scripts, data directory, `du -sh` (`61M`).
- Re-derived: `active | backmarket | canonical`.
- Inventory says: `active | backmarket | canonical`.
- No discrepancy.

### `website-conversion`
- Evidence sampled: `SPEC.md`, full folder listing, `du -sh` (`12K`).
- Re-derived: `dormant`, purpose = pure conversion/growth spec for collection/product-page UX and measurement, `canonical_status=draft`.
- Inventory says: `dormant | arlo-website | draft`.
- `P2`: current `arlo-website` ownership is defensible, but the content is strongly marketing/growth oriented and should at least be flagged as a marketing claim/conflict candidate.

### `telephone-inbound`
- Evidence sampled: `server.py`, service file, runtime log, `du -sh` (`76K`).
- Re-derived: `active`, `owner=operations`, `canonical_status=canonical`, purpose = live phone-intake infrastructure that posts to Slack and can create Monday items / Intercom contacts.
- Inventory says: `active | alex-cs | canonical`.
- `P1`: owner is wrong. This is intake infrastructure, not an Alex-only triage tool.

### `llm-summary-endpoint`
- Evidence sampled: `server.js`, `package.json`, folder layout, `du -sh` (`12M`), direct live health checks on 2026-05-01:
  - `https://mc.icorrect.co.uk/api/summarize-updates/health`
  - `http://127.0.0.1:8004/api/summarize-updates/health`
  - both returned `{"status":"ok","model":"anthropic/claude-sonnet-4-6",...}`
- Re-derived: `state=active`, `owner=operations`, `canonical_status=canonical`, purpose = live summarization microservice used by intake workflows.
- Inventory says: `dormant | operations | canonical`.
- `P1`: state is wrong. The service is live, healthy, and directly reachable.

### `monday`
- Evidence sampled: `README.md`, top-level docs, `services/status-notifications`, `du -sh` (`11M`).
- Re-derived: `active | operations | canonical`.
- Inventory says: `active | operations | canonical`.
- No discrepancy.

## Task 2 — Idea spot-checks

Method: seeded spread across owners and priorities, including one `unranked` row. I checked source existence, source-line accuracy, idea text, state hint, and owner reasonableness.

- `06fd1bfe` `quote-wizard/README.md:134`: idea is present at lines 136-138; line is within tolerance; state hint is reasonable. `P1`: suggested owner should be `arlo-website`, not `alex-cs`, per Ricky override.
- `2fba5dfe` `website-conversion/SPEC.md:41`: pass.
- `3338c2f5` `icloud-checker/AUDIT-AND-DECOMPOSITION.md:205`: pass.
- `6d33893b` `backmarket/reports/qc-sku-handoff-change-plan-2026-04-26.md:5`: pass.
- `4618dbdb` `elek-board-viewer/PROJECT-STATE.md:157`: pass.
- `817a3a28` `claude-project-export/README.md:27`: idea is present at line 27 exactly. `P1`: suggested owner should be `operations`, not `main`, per Ricky override on the folder/corpus.
- `3586f41b` `marketing-intelligence/README.md:10`: pass.
- `7a5b752c` `PHASE-6.9-SPEC.md:4`: pass.
- `86a6d1b5` `xero-invoice-automation/SETUP.md:129`: pass.
- `eec17143` `inventory-system/SPEC.md:74`: pass.
- `7cfa99ab` `automation-blueprint.md:170`: pass.
- `1e384387` `automation-blueprint.md:419`: pass.
- `7c96df22` `monday/board-v2-build-status.md:128`: pass.
- `9aaef828` `intercom-config/strategy/inbox-views.md:13`: pass.
- `07795d61` `automation-blueprint.md:122`: pass.

Result: 13/15 spot-checks passed cleanly. The two failures were both owner drift against Ricky's overrides, not hallucinated source text.

## Task 3 — Missed ideas

These do not currently appear in `idea-inventory.md` and should be backfilled.

- Send a portable-monitor / HDMI-kit flow so screen-damaged mail-in clients can grant access without blocking intake.  
  `source_path`: `/home/ricky/builds/voice-notes/snapshot/Intake system_otter_ai.txt:2`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Require intake to test the passcode/password live with the customer before the device reaches technicians.  
  `source_path`: `/home/ricky/builds/voice-notes/snapshot/Intake system_otter_ai.txt:2`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Reserve/allocate parts during intake or pre-acceptance and surface stock-delay ETAs before promising turnaround.  
  `source_path`: `/home/ricky/builds/voice-notes/snapshot/Intake system_otter_ai.txt:20`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Define the cross-flow client-notifications matrix: what goes out, when, and on which channel.  
  `source_path`: `/home/ricky/builds/claude-project-export/README.md:70`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Define a standard diagnostic-report format for Saf's findings.  
  `source_path`: `/home/ricky/builds/claude-project-export/README.md:72`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Build the `payment received -> booking confirmation` workflow so paid customers always get a follow-up task.  
  `source_path`: `/home/ricky/builds/claude-project-export/sop-project/alex-paid-not-contacted.md:105`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Build a standardised quote-template library by fault type for Ferrari's quoting flow.  
  `source_path`: `/home/ricky/builds/claude-project-export/sop-project/ops-sop-quoting-process.md:113`  
  `state_hint`: `captured`  
  `suggested_owner`: `alex-cs`

- Build an automated quote-chase system with 1-2 week triggers and pricing-expiry warnings.  
  `source_path`: `/home/ricky/builds/claude-project-export/sop-project/ops-sop-quoting-process.md:116`  
  `state_hint`: `captured`  
  `suggested_owner`: `alex-cs`

- Add a timed chase policy for uncollected devices, including reminder timing, storage escalation, and clear owner assignment.  
  `source_path`: `/home/ricky/builds/agent-rebuild/sop-edge-cases-and-verification.md:205`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

- Add a payment-exception branch for collection handoff on pay-later, invoiced, or unreconciled items.  
  `source_path`: `/home/ricky/builds/agent-rebuild/sop-edge-cases-and-verification.md:218`  
  `state_hint`: `captured`  
  `suggested_owner`: `operations`

## Task 4 — Override application

### Owner overrides

- `claude-project-export`: current inventory still says `main`; Ricky says `operations`; evidence supports Ricky.
  ```diff
  --- a/folder-inventory.md
  +++ b/folder-inventory.md
  - | claude-project-export | 1.1M | dormant | main | medium | snapshot-of-other | ...
  + | claude-project-export | 1.1M | dormant | operations | medium | snapshot-of-other | ...

  --- a/ownership-manifests/main.md
  +++ b/ownership-manifests/main.md
  - remove claude-project-export row

  --- a/ownership-manifests/operations.md
  +++ b/ownership-manifests/operations.md
  + add claude-project-export row
  ```

- `intake-notifications`: current inventory still says `alex-cs`; Ricky says `operations`; evidence supports Ricky (`plan.md` and `REBUILD-BRIEF.md` frame it as intake infrastructure replacement).
  ```diff
  - | intake-notifications | 112K | dormant | alex-cs | medium | draft | ...
  + | intake-notifications | 112K | dormant | operations | medium | draft | ...

  - ownership-manifests/alex-cs.md: remove row
  + ownership-manifests/operations.md: add row
  ```

- `quote-wizard`: current inventory still says `alex-cs`; Ricky says `arlo-website`; evidence supports Ricky (folder is a Shopify menu-builder, not a CS runtime).
  ```diff
  - | quote-wizard | 216K | dormant | alex-cs | medium | draft | ...
  + | quote-wizard | 216K | dormant | arlo-website | medium | draft | ...

  - ownership-manifests/alex-cs.md: remove row
  + ownership-manifests/arlo-website.md: add row
  ```

- `repair-analysis`: already matches Ricky (`operations`). No patch needed.

- `scripts`: current inventory still says `none`; Ricky says `operations`.
  ```diff
  - | scripts | 52K | dormant | none | low | scratch | ...
  + | scripts | 52K | dormant | operations | low | scratch | ...

  - ownership-orphans-and-conflicts.md: remove scripts from orphans/conflicts
  + ownership-manifests/operations.md: add scripts row
  ```

- `system-audit-2026-03-31`: current inventory still says `main`; Ricky says `operations`.
  ```diff
  - | system-audit-2026-03-31 | 6.8M | dormant | main | medium | snapshot-of-other | ...
  + | system-audit-2026-03-31 | 6.8M | dormant | operations | medium | snapshot-of-other | ...

  - ownership-manifests/main.md: remove row
  + ownership-manifests/operations.md: add row
  ```

- `telephone-inbound`: current inventory still says `alex-cs`; Ricky says `operations`; folder content supports Ricky.
  ```diff
  - | telephone-inbound | 76K | active | alex-cs | medium | canonical | ...
  + | telephone-inbound | 76K | active | operations | medium | canonical | ...

  - ownership-manifests/alex-cs.md: remove row
  + ownership-manifests/operations.md: add row
  ```

- `webhook-migration`: owner already matches Ricky (`operations`). No owner patch needed.
- `whisper-api`: owner already matches Ricky (`operations`). No owner patch needed.
- `xero-invoice-automation`: owner already matches Ricky (`operations`). No owner patch needed.
- `xero-invoice-notifications`: owner already matches Ricky (`operations`). No owner patch needed.

### State overrides

- `voice-notes`: current inventory still says `dormant`; Ricky says `dead`; folder evidence supports Ricky.
  ```diff
  - | voice-notes | 36K | dormant | main | medium | draft | ...
  + | voice-notes | 36K | dead | main | medium | draft | ...

  - ownership-manifests/main.md summary/counts and row state
  + ownership-manifests/main.md summary/counts and row state updated to dead
  ```

- `webhook-migration`: Ricky's note is `shipped/dormant`, not plain parked dormant. The schema has no separate `shipped` column, so I would keep `state=dormant` but patch the one-line purpose/rationale to say the Monday status-notification slice is completed/shipped while the Shopify/Intercom slice remains unbuilt.
  ```diff
  ~ folder-inventory.md purpose cell: add shipped/completed nuance
  ~ ownership-manifests/operations.md rationale: add shipped-completed nuance
  ```

### `llm-summary-endpoint` investigation

- Proposed owner: `operations`
- Proposed state: `active`
- Evidence:
  - local `server.js` is a real Express summarization service on port `8004`
  - `intake-notifications` and `intake-system` explicitly reference this code as the current summary component to absorb
  - direct health checks on 2026-05-01 against both public and local endpoints returned `status=ok`
- Patch:
  ```diff
  - | llm-summary-endpoint | 12M | dormant | operations | medium | canonical | ...
  + | llm-summary-endpoint | 12M | active | operations | medium | canonical | ...

  ~ ownership-manifests/operations.md summary/counts and row state
  ```

## Task 5 — Blueprint coverage

- Total blueprint initiatives parsed: 155
- Represented in `idea-inventory.md`: 59
- Missing from `idea-inventory.md`: 96
- Coverage: 38.1%
- Priority mismatches among represented rows: 0
- State-hint mismatches among represented rows: 0
- Net-new ideas in `idea-inventory.md` beyond the blueprint: 112

### Missing blueprint initiatives (`P1`)

#### Operations (12 missing)
- Cron: `Daily queue summary`, `Aging alert run`, `Bottleneck report`, `Zombie archive candidate sweep`
- Command: `/queue`, `/status <item>`, `/aging`, `/bench <name>`, `/ops-summary`
- Agent task: `Bottleneck analysis`, `SOP improvement recommendations`, `Queue policy design`

#### Team (11 missing)
- Cron: `Weekly performance summary`, `Capacity warning`, `Hiring trigger review`
- Command: `/team-status`, `/kpi <name>`, `/capacity`, `/rework`
- Agent task: `Performance review analysis`, `Hiring decision support`, `Team dynamic assessment`, `Training recommendation writing`

#### Revenue & Sales (28 missing)
- Script: `BM sent-orders ingestion`, `BM intake checks`, `BM grade/profit check`, `BM trade-in payout validator`, `BM listing creator`, `Listings reconciliation`, `Buy box checker`, `Sale detection`, `Dispatch automation`, `Shipment confirmation`, `Buyback daily monitor`, `Buyback weekly profitability report`
- Cron: `BM sent-orders run`, `Sale detection run`, `Dispatch run`, `Listings reconciliation run`, `Buy box read-only scan`, `Tuesday cutoff alert`, `Revenue summary`
- Command: `/buybox`, `/sales-today`, `/profitability <model>`, `/stock-value`, `/bm-cutoff`
- Agent task: `Pricing strategy decisions`, `Assortment / model strategy`, `Competitor response planning`, `Edge-case profitability judgement`

#### Finance (11 missing)
- Cron: `Daily revenue summary`, `Weekly cashflow forecast`, `Monthly P&L snapshot`, `Outstanding receivables report`
- Command: `/revenue-today`, `/cashflow`, `/outstanding`, `/hmrc`
- Agent task: `Financial trend analysis`, `Planning / target modeling`, `Anomaly detection interpretation`

#### Customer Service (11 missing)
- Cron: `Morning inbox triage support run`, `Daily CS metrics summary`, `No-reply alert`
- Command: `/inbox-status`, `/customer <name>`, `/response-times`, `/paid-not-contacted`
- Agent task: `Draft replies`, `Escalation handling`, `Sentiment / risk analysis`, `Complaint pattern interpretation`

#### Marketing & Growth (12 missing)
- Cron: `Daily GSC pull`, `Weekly rank scans`, `Monthly competitor checks`, `Daily marketing summary`
- Command: `/rankings <keyword>`, `/traffic-today`, `/conversion-rate`, `/seo-opportunities`
- Agent task: `Content strategy`, `Ad campaign planning`, `SEO audit interpretation`, `Brief writing`

#### Parts & Inventory (11 missing)
- Cron: `Daily low-stock alert`, `Weekly usage report`, `Monthly supplier review`, `Demand forecast refresh`
- Command: `/stock <part>`, `/reorder-list`, `/supplier-price <part>`, `/usage <part>`
- Agent task: `Supplier negotiation prep`, `Demand pattern analysis`, `Inventory strategy`

### Mis-prioritised / mis-stated blueprint rows
- None found among the 59 blueprint-backed rows that do exist in `idea-inventory.md`. Where a row existed, the current priority and `state_hint` were aligned with the blueprint's `Priority` and `Exists?` fields.

## Task 6 — Marketing under-tagging

Verdict: marketing owning only `marketing-intelligence` is probably too narrow.

- `monday/`: sampled content is operational board/rebuild infrastructure, not a marketing-owned folder.
- `operations-system/`: contains attribution and lead-funnel symptoms, but the folder is still an operations rebuild, not a marketing workspace.
- `website-conversion/`: this is explicitly a conversion/growth spec with funnel metrics, measurement planning, and UX uplift goals. It should at least be flagged as a `marketing` claim or `marketing`/`arlo-website` conflict.
- `apple-ssr/`: clearly parts/procurement research, not marketing.

Proposed marketing claim:
- `website-conversion` — rationale: the folder is pure conversion strategy and measurement planning, not implementation code.

## P1 patches required before 6.9 sign-off

- `folder-inventory.md`
  - change `voice-notes` state `dormant -> dead`
  - change `claude-project-export` owner `main -> operations`
  - change `intake-notifications` owner `alex-cs -> operations`
  - change `quote-wizard` owner `alex-cs -> arlo-website`
  - change `scripts` owner `none -> operations`
  - change `system-audit-2026-03-31` owner `main -> operations`
  - change `telephone-inbound` owner `alex-cs -> operations`
  - change `llm-summary-endpoint` state `dormant -> active`
  - patch `webhook-migration` one-line purpose so the shipped/completed slice is explicit

- `idea-inventory.md`
  - change `06fd1bfe` suggested owner `alex-cs -> arlo-website`
  - change `817a3a28` suggested owner `main -> operations`
  - backfill the 10 missed ideas from Task 3
  - backfill the 96 missing blueprint initiatives from Task 5

- `ownership-manifests/*.md`
  - move `claude-project-export` from `main.md` to `operations.md`
  - move `intake-notifications` from `alex-cs.md` to `operations.md`
  - move `quote-wizard` from `alex-cs.md` to `arlo-website.md`
  - add `scripts` to `operations.md`
  - move `system-audit-2026-03-31` from `main.md` to `operations.md`
  - move `telephone-inbound` from `alex-cs.md` to `operations.md`
  - update `voice-notes` state/counts in `main.md`
  - update `llm-summary-endpoint` state/counts in `operations.md`
  - update `webhook-migration` rationale in `operations.md` to record shipped/dormant nuance

- `ownership-orphans-and-conflicts.md`
  - remove `scripts` from the orphan/conflict set
  - remove stale `quote-wizard` / `system-audit-2026-03-31` / `claude-project-export` conflict language after Ricky's overrides are applied

## Honest caveats

- I did not fully deep-read large folders; I followed the requested sample method (`ls -la`, `head`, `find -maxdepth 2`, `du -sh`) and only opened key docs/entry points.
- The Task 1 `>90 day dormant folder` requirement could not be satisfied literally on 2026-05-01 because the oldest dormant candidates in the current inventory were 68 days old, not 90+.
- Blueprint matching was semantic but still name-based. I am confident in the broad conclusion because the gap is structural: the current inventory overwhelmingly preserves scripts while omitting cron/command/agent-task initiatives.
- `slack-intake-readiness.md` still claims the summary endpoint reported `gpt-4o-mini`, but direct health checks on 2026-05-01 returned `anthropic/claude-sonnet-4-6`. I treated the live endpoint and local code as authoritative and did not count the stale note as a 6.9 blocker because it is outside the inventory/manifests.

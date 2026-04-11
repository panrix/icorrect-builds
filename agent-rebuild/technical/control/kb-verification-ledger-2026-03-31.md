# KB Verification Ledger

Date opened: 2026-03-31
Owner: Codex
Purpose: live ledger for verifying KB documents against real evidence during the agent rebuild

## Verification Status Key

- `verified`
- `partially-verified`
- `needs-source-verification`
- `needs-operator-confirmation`
- `policy`
- `archive-candidate`

Reference framework:

- [kb-verification-framework.md](/home/ricky/kb/system/kb-verification-framework.md)

## Wave 1: System Docs

### 1. `/home/ricky/kb/system/live-operating-map.md`

- Doc type: runtime map
- Current status: `partially-verified`
- Verification method: runtime + config + filesystem
- Evidence to use:
  - `/home/ricky/.openclaw/openclaw.json`
  - `/home/ricky/.openclaw/agents`
  - `systemctl --user status openclaw-gateway.service`
  - active crontab
  - archive destinations under `/home/ricky/data/archives`
- Claims already likely safe:
  - OpenClaw active
  - Paperclip parked
  - Mission Control v2 legacy
  - 14 active agents listed
- Claims that still need explicit proof:
  - whether every role label should be treated as runtime fact or descriptive shorthand
- Action:
  - runtime, crontab, archive paths, and workspace roots checked
  - 2026-04-01 refresh completed after active-layer normalization
  - keep as `partially-verified` because the document still mixes live state with policy/recommendation sections

### 2. `/home/ricky/kb/system/workspace-contract.md`

- Doc type: policy
- Current status: `policy`
- Verification method: policy + spot-check against active workspaces
- Evidence to use:
  - current active workspace roots under `/home/ricky/.openclaw/agents`
  - live operating decisions already adopted
- Notes:
  - this is a rule document, not a pure runtime snapshot
  - main and diagnostics workspace spot-checks completed
- Action:
  - 2026-04-01 refresh completed after active-layer normalization and post-cleanup spot-checks
  - keep as policy

### 3. `/home/ricky/kb/system/agent-map.md`

- Doc type: config/runtime map
- Current status: `partially-verified`
- Verification method: config + runtime
- Evidence to use:
  - `/home/ricky/.openclaw/openclaw.json`
  - `/home/ricky/.openclaw/agents`
  - bindings from `openclaw.json`
  - systemd service status for the live gateway
- Obvious risky claims:
  - role labels are still descriptive and not directly encoded in config
  - this document should not be used as evidence for Supabase-side registry state
- Action:
  - active agent list, bindings, workspace path pattern, and account IDs checked
  - stale source timestamp, messaging limitation note, and Supabase registry section removed
  - 2026-04-01 refresh completed after the final active-workspace control-layer sweep

### 4. `/home/ricky/kb/system/supabase-schema.md`

- Doc type: external-system schema/reference
- Current status: `partially-verified`
- Verification method: external system + active config
- Evidence to use:
  - live Supabase schema or direct export
  - current active hooks/scripts
  - current active cron and runtime paths
- Obvious risky claims:
  - live DB still contains Mission Control-era webhook triggers
  - `agent_registry` may not match the actual OpenClaw runtime
  - some tables exist but appear unused or stale (`business_state`, `memory_summaries`, `audit_snapshots`)
- Action:
  - live DB verified via `psql`
  - document rewritten from live evidence
  - keep as `partially-verified` until webhook cleanup and registry reconciliation are completed

### 5. `/home/ricky/kb/system/builds-documentation-policy.md`

- Doc type: policy
- Current status: `policy`
- Verification method: policy
- Evidence to use:
  - operator approval
  - consistency with current cleanup direction
- Notes:
  - this doc sets the rule for `/builds`
  - it does not need runtime proof for each sentence
- Action:
  - keep as policy unless the operating model changes

### 6. `/home/ricky/kb/system/kb-verification-framework.md`

- Doc type: policy/process
- Current status: `policy`
- Verification method: policy
- Evidence to use:
  - operator approval
  - consistency with cleanup and documentation goals
- Action:
  - keep as the active verification standard

## Wave 2: Domain Docs

Domains to verify after system docs:

- `/home/ricky/kb/operations`
- `/home/ricky/kb/monday`
- `/home/ricky/kb/pricing`
- `/home/ricky/kb/team`
- `/home/ricky/kb/backmarket`

### Back Market

#### `/home/ricky/kb/backmarket/README.md`

- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/backmarket/README.md`
  - `/home/ricky/builds/backmarket/sops/06-listing.md`
  - `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/triage-executed/kb-inbox-triage-2026-03-31.md`
- Risks:
  - build-repo README contains live-service and revenue framing that may drift
  - only durable domain-boundary claims should be preserved in canon
- Action:
  - create the domain home and explicitly fence time-sensitive commercial notes outside canon

#### `/home/ricky/kb/backmarket/product-id-resolution.md`

- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/backmarket/knowledge/bm-product-ids.md`
  - `/home/ricky/builds/backmarket/README.md`
  - `/home/ricky/builds/backmarket/sops/06-listing.md`
  - `/home/ricky/builds/buyback-monitor/docs/BM-PRODUCT-PAGE-STRUCTURE.md`
  - `/home/ricky/builds/backmarket/data/product-id-lookup.json`
- Risks:
  - older notes still reference the obsolete `bm-scripts` path
  - resolver truth has evolved from raw lookup-table logic to registry-plus-catalog logic
- Action:
  - promote a corrected canonical summary that preserves the durable model but reflects the current resolver architecture

### Operations tranche

#### `/home/ricky/kb/operations/intake-flow.md`

- Doc type: process/workflow
- Current status: `needs-operator-confirmation`
- Verification method: build specs + operator/process confirmation
- Evidence used:
  - `/home/ricky/builds/intake-system/SPEC.md`
  - `/home/ricky/builds/intake-system/flows/diagnostic-intake-flow.md`
  - `/home/ricky/builds/intake-system/flows/standard-repair-flow.md`
  - `/home/ricky/builds/intake-system/flows/bm-tradein-flow.md`
  - `/home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md`
- Notes:
  - build intent is documented
  - current human process and staff-role claims still need direct confirmation

#### `/home/ricky/kb/operations/qc-workflow.md`

- Doc type: process/workflow
- Current status: `needs-operator-confirmation`
- Verification method: inherited SOP notes + operator/process confirmation
- Evidence used:
  - `/home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md`
  - `/home/ricky/builds/monday/main-board-column-audit.md`
  - `/home/ricky/builds/monday/board-schema.md`
  - `/home/ricky/builds/monday/repair-flow-traces.md`
- Notes:
  - Monday-related column references can be checked from local board docs
  - current QC practice, performance ownership, and real checklist behavior still need operator confirmation

#### `/home/ricky/kb/operations/queue-management.md`

- Doc type: process/workflow
- Current status: `needs-operator-confirmation`
- Verification method: workflow notes + operator/process confirmation
- Evidence used:
  - `/home/ricky/builds/monday/repair-flow-traces.md`
  - `/home/ricky/builds/monday/target-state.md`
  - `/home/ricky/builds/intake-system/SPEC.md`
  - `/home/ricky/builds/documentation/raw-imports/sops-operational-procedures.md`
- Notes:
  - this document is correctly treated as a skeleton
  - staffing, throughput, and queue-behavior claims are not local-runtime facts and need confirmation

### Monday

#### `/home/ricky/kb/monday/main-board.md`

- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/monday/board-schema.md`
  - `/home/ricky/builds/monday/main-board-column-audit.md`
  - `/home/ricky/builds/monday/automations.md`
- Risks:
  - values and counts are from a 2026-02-23 API pull, not a live current export
  - current automation counts and group usage may have drifted
- Action:
  - keep as partial until a fresh Monday export/API pull is available

#### `/home/ricky/kb/monday/bm-devices-board.md`

- Recommended status: `needs-source-verification`
- Evidence sources:
  - `/home/ricky/builds/monday/board-schema.md`
  - `/home/ricky/builds/backmarket/docs/VERIFIED-COLUMN-REFERENCE.md`
  - any fresh Monday export/API pull
- Risks:
  - board columns and operational notes likely came from older exports
  - “definitive source” and flow assumptions should not be trusted without fresher evidence
- Action:
  - verify board/group/column details against current Monday evidence

#### `/home/ricky/kb/monday/board-relationships.md`

- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/monday/board-schema.md`
  - `/home/ricky/builds/monday/main-board-column-audit.md`
  - `/home/ricky/builds/monday/target-state.md`
- Risks:
  - relationship structure is probably broadly right, but “47+ boards exist” and sync assumptions need fresher evidence
- Action:
  - retain the relationship model, downgrade old inventory/count claims

#### `/home/ricky/kb/monday/parts-board.md`

- Recommended status: `needs-source-verification`
- Evidence sources:
  - current Parts board export/API pull
  - `/home/ricky/builds/monday/board-schema.md`
  - local parts-related build notes if present
- Risks:
  - stock, supplier share, and volume claims are business data, not durable schema facts
  - current board column detail is explicitly incomplete in the doc itself
- Action:
  - split schema facts from business-analysis claims

### Pricing

#### `/home/ricky/kb/pricing/iphone.md`
- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/pricing-sync/data/monday-pricing.json`
- Risks:
  - many device/repair rows are locally corroborated, but VAT and surcharge policy lines still need business confirmation
  - duplicate model sections and naming drift should be cleaned before treating the file as a polished reference

#### `/home/ricky/kb/pricing/ipad.md`
- Recommended status: `needs-source-verification`
- Reason:
  - the local pricing export provides only partial coverage and KB naming does not align cleanly enough to treat the file as verified

#### `/home/ricky/kb/pricing/macbook.md`
- Recommended status: `partially-verified`
- Evidence sources:
  - `/home/ricky/builds/pricing-sync/data/monday-pricing.json`
- Risks:
  - many device/repair rows are locally corroborated, but VAT and surcharge policy lines still need business confirmation
  - duplicate model sections should be cleaned before treating the file as a polished reference

#### `/home/ricky/kb/pricing/watch.md`
- Recommended status: `needs-source-verification`
- Reason:
  - the local pricing export provides only partial coverage and KB naming does not align cleanly enough to treat the file as verified

#### `/home/ricky/kb/pricing/services.md`
- Recommended status: `needs-operator-confirmation`
- Reason:
  - surcharges, deposits, and turnaround add-ons are policy/pricing decisions

### Team

#### `/home/ricky/kb/team/roster.md`

- Recommended status: `needs-operator-confirmation`
- Evidence sources:
  - operator confirmation
  - current team records
  - any reliable Monday/team reporting source
- Risks:
  - performance numbers, role scope, reporting lines, and qualitative notes are highly time-sensitive
- Action:
  - verify line by line with operator approval before treating as canonical

#### `/home/ricky/kb/team/escalation-paths.md`

- Recommended status: `needs-operator-confirmation`
- Evidence sources:
  - operator confirmation
  - current operating model in KB
- Risks:
  - decision authority and escalation chains are governance truth, not file truth
  - agent-system escalation language must stay aligned with the new OpenClaw model
- Action:
  - confirm current authority rules directly before marking verified

## Open Risks

- live Supabase state is only partially verified and still carries Mission Control webhook residue
- some KB docs were created during rapid cleanup and may still contain shorthand assumptions
- `/home/ricky/builds` still contains overlapping domain knowledge that must be triaged before KB can be treated as complete
- pricing and team docs now clearly require operator confirmation before they can be treated as canonical

## Next Actions

1. decide how to handle live Supabase webhook residue
2. continue using the existing `/home/ricky/kb` git repo as the canonical doc history
3. start `/home/ricky/builds` documentation triage with `agent-rebuild`
4. collect operator confirmation for pricing and team docs
5. obtain fresh Monday exports/API pulls for the Monday board docs

# Ownership Orphans & Conflicts

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Orphans (none-tagged folders, fleet-meta)

### agent-rebuild
- state: active
- canonical_status: draft
- ownership_confidence: high
- size: 90M
- purpose: Active rebuild workspace for the OpenClaw cleanup and KB/documentation program.
- assessment: clearly fleet-meta
- proposed_owner (if not clearly fleet-meta): leave as none
- rationale: This is the Phase 6.9 working area itself and is explicitly a cross-fleet rebuild workspace rather than an agent-owned operating domain.

### data-architecture
- state: dormant
- canonical_status: snapshot-of-other
- ownership_confidence: high
- size: 40K
- purpose: Parked architecture brief for a multi-layer business data model and agent access pattern centered on Supabase.
- assessment: borderline (re-tag candidate)
- proposed_owner (if not clearly fleet-meta): operations
- rationale: Carry-forward from `folder-inventory.md`: suggested `operations` or `main` because this is fleet-wide Supabase schema design for the operational data plane, not a Back Market-specific asset.

### documentation
- state: dormant
- canonical_status: draft
- ownership_confidence: high
- size: 104K
- purpose: Small documentation-build staging area with a progress tracker and raw imported domain docs.
- assessment: borderline (re-tag candidate)
- proposed_owner (if not clearly fleet-meta): main
- rationale: Carry-forward from `folder-inventory.md`: suggested `main` because this looks like Jarvis-orchestrated docs staging that stalled rather than a stable shared infra library.

### mutagen-guide
- state: active
- canonical_status: canonical
- ownership_confidence: high
- size: 68K
- purpose: Standalone setup guide for mirroring a VPS to a local Mac with Mutagen over SSH.
- assessment: clearly fleet-meta
- proposed_owner (if not clearly fleet-meta): leave as none
- rationale: This is an infrastructure how-to with no single domain claim, so `none` remains appropriate.

### qa-system
- state: dormant
- canonical_status: snapshot-of-other
- ownership_confidence: high
- size: 48K
- purpose: Parked QA-system registry containing a reviewed plan for git-triggered QA agents and a shared build/QA logging workflow.
- assessment: borderline (re-tag candidate)
- proposed_owner (if not clearly fleet-meta): operations
- rationale: Carry-forward from `folder-inventory.md`: suggested `operations` after rebuild because it is currently a parked stub and `CLAUDE.md` points toward a Codex-first rebuild model.

### research
- state: dormant
- canonical_status: draft
- ownership_confidence: high
- size: 24K
- purpose: Meta research folder for OpenClaw memory architecture and VPS/runtime audits.
- assessment: clearly fleet-meta
- proposed_owner (if not clearly fleet-meta): leave as none
- rationale: The contents are exploratory decision support for the whole agent system, not one operating team.

### server-config
- state: active
- canonical_status: snapshot-of-other
- ownership_confidence: high
- size: 124K
- purpose: Snapshot of VPS runtime configuration and service inventory.
- assessment: clearly fleet-meta
- proposed_owner (if not clearly fleet-meta): leave as none
- rationale: This is shared environment state, not an agent workspace. It also contains plaintext secrets in PM2 dumps, so keeping it out of a domain manifest is safer.

### templates
- state: dormant
- canonical_status: canonical
- ownership_confidence: high
- size: 12K
- purpose: Template library for lightweight project scaffolding docs.
- assessment: clearly fleet-meta
- proposed_owner (if not clearly fleet-meta): leave as none
- rationale: Generic scaffolding templates are shared tooling and do not map cleanly to any one fleet agent.

## Conflicts (folders that plausibly belong to two or more agents)

### data-architecture
- current_owner: none
- competing_claims: operations (Supabase ETL and agent data-plane design are operational backbone work), main (fleet-wide architecture and agent-access model are Jarvis-level governance concerns)
- recommendation: Ricky to decide. Slight lean toward `operations` once the rebuild turns this from a parked brief into a live data-plane project.

### webhook-migration
- current_owner: operations
- competing_claims: alex-cs (Shopify to Intercom attribution cutover affects customer-service routing), arlo-website (the Shopify contact-form migration touches website ingress and conversion plumbing)
- recommendation: split this folder across multiple agents in Phase 7. Until then, keep `operations` because the Monday status-notification cutover is the only clearly shipped slice.

### royal-mail-automation
- current_owner: operations
- competing_claims: backmarket (`dispatch.js` handles Back Market orders), alex-cs (mail-in repair dispatch touches customer-facing intake and status expectations)
- recommendation: keep `operations` as owner because this is a shared fulfillment rail used across domains.

### customer-service
- current_owner: alex-cs
- competing_claims: backmarket (the folder includes BM-specific alert and reporting audits), ferrari (quotes, stale-open triage, and sign-off language show Ferrari-style handling embedded inside the corpus)
- recommendation: keep `alex-cs` for now, but note that Ferrari work is still embedded and BM-specific report slices may later merit extraction.

### data
- current_owner: backmarket
- competing_claims: parts (profitability and cost outputs can inform reorder logic), operations (the notes call out Monday fixed-cost assumptions that affect broader operating analysis)
- recommendation: keep `backmarket` unless a broader shared analytics workspace is created later.

### website-conversion
- current_owner: arlo-website
- competing_claims: marketing (the folder is pure conversion strategy and measurement planning, not implementation code)
- recommendation: Ricky to decide whether `website-conversion` stays with `arlo-website` or transfers to `marketing`.

## Low-confidence assignments worth Ricky review

- bm-scripts [low] -> tagged backmarket: only a single reconciliation JSON remains, so this looks more like a leftover BM artifact than a maintained workspace.
- claude-project-export [medium] -> tagged operations: exported cross-domain corpus now follows Ricky's override, but README and notes still point to other live homes and `/home/ricky/kb`.
- data [medium] -> tagged backmarket: filenames point to BM pricing and buy-box analysis, though parts and operations both consume the outputs.
- llm-summary-endpoint [medium] -> tagged operations: it summarizes Monday repair updates for intake flows, but deployment context is thin and the service has open-auth caveats.
- repair-analysis [medium] -> tagged operations: repair-profitability scripts are operationally useful, but this is a small scratch folder with hardcoded external paths.
- voice-notes [medium] -> tagged main: strategic transcripts are fleet-level, but intake-specific content overlaps operations and `alex-cs`.
- webhook-migration [low] -> tagged operations: the Monday cutover is ops-owned, but the Shopify and Intercom migration track introduces rival claims.
- whisper-api [low] -> tagged operations: it sits near intake audio tooling, but it is really a one-file helper reading auth from a main-agent profile.
- xero-invoice-automation [medium] -> tagged operations: invoicing flow belongs near ops and finance, but the live runtime is hosted elsewhere and current ownership evidence is partial.
- xero-invoice-notifications [medium] -> tagged operations: payment polling is operationally relevant, but Xero auth is broken and deployment state is only partially evidenced.

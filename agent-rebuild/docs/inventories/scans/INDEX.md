# scans/ — Index

**Updated:** 2026-05-02
**Source:** Phase 6.9a
**Purpose:** Raw scan outputs from the 9 parallel Codex BUILDER spawns that mapped `~/builds/` and key agent locations. Source-of-truth for the consolidated `folder-inventory.md` and `idea-inventory.md`.

Each YAML file contains structured findings per folder: purpose, state, suspected_owner_agent, key_files, actionable_ideas, dependencies, canonical_status, notes. The scan briefing the spawns followed lives at [`../../briefs/PHASE-6.9-SCAN-BRIEFING.md`](../../../briefs/PHASE-6.9-SCAN-BRIEFING.md).

## Batches

| File | Folders covered (approximate) |
|---|---|
| [`scan-A.yaml`](scan-A.yaml) | Batch A |
| [`scan-B.yaml`](scan-B.yaml) | Batch B |
| [`scan-C.yaml`](scan-C.yaml) | Batch C — included icloud-checker (where the icloud-API-key plaintext was first surfaced) |
| [`scan-D.yaml`](scan-D.yaml) | Batch D — included icorrect-parts-service (.env), xero-invoice-automation |
| [`scan-E.yaml`](scan-E.yaml) | Batch E — included marketing-intelligence (basic-auth credentials surfaced) |
| [`scan-F.yaml`](scan-F.yaml) | Batch F — included voice-note-pipeline + telephone-inbound (PII-in-logs surfaced), shift-bot |
| [`scan-G.yaml`](scan-G.yaml) | Batch G |
| [`scan-H.yaml`](scan-H.yaml) | Batch H — included server-config (pm2-dump\*.json surfaced) |
| [`scan-I.yaml`](scan-I.yaml) | Batch I — included team-audits (.env) |

Scans are read-only artefacts. Don't edit them; they're the audit trail. If a scan is wrong, log a finding in QA-6.9-report.md or RICKY-OVERRIDES-6.9.md (root).

# Build Registry

Source of truth for active iCorrect build planning and spec readiness.

## Builds

| # | Build | Status | Priority | Spec | Owner Agent | Blockers | Dependencies | Link |
|---|---|---|---|---|---|---|---|---|
| 1 | Intake System | ready-to-build | HIGHEST | Full | operations | Monday audit prerequisite | feeds Inventory + Intercom | `intake-system/SPEC.md` |
| 2 | Intercom Agent | ready-to-build | HIGH | Full | customer-service | routing and n8n hardening | depends on workflow replacement | `intercom-agent/SPEC.md` |
| 3 | Inventory System | ready-to-build | HIGH | Full | parts + operations | data quality cleanup sequence | depends on Monday parts clarity | `inventory-system/SPEC.md` |
| 4 | Website Conversion | ready-to-build | HIGH | Full | website | theme rollout QA discipline | independent | `website-conversion/SPEC.md` |
| 5 | QA System | in-progress | MEDIUM | Stub | operations | active parallel build | independent | `qa-system/README.md` |
| 6 | BM Pricing Module | blocked | MEDIUM | Stub | backmarket | algorithm not finalized | needs Ricky decision | `bm-pricing-module/README.md` |
| 7 | Marketing Intelligence | needs-rethink | MEDIUM | Stub | marketing | phase 1 quality gap | strategy reset required | `marketing-intelligence/README.md` |
| 8 | Data Architecture | idea | LOW | Stub | systems | upstream schemas not stable | depends on core builds | `data-architecture/README.md` |
| 9 | Voice Notes | idea | LOW | Stub | systems | scope/integration not finalized | depends on automation stack | `voice-notes/README.md` |

## Dependency Map

- Intake System depends on Monday audit prerequisite.
- Intake System feeds Inventory System (stock checks).
- Intake System feeds Intercom Agent (customer/ticket context).
- Inventory System depends on parts board structure clarity.
- Intercom Agent depends on replacement of brittle n8n flows.
- Website Conversion is independent.

## Maintenance Rules

- Updated only by Ricky or Claude Code.
- Update at end of every phase session.
- Update within 24 hours of any major status change.

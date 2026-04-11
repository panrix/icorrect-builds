# Intake System Documentation Triage

Date: 2026-03-31
Owner: Codex
Scope: `/home/ricky/builds/intake-system`
Purpose: classify the intake-system documentation set so build-local docs are separated from durable intake knowledge

## Classification Key

- `Keep local` = keep in `/home/ricky/builds/intake-system` as project/build documentation
- `Promote selected rules to KB` = extract durable rules and verified process logic into `/home/ricky/kb`
- `Archive after rebuild` = preserve as rebuild evidence, not as active long-term documentation

## Scope Note

Vendored package docs under `/home/ricky/builds/intake-system/react-form/node_modules/**` are excluded from this triage. They are third-party dependency docs, not project knowledge.

## Keep Local

| File | Reason | Action |
|------|--------|--------|
| `FORM-FLOW.md` | kiosk UX and implementation flow for the client-facing iPad form | keep local as build flow |
| `DESIGN-SPEC.md` | design spec for this build, not canonical operational truth | keep local |
| `integrations.md` | project integration target map tied to this product build | keep local |
| `flows/client-ipad-flow.md` | self-service front-end journey for this intake product | keep local |
| `react-form/INTAKE-SPEC.md` | implementation copy of the intake spec for the React app | keep local |
| `react-form/DESIGN-SPEC.md` | implementation copy of the design spec | keep local |
| `react-form/TASK.md` | build brief for the React app | keep local |
| `reference/SOURCE-MAP.md` | rebuild/source-tracing for this repo | keep local as project reference |

## Promote Selected Rules To KB

| File | Durable material to extract | Action |
|------|-----------------------------|--------|
| `SPEC.md` | hard gates, intake architecture principles, operator workflow rules | promote verified rules only; keep build architecture local |
| `flows/standard-repair-flow.md` | universal intake questions, credential rules, stock-check gates, pre-check requirements | promote verified rules into KB operations/intake docs |
| `flows/diagnostic-intake-flow.md` | diagnostic prerequisites, data-safety rules, credential gates, conversion rules | promote verified rules into KB operations/intake docs |
| `flows/bm-tradein-flow.md` | trade-in branching, grading capture requirements, mismatch handling, iCloud-check gating | promote verified rules into future KB BackMarket/intake docs |
| `device-flows/iphone-flows.md` | durable fault-routing logic and technician intake questions | promote verified decision rules only |
| `device-flows/ipad-flows.md` | durable intake decision rules | promote verified decision rules only |
| `device-flows/macbook-flows.md` | durable intake decision rules | promote verified decision rules only |
| `device-flows/apple-watch-flows.md` | durable intake decision rules | promote verified decision rules only |

## Archive After Rebuild

| File | Reason | Action |
|------|--------|--------|
| `reference/intake-audit-2026-02-18.md` | rebuild evidence/input material, not canonical process truth once rules are extracted | archive after verified conclusions are promoted |

## Practical Split

- Build-local docs:
  - kiosk flow
  - design spec
  - React build brief
  - source map
  - implementation copies
- Durable knowledge candidates:
  - intake hard gates
  - operator decision paths
  - diagnostic requirements
  - BM trade-in intake rules
  - device-specific intake logic
- Historical evidence:
  - intake audit and rebuild-source material

## QA Notes

- no files were moved during this triage
- this triage is intentionally conservative
- anything marked `Promote selected rules to KB` still requires explicit verification before promotion

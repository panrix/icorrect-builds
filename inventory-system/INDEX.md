# inventory-system

**State:** dormant (last activity: 2026-02-22)
**Owner:** parts
**Purpose:** Single-file product spec for a reservation-first inventory operating model covering stock commitment, refurbishment, low-stock alerts, and a stock-dashboard prototype.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

Dormant. Last meaningful change: 2026-02-22 (the SPEC itself). Reason for dormancy: spec was written but never approved or built; the live inventory work has shifted toward `icorrect-parts-service` (deduction/reservation) without this spec being formally adopted. Related working notes live in `~/.openclaw/agents/parts/workspace/docs/inventory-system/` (referenced by `~/kb/parts/`).

**Phase 7c review candidate:** assess whether to revive (commit to building the reservation/notification layer + dashboard), archive (kill spec, fold useful pieces into `icorrect-parts-service`), or merge (move SPEC into `icorrect-parts-service/briefs/`).

## Structure

- `briefs/` — `SPEC.md` lives here now.
- `decisions/` — empty.
- `docs/` — empty.
- `archive/` — empty.
- `scratch/` — empty.

## Key documents

- [`briefs/SPEC.md`](briefs/SPEC.md) — reservation-first inventory operating model spec (problem statement, KPIs, phases).

## Inbound references

- `~/.openclaw/agents/parts/workspace/MEMORY.md:36,39` — refers to dashboard prototype + summary at the agent-workspace path (not this builds folder).
- `~/kb/system/_phase-1.6-systems-fold-manifest.md:7` — points at `~/builds/inventory-system/SPEC.md` as canonical.
- `~/kb/parts/inventory-model.md`, `reorder-rules.md`, `suppliers.md`, `README.md` — reference the agent-workspace inventory-system docs (not this folder).

## Open questions

- Add low-stock, stale-reservation, and anomaly notifications (idea `baec8f2e`, P3).
- Build a dashboard for stock, reservations, and reorder signals (idea `eec17143`, P3).
- Build reservation, consumption, release, and receiving flows (idea `fc9081fd`, P3).
- Clean critical stock data and links before building automation (idea `4dad14d9`, P3).

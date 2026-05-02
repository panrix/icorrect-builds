# intercom-agent

**State:** dormant (last activity: 2026-02-22)
**Owner:** alex-cs
**Purpose:** Consolidated spec for a future Intercom backend agent service. Describes routing, escalation, audit logging, and data model for a dedicated Intercom agent.
**Last updated:** 2026-05-02

## Current state

Dormant since 2026-02-22 — over 10 weeks. The single SPEC.md predates the operational alex-triage-rebuild service which now performs much of the Intercom triage work in practice. The "agent service" framing in this spec is largely superseded by the script-first architecture documented in `~/builds/agent-rebuild/docs/system-rethink.md`.

**Phase 7c review candidate:** assess whether to revive (rewrite the spec to match current architecture and ship), archive (idea superseded by alex-triage-rebuild), or merge selected ideas into `intercom-config/` strategy work.

## Structure

- `briefs/` — single SPEC.md
- `decisions/` — empty
- `docs/` — empty
- `archive/` — empty
- `scratch/` — empty

## Key documents

- [`briefs/SPEC.md`](briefs/SPEC.md) — Intercom backend agent spec: routing, escalation, audit logging, data model

## Open questions

- Two ideas from this SPEC are still tracked in `~/builds/agent-rebuild/idea-inventory.md` (rows 183, 187) at P3. Should they be promoted into alex-triage-rebuild's brief queue, or formally archived?

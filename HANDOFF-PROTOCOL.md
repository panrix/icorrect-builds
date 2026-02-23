# Handoff Protocol — Ops vs Build

Who does what, and how work moves between agents and Code.

---

## Ownership Boundary

| Category | Owner | Examples |
|----------|-------|---------|
| **Ops (routine)** | Jarvis + domain agents | Config changes, cron fixes, model assignments, monitoring, doc updates, sub-agent registration, health checks, debugging existing systems |
| **Build (net-new)** | Code | New features, new systems, new pipelines, architectural changes, heavy refactors, new Supabase tables + webhooks + UI |
| **Maintenance** | Agents | Anything Code has built and handed off — bug fixes, config tuning, monitoring, QA reviews |

**Grey area rule:** If it takes more than a config change or script tweak to fix, it's probably a build. Flag it.

---

## Escalation Path (Agent → Code)

When an agent hits something beyond ops scope:

1. Agent flags the issue to Jarvis with context
2. Jarvis creates a work item (description, impact, urgency)
3. Ricky approves (or Jarvis if within operational authority)
4. Code picks it up as a build task
5. Code follows the build → handoff → maintain cycle below

---

## Code Handoff Criteria (Build → Agents)

A build is NOT done until:

- [ ] QA approved (qa-code / qa-data as appropriate)
- [ ] Tests passing
- [ ] Docs updated (README or SPEC in builds/)
- [ ] Crons registered (if applicable)
- [ ] Monitoring in place (health check covers it)
- [ ] INDEX.md status updated
- [ ] Jarvis notified with summary of what agents now maintain

After handoff, agents own it. Code only returns if architectural changes are needed.

---

## System Ownership Map

Updated as systems come online.

| System | Built By | Maintained By | Status |
|--------|----------|---------------|--------|
| OpenClaw Gateway config | Code | Agents (Jarvis/Systems) | Active |
| Agent Trigger (FastAPI) | Code | Agents (Systems) | Active |
| Supabase tables + triggers | Code | Agents (Systems) | Active |
| Memory bridge | Code | Agents (Systems) | Active |
| QA pipeline | Code | Agents (QA team) | Active |
| Mission Control dashboard | Code | Agents (Systems) | Active |
| Morning briefing cron | Code | Agents (Jarvis) | Active |
| Inter-agent comms | Code | Agents (Jarvis/Systems) | **In progress** |
| Intake System | Code | Agents (Operations) | Not started |
| Intercom Agent | Code | Agents (Customer Service) | Not started |
| Inventory System | Code | Agents (Parts/Ops) | Not started |
| Website Conversion | Code | Agents (Website) | Not started |

---

## Rules

1. Code does not do ops work. If it's a config fix, agents handle it.
2. Agents do not do builds. If it needs new architecture, Code handles it.
3. Jarvis is the coordinator. All work items flow through Jarvis.
4. Ricky approves strategic decisions. Jarvis approves operational ones.
5. This protocol is a living doc. Update it when ownership changes.

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

### Where to file

**Per-domain issue log:** `/home/ricky/builds/<domain>/qa/ISSUES.md`

- BackMarket issues → `/home/ricky/builds/backmarket/qa/ISSUES.md`
- Add per-domain file as other active domains surface issues (operations/qa/ISSUES.md, marketing/qa/ISSUES.md, etc.)

**Format:** the template at the top of each domain's ISSUES.md. Copy-paste it at the bottom, fill in the fields, save. No PR needed — agents can append directly.

**What NOT to put in ISSUES.md:**
- **Ops-level fixes that you actually performed** (service restart, credential rotation, config tweak reversible in under a minute) → log in `<domain>/docs/rollback-log.md` with the revert command
- **Diagnosis without action** (e.g. "I noticed X pattern across these 12 BM orders") → either open a research doc in `<domain>/docs/` if it's substantive, or memory if it's just a signal

**What agents MUST NOT do:**
- Patch build artifacts (scripts, services, crons) in their own workspace — the patch won't be in git, won't survive a session reset, and creates drift. File the issue, let Code make the change.

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
| OpenClaw Gateway config | Code | Agents (Jarvis/Operations) | Active |
| Agent Trigger (FastAPI) | Code | Agents (Operations) | Active |
| Supabase tables + triggers | Code | Agents (Operations) | Active |
| Memory bridge | Code | Agents (Operations) | Active |
| QA pipeline | Code | Agents (`main` coordinating build-layer review) | Active |
| Mission Control dashboard | Code | Agents (Operations) | Active |
| Morning briefing cron | Code | Agents (Jarvis) | Active |
| Inter-agent comms | Code | Agents (Jarvis/Operations) | **In progress** |
| Intake System | Code | Agents (Operations) | Not started |
| Intercom Agent | Code | Agents (`alex-cs`/Jarvis) | Not started |
| Inventory System | Code | Agents (Parts/Ops) | Not started |
| Website Conversion | Code | Agents (Marketing/Arlo Website) | Not started |

---

## Rules

1. Code does not do ops work. If it's a config fix, agents handle it.
2. Agents do not do builds. If it needs new architecture, Code handles it.
3. Jarvis is the coordinator. All work items flow through Jarvis.
4. Ricky approves strategic decisions. Jarvis approves operational ones.
5. This protocol is a living doc. Update it when ownership changes.

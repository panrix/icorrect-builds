# Telegram channels — canonical reference

**Captured:** 2026-04-30
**Source:** Ricky pasted topic URLs after creating supergroups in Telegram client
**Used by:** Phase 6.7 (Elek promotion) USER-APPENDIX, Phase 8 (per-topic systemPrompt overrides), agent SOULs/AGENTS where per-topic context is referenced
**Update rule:** any topic added/renamed/deleted in Telegram → update this file → update `~/.openclaw/openclaw.json` `channels.telegram.groups.<gid>.topics` → restart gateway

---

## Supergroup IDs (numeric, with `-100` prefix for openclaw.json)

| Agent | Display | Supergroup ID | Topic count |
|---|---|---|---|
| `main` | Chief of Staff (Jarvis) | `-1003934676988` | 11 |
| `operations` | Ops Jarvis | `-1003837821965` | 10 |
| `marketing` | Marketing Jarvis | `-1003931152563` | 12 |
| `team` | Team Jarvis | `-1003359676903` | 9 |
| `diagnostics` | Elek (post-Phase-6.7 promotion) | `-1003839044126` | 7 |

**Total: 5 supergroups, 49 topics.**

---

## Main / Chief of Staff — `-1003934676988` (11 topics)

| Topic | Thread ID | Phase that wires it |
|---|---|---|
| General | 1 | 8 |
| Daily Brief | 4 | 8 |
| Coffee Mornings | 7 | 8 (capture) + 6.5 (capture-hook) |
| Backlog | 8 | 8 + 6.5 (read view of `backlog.md`) |
| Re-surfacing | 9 | 8 + 6.5 (resurface-cron posts here) |
| Strategy | 10 | 8 |
| Cross-Domain Issues | 11 | 8 |
| Decisions Log | 12 | 8 |
| Build Pipeline | 13 | 8 |
| Hygiene | 14 | 8 + 7.5 (weekly hygiene scan reports) |
| Maintainer | 15 | 8 + 9.5 (health-check failures, circuit-breaker alerts) |

---

## Operations — `-1003837821965` (10 topics, existing supergroup)

| Topic | Thread ID | Domain folder |
|---|---|---|
| General | 1 | — |
| Issues | 4 | — |
| SOPs & KB | 19 | — |
| Intake | 35 | `~/builds/operations-system/docs/domains/enquiry-intake-triage-quote/` |
| Repair Queue | 108 | `~/builds/operations-system/docs/domains/accepted-diagnostic-repair-queue-workshop-handoff/` |
| Workshop | 109 | `~/builds/operations-system/docs/domains/workshop/` |
| QC | 110 | `~/builds/operations-system/docs/domains/qc/` |
| Logistics | 111 | `~/builds/operations-system/docs/domains/logistics/` |
| Parts | 112 | coordinates with parts sub-agent |
| Trade-ins | 113 | BM intake side |

---

## Marketing — `-1003931152563` (12 topics)

| Topic | Thread ID |
|---|---|
| General | 1 |
| Issues | 29 |
| Meta Ads | 8 |
| AdWords | 30 |
| SEO | 31 |
| Blogs | 32 |
| Social | 33 |
| Conversion / CRO | 34 |
| Email | 35 |
| Reviews | 36 |
| Analytics | 37 |
| Reports | 38 |

---

## Team — `-1003359676903` (9 topics)

| Topic | Thread ID |
|---|---|
| General | 1 |
| Issues | 13 |
| Hiring | 14 |
| Onboarding | 15 |
| Performance | 16 |
| Training | 17 |
| Schedule | 18 |
| Ferrari Watch | 19 |
| 1:1 Notes | 20 |

---

## Elek (Diagnostics) — `-1003839044126` (7 topics)

Promoted to C-suite in Phase 6.7. Owns the fault-domain (technical depth), distinct from Operations (workshop flow).

| Topic | Thread ID | Scope |
|---|---|---|
| General | 1 | Meta, scheduling |
| Issues | 293 | Devices stuck, fault-isolation blockers |
| Active Repairs | 294 | Current technical investigations, per device/job |
| Knowledge Base | 295 | Diagnostic flows by board family + model — canonical layer |
| Research | 296 | Fault patterns, test paths, schematic findings, fix-strategy explorations |
| Library | 297 | Schematic references, BoardView files, manufacturer docs |
| Build Pipeline | 298 | Schematic tooling, board-viewer dev, scripts (output of ACP spawns) |

(Naming note: Ricky used "Active Repairs" not "Active Cases" — the agent should mirror his naming.)

---

## openclaw.json patch surface for Phase 8

When Phase 8 fires, it patches `channels.telegram.groups.<gid>.topics` for each of the 5 supergroups. Each topic gets a `systemPrompt` that scopes the agent to the topic's domain. The IDs above feed directly into those patches. No more placeholders needed.

## Bot accounts (confirmed reuse, 2026-04-30)

All supergroups served by existing bots — no new bots minted. These are the canonical bindings:

| Agent | Bot username | OpenClaw account key (existing in `openclaw.json`) |
|---|---|---|
| `main` (Jarvis) | `@RickysJarvis_bot` | reuses existing main binding |
| `operations` | `@icorrect_opsbot` | `operations` |
| `marketing` | `@icorrect_marketingbot` | `marketing` |
| `team` | `@icorrect_teambot` | `team` |
| `diagnostics` (Elek) | `@icorrect_diagnosticbot` | `elek-diag` |

## Additional bindings (non-topic-organised groups)

### Main / Jarvis — "Build and Improvement" — `-1003754109329`

Existing working group with Ferrari. Plain group (NOT forum/topics mode). Jarvis bot (`@RickysJarvis_bot`) is bound here. Active collaboration context — Jarvis works with Ferrari on build/improvement tasks here (e.g. yesterday Jarvis discussed an in-flight task with Ferrari in this group).

**Phase 8 does NOT apply** — per-topic `systemPrompt` overrides only apply to forum-mode supergroups. This group inherits Jarvis's default agent-level system prompt.

**Implications:**
- Both bindings remain active for Main: `-1003934676988` (Chief-of-Staff exec dashboard, topic-organised) AND `-1003754109329` (Build and Improvement working group with Ferrari).
- Jarvis responds in both contexts using the same SOUL + USER + AGENTS bootstrap, but Phase 8 only scopes the topic-organised one.
- If you ever migrate Ferrari into the new supergroup as a "Ferrari Collab" topic, this binding becomes redundant. Until then, leave it.

## Voice / display name

Main agent ID stays `main` in `openclaw.json`. Display name is "Jarvis" (not "Chief of Staff" — keep simple). The Chief-of-Staff framing is conceptually right for what he does; user-facing display stays Jarvis.

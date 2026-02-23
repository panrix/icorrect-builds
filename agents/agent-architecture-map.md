# iCorrect Agent Architecture Map

**Date:** 20 Feb 2026
**Total agents:** 18 (16 active, 2 archived)

---

## Hierarchy (as designed)

```
                        RICKY
                          │
                       JARVIS (main)
                    C-suite coordinator
                          │
          ┌───────┬───────┼───────┬────────┬──────────┐
          │       │       │       │        │          │
     OPERATIONS  BACKMARKET  SYSTEMS  MARKETING  WEBSITE
     (8 subs)    (4 subs)    (0)     (4 subs)   (0)
          │       │                    │
          │       ├─ bm-listings       ├─ mkt-website
          │       ├─ bm-pricing        ├─ mkt-content
          │       ├─ bm-grading        ├─ mkt-seo
          │       └─ bm-ops            └─ mkt-adwords (dormant)
          │
          ├─ ops-team    ├─ ops-queue   ├─ fin-cashflow
          ├─ ops-parts   ├─ ops-sop     ├─ fin-kpis
          ├─ ops-intake  └─ ops-qc
          │
     ┌────┼────────┬──────────┐
     │    │        │          │
   PARTS TEAM  PROCESSES  CUSTOMER-SVC
   (0)   (0)    (0)        (2 subs)
                             ├─ cs-intercom
                             └─ cs-escalation
          │
        ┌─┴──┐
        │    │
      FINN  SLACK-JARVIS
       (0)    (0)

     ┌──────┐
     │ QA LAYER (independent) │
     ├─ qa-plan              │
     ├─ qa-code              │
     └─ qa-data              │
     └──────┘

     PM (project management — independent tracker)
```

---

## Activity Status (Feb 2026)

| Agent | Memory Files (Feb) | Status | Reports To |
|-------|--------------------|--------|------------|
| **main (Jarvis)** | 14 | 🟢 VERY ACTIVE | Ricky |
| **systems** | 8 | 🟢 ACTIVE | Jarvis |
| **backmarket** | 5 | 🟢 ACTIVE | Jarvis |
| **website** | 4 | 🟡 MODERATE | Jarvis |
| **team** | 4 | 🟡 MODERATE | Jarvis |
| **customer-service** | 2 | 🟡 LOW | Jarvis |
| **finn** | 2 | 🟡 LOW | Jarvis |
| **operations** | 2 | 🟡 LOW | Jarvis |
| **marketing** | 2 | 🟡 LOW | Jarvis |
| **parts** | 1 | 🔴 MINIMAL | Jarvis |
| **slack-jarvis** | 1 | 🔴 MINIMAL | Jarvis (main) |
| **pm** | 0 | ⚫ DORMANT | Jarvis |
| **processes** | 0 | ⚫ DORMANT | Jarvis |
| **qa-code** | 0 | ⚫ DORMANT | Independent |
| **qa-data** | 0 | ⚫ DORMANT | Independent |
| **qa-plan** | 0 | ⚫ DORMANT (but spamming) | Independent |

---

## Key Problems

### 1. Hierarchy exists on paper, not in practice
Most SOUL.md files say "I report to Jarvis" — but there's no mechanism for Jarvis to delegate to them or for them to delegate to sub-agents. The inter-agent messaging is broken (Issue #1 in Code brief).

### 2. Sub-agents are defined but don't exist
- Backmarket lists 4 sub-agents (bm-listings, bm-pricing, bm-grading, bm-ops) — **none exist as actual agents**
- Operations lists 8 sub-agents — **none exist**
- Marketing lists 4 sub-agents — **none exist**
- Customer-service lists 2 sub-agents — **none exist**
- These are referenced in SOUL.md but were never created. The agents have no way to spawn them.

### 3. Massive overlap
- **customer-service** vs **finn** — both own customer communication/Intercom
- **operations** vs **processes** — operations has ops-sop sub-agent, processes owns "operational processes"
- **operations** has fin-cashflow and fin-kpis sub-agents — but finance was archived separately
- **team** vs operations' ops-team sub-agent — both own team management
- **marketing** has mkt-website sub-agent — but **website** is a separate agent

### 4. Dormant agents still consuming resources
pm, processes, qa-code, qa-data have zero activity but may still be loaded on heartbeats or triggered by events. qa-plan is dormant but actively spamming due to stuck test items.

### 5. No delegation protocol
No agent has instructions for HOW to delegate — what tool to use, what format, what handoff looks like. They all just do everything themselves.

---

## Recommendations

### Consolidate (reduce from 16 to ~8 active agents)

**Keep as-is:**
- **Jarvis (main)** — coordinator
- **systems** — infrastructure
- **backmarket** — BM operations (but fix sub-agent delegation)

**Merge:**
- **operations + processes + team** → single Operations agent (it already has sub-agents for all three)
- **customer-service + finn** → single Customer agent
- **marketing + website** → single Growth agent

**Disable/archive:**
- **pm** — dormant, Jarvis already coordinates
- **qa-code, qa-data, qa-plan** — disable until the QA pipeline is fixed and actually needed
- **slack-jarvis** — consider merging into Jarvis main with Slack as a second channel
- **parts** — barely used, could be an operations sub-function

### Build delegation protocol
For Code to implement:
1. Define how agents call sub-agents (`sessions_spawn` with agent-specific context)
2. Define handoff format (structured JSON with task, context, expected output)
3. Build the sub-agents that are referenced in SOUL.md files (or remove the references)
4. Add delegation rules to each agent's SOUL.md

---

## Token Impact of Consolidation

Current: 16 agents × heartbeats + context loading = high baseline burn
Proposed: 8 agents = ~50% reduction in baseline token spend
Plus: fixing sub-agent delegation means domain agents do the heavy lifting on Sonnet, not Jarvis on Opus

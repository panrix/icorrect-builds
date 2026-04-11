# 01 — Lessons Learned: What Went Wrong

> Historical note: this file describes the pre-rebuild February 2026 system state. It is retained as rebuild background, not current operating truth. Use `/home/ricky/kb/system/workspace-contract.md` and `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md` for the current model.

**Date:** 2026-02-24
**Updated:** 2026-02-26 — Added Mistake 9 (agents are bad at API discovery).
**Purpose:** Honest post-mortem before rebuilding. Every mistake here informs a design constraint for v3.

---

## Timeline Context

- **Early Feb:** Single-agent Jarvis handling everything
- **Feb 12-17:** Rapid expansion to 11 agents + sub-agent definitions
- **Feb 17-18:** Mission Control v2 build (Supabase, webhooks, QA pipeline)
- **Feb 18-24:** Agents running but accumulating problems
- **Feb 24:** This audit. Deciding to rebuild properly.

Total time from 1 agent to 11: ~6 days. That pace caused most of these issues.

---

## Mistake 1: No Agent Spec Before Building Agents

**What happened:** Agents were created one at a time with ad-hoc workspace structures. Each agent's CLAUDE.md, SOUL.md, and file layout evolved independently. Some got symlinks to mission-control-v2 definitions. Others kept local copies. Some have 50+ files at root. Others are cleaner.

**The lesson:** Before creating any agent, there needs to be a spec that defines: what files an agent has, where work output goes, what the agent is allowed to create, and what gets cleaned up automatically.

**Design constraint for v3:** Every agent is an instance of a template. The template defines the workspace structure. Agents cannot deviate.

---

## Mistake 2: Memory System Built Three Times, None Work Reliably

**What happened:**
1. File-based memory (MEMORY.md + daily files) — agents write whatever they want, files pile up
2. save-fact.py CLI — agents ignore it, they prefer edit/write tools
3. Supabase sync bridge — parses agent markdown into Supabase, generates unreadable keys

Three overlapping systems, none enforced, none reliable.

**The lesson:** Pick ONE memory approach and make it unavoidable. If agents naturally write markdown, build around that. Do not fight the model.

**Design constraint for v3:** Memory system must work without agent compliance. Auto-capture, auto-inject, zero agent judgment required.

---

## Mistake 3: Fragmented Sources of Truth

**What happened (from Codex audit):**
- Architecture described differently in CLAUDE.md, builds/agents/research.md, and mission-control-v2/docs
- Runtime config (openclaw.json) says 14 agents. Agent definitions dir has 29. Runtime dirs have 18.
- Some agents are "retired" but dirs still exist. Some are "sub-agents" but not registered.

**The lesson:** There must be ONE file that says "these are the agents that exist right now" and everything else derives from it.

**Design constraint for v3:** Single source of truth (openclaw.json or a registry table). Everything else is generated or validated against it.

---

## Mistake 4: Sub-Agent Sprawl Before Proving Domain Leads

**What happened:** 18 sub-agent definitions were created (ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc, fin-cashflow, fin-kpis, mkt-seo, etc.) before the 8 domain leads were even working properly.

**The lesson:** Sub-agents are an optimisation. You do not optimise something that does not work yet. Get the domain leads operating reliably first, then identify where sub-agents are genuinely needed based on workload data.

**Design constraint for v3:** Zero sub-agents at launch. Add them only when a domain lead consistently hits context limits or task volume that proves the need.

---

## Mistake 5: No Workspace Discipline

**What happened (Jarvis audit):**
- 20 Whisper transcript files dumped in workspace root
- Shopify theme repo (9.3MB, website agent's domain) in Jarvis workspace
- 3.4MB of Otter transcripts nobody references
- Legacy files never cleaned up (CLAUDE-legacy.md, MEMORY-legacy.md, SOUL-legacy.md)
- Stale TODO.md, WORKING.md, battle-plan.md from weeks ago
- Broken symlink to old mission-control v1

**The lesson:** Agents will dump files anywhere unless prevented. There is no "tidy up" behavior in the model. If you allow file creation, you get file sprawl.

**Design constraint for v3:** Workspaces are minimal and controlled. Agents write to designated output locations only. Periodic cleanup (cron or hook) removes anything outside the allowed structure.

---

## Mistake 6: CLAUDE.md Instructions the Model Ignores

**What happened:** CLAUDE.md Section 0 tells Jarvis to use save-fact.py via bash for every business fact. The model consistently ignores this and writes markdown files instead. This was identified weeks ago but the instruction was never removed.

**The lesson:** If you discover the model ignores an instruction, remove it immediately. Dead instructions waste context tokens and reduce the model's attention on instructions it WILL follow.

**Design constraint for v3:** Every instruction in CLAUDE.md must be tested. If the model does not follow it after 3 sessions, rewrite it or remove it.

---

## Mistake 7: Building Infrastructure Before Proving Agent Value

**What happened:** Built Mission Control v2 (12 phases), QA pipeline, webhook system, cron jobs, Supabase tables, health monitoring — before any single agent was reliably doing useful work.

**The lesson:** Infrastructure should be pulled in by need, not pushed in by ambition. The question is not "what can we build" but "what does the simplest useful agent need to work?"

**Design constraint for v3:** Start with ONE agent doing ONE thing well. Add infrastructure only when that agent hits a real limitation.

---

## Mistake 8: No Feedback Loop on Agent Performance

**What happened:** Agents run, produce output, but there is no systematic way to know if the output is good. The QA pipeline was built but depends on QA agents that are themselves unproven. No metrics on: did the agent follow its SOPs? Did it hallucinate? Did its work actually help?

**The lesson:** Before scaling to more agents, you need to be able to answer "is this agent doing a good job?" for the agents you have.

**Design constraint for v3:** Every agent has measurable success criteria. Review happens before scaling.

---

## Mistake 9: Agents Are Bad at API Discovery

**What happened:** Agents were told to search APIs (BackMarket, Xero, Intercom) for information. They consistently guess at endpoints, hallucinate response formats, misinterpret data, and confidently present wrong conclusions.

**The lesson:** Agents are good at USING APIs that have been documented for them. They are bad at DISCOVERING APIs on their own. Technical work (testing endpoints, recording responses, documenting capabilities) should be done by Code (Claude Code via SSH), which has direct system access and does not hallucinate response formats.

**Design constraint for v3:** Code does all API documentation. Agents receive pre-built reference material. Research agents never search APIs — they help Ricky document processes.

---

## Summary: The Meta-Mistake

Moved too fast from "one agent doing everything" to "11 agents with infrastructure" without an intermediate step of "one agent doing one thing really well."

The rebuild reverses this: define what a good agent looks like -> prove it with one -> template it -> scale.

---

## Open Questions for Ricky

1. Which of these resonate? Which am I wrong about?
2. What mistakes am I missing?
3. When you say "rebuild" — do you mean tear down and start fresh, or evolve what exists?
4. Is there a single agent/domain where getting it right would have the most business impact? (That is where we start.)

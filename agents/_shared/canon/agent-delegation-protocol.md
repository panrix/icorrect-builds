# Agent Delegation Protocol

How agents hand work to each other, to workers, and to Codex. Applied by `/delegate`, `/hand-off-to-codex`, `/spawn-worker`, and `/test-loop`.

## When to delegate

| Task shape | Route to |
|------------|----------|
| Write/edit/refactor code, run unit tests | **Codex** (Agent tool, automated) via `/delegate` auto-detection or `/hand-off-to-codex` |
| Browser flows, UI verification, product dogfooding | **Codex Desktop** (manual handoff) via `/test-loop` |
| Long-form writing, drafting, summarisation | **Writer worker** (Claude tmux window) via `/spawn-worker writer` + `/delegate` |
| Research, fact-gathering, cross-referencing | **Researcher worker** via `/spawn-worker researcher` |
| Critique, code review of MD, independent second opinion | **Reviewer worker** via `/spawn-worker reviewer` |
| Operational lookups (Monday, queue status) | **Top-level agent** (Operations) — not a worker; send message via inter-agent delegation |
| Ambiguous / reasoning-heavy / strategic | **Keep in-session** — Lucian thinks, doesn't delegate |

## Delegation brief — mandatory fields

Every delegation records the following to `_shared/records/delegations/<delegation-id>.md`:

```yaml
---
delegation_id: "ulid"
from: "chief-of-staff"
to: "codex" | "writer" | "researcher" | "reviewer" | "tester" | "operations" | ...
kind: "code" | "draft" | "research" | "review" | "test" | "ops"
task_started_ts: "ISO-8601"
context_refs: ["path/to/relevant.md", "project slug", ...]
success_criteria: |
  Concrete, testable definition of done.
constraints: |
  What NOT to do, budget, time limit.
return_format: "prose | jsonl | patch | ..."
outcome: "pass | fail | blocked | in-progress | cancelled | superseded"   # filled on close
linked_record: "optional path to a fuller write-up"
---
# Brief body (full context the recipient needs)
```

## Hard rules

1. **Never delegate a prompt you wouldn't be happy receiving yourself.** Workers do not see the orchestrator's conversation. Pass enough context in the brief.
2. **One task per delegation.** If the brief contains "and also" → split.
3. **Concrete success criteria.** Not "make it better" — "X returns a JSON object with fields a/b/c, validates against `schemas/v1/payload.schema.json`."
4. **Log both start and end.** Delegation records are skeletons until `outcome` is filled.
5. **QA the output.** `/qa-worker-output` before marking a delegation `pass`.

## Inter-agent delegation (agent ↔ agent)

Two top-level agents (e.g. Lucian ↔ Operations) exchange work via:
1. Lucian writes a delegation record to `_shared/records/delegations/`
2. Lucian's bridge sends a Telegram message to the target agent's bot (cross-bot messaging via API, not forwarded user input)
3. Target agent's bridge receives, parses, routes to the matching skill
4. Target agent completes, writes outcome to the same delegation record, messages Lucian's bot with the result

Not a Phase 1-5 concern — relevant from Phase 8 (when Operations exists).

## Relationship to Monday board

Delegations with `outcome: pass|fail|blocked|in-progress` get a `kind=delegation` row on the Monday agents board (via `monday-queue.jsonl`). Phase 7 sync surfaces it on Ricky's phone.

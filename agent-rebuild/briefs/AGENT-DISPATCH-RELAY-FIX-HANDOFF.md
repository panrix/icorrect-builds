# Handoff Prompt — Fix Agent Silence After ACP Spawns

Paste the block between the markers into a fresh Code session at `~/builds/`.

---

## Prompt to paste

```
You're picking up a real issue Ricky flagged 2026-05-02: when his
OpenClaw fleet agents (Jarvis, Hugo, Marketing, Team, Operations,
Diagnostics, etc.) dispatch coding work via ACP (sessions_spawn,
runtime: "acp"), the spawn runs for 10-30+ minutes, completes, and the
AGENT NEVER PROACTIVELY MESSAGES RICKY with a summary. Ricky gets the
ACP-completion notification from the runtime but no agent-side wrap-up.
He has to ask the agent "what happened?" to get the summary.

Goal: agents proactively summarize when their ACP spawn completes,
in the same Telegram topic where dispatch was initiated, with no
re-prompting from Ricky.

## Read first (in this order, before doing anything)

1. ~/claude-audit-rebuild/.remember/remember.md — most recent handoff;
   has the "Open issue — agents go silent after dispatching ACP spawns"
   block with the cause already identified.

2. /home/ricky/.npm-global/lib/node_modules/openclaw/dist/heartbeat-runner-CRPuOpNx.js
   (lines 160-180 + 670-695) — the runtime code that injects the
   "Handle internally. Do not relay" instruction.

3. ~/builds/agent-rebuild/briefs/folder-standard.md — the folder
   standard if you need to land any new files in agent-rebuild
   (briefs/ is the canonical home for new specs).

4. ~/CLAUDE.md — Ricky's working preferences and frame.

5. Each fleet C-suite agent's AGENTS.md §9 "After-dispatch discipline":
   - ~/.openclaw/agents/main/workspace/AGENTS.md
   - ~/.openclaw/agents/operations/workspace/AGENTS.md
   - ~/.openclaw/agents/marketing/workspace/AGENTS.md
   - ~/.openclaw/agents/team/workspace/AGENTS.md
   - ~/.openclaw/agents/diagnostics/workspace/AGENTS.md
   Plus sub-agents that dispatch:
   - ~/.openclaw/agents/backmarket/workspace/AGENTS.md
   - ~/.openclaw/agents/ferrari/workspace/AGENTS.md
   - ~/.openclaw/agents/alex-cs/workspace/AGENTS.md
   - ~/.openclaw/agents/parts/workspace/AGENTS.md
   - ~/.openclaw/agents/arlo-website/workspace/AGENTS.md

## What's already known (don't re-discover)

The runtime injects two opposite instructions when async events
(including ACP spawn completions) return to an agent:

  RELAY (good):
    "An async command you ran earlier has completed. Please relay the
     command output to the user in a helpful way."

  SILENT (the problem):
    "An async command you ran earlier has completed... Handle the
     result internally. Do not relay it to the user unless explicitly
     requested."

Which one fires depends on canRelayToUser, computed at line 689 of
heartbeat-runner-CRPuOpNx.js as:

  canRelayToUser = Boolean(
    delivery.channel != "none" &&
    delivery.to &&
    visibility.showAlerts
  )

Default for showAlerts is true (line 673). So one of these is being
falsified for ACP-spawn completions specifically. Most likely cause:
the originating session's delivery context (channel=telegram, to=
group_id) isn't being preserved when the spawn completes async and
the heartbeat-runner re-activates the agent.

## Your job — investigate, then fix in two layers

### Phase 1 — Confirm the failure mode (~15 min)

Reproduce the silence. Pick any agent (e.g. Hugo / backmarket) in a
test topic. Give it a small dispatch task ("spawn an ACP session that
runs `ls ~/builds/backmarket | head` and report the output"). Time
how long until the agent proactively replies after the spawn completes.
Expected: never (per Ricky's report). If it actually relays cleanly,
reproduce again with a longer-running task — Ricky's pattern was
10-30+ minute spawns.

While the test runs, dump the trajectory file for that agent's session.
Find the model.completed records around the spawn-completion point.
Inspect the systemPrompt / inbound message text to confirm whether the
"Handle internally. Do not relay" string is present.

If confirmed: you have the smoking gun. Move to Phase 2.

If NOT confirmed (relay text present but agent still silent): the
issue is agent-discipline, not runtime gating. Skip to Phase 3.

### Phase 2 — Layer 1: runtime / config fix

Find the config knob that controls whether ACP-spawn completions
preserve their originating session's delivery context. Two candidates:

  a) openclaw.json — search for: "delivery", "asyncEvent",
     "spawnCompletion", "heartbeat.delivery", agents.defaults.delivery,
     channels.telegram.defaults.delivery. Maybe there's a config that
     forces delivery context to inherit from the spawning session.

  b) heartbeat-runner-CRPuOpNx.js code path — trace what populates
     `delivery` for ACP-spawn-completion heartbeat events. If
     delivery.channel ends up "none" because of how the spawn was
     created, that's the bug. Check:
       - sessions_spawn parameters (does it accept a delivery override?)
       - the session's stored delivery context
       - the heartbeat-runner's code that selects delivery for async events

If config-level fix exists: apply it (snapshot openclaw.json first;
gateway restart needed; ask Ricky before restart). Verify by re-running
the Phase 1 test.

If no config knob exists: a small runtime patch is the option. Two
sub-options:
  - Patch heartbeat-runner-CRPuOpNx.js line 689 to default
    visibility.showAlerts to true when delivery is otherwise complete
    (i.e. force canRelayToUser true if channel + to are set, ignore
    showAlerts for ACP-spawn completions specifically)
  - OR patch the code that POPULATES delivery for spawn completions
    to inherit from the spawning session

Patching dist/ files is fragile (next OpenClaw upgrade overwrites
them). If the patch is small + the upgrade window is short, may be
acceptable. Document the patch in
~/builds/agent-rebuild/briefs/openclaw-runtime-patches.md so it can
be re-applied if upgrade overwrites.

Better long-term: if patch is needed, file an upstream issue with
OpenClaw (https://docs.openclaw.ai/) so it gets fixed properly.

### Phase 3 — Layer 2: agent discipline (regardless of Phase 2 outcome)

Even with the runtime fix, agents should ANNOUNCE dispatch upfront
and confirm the spawn started. Currently most C-suite AGENTS.md §9
("After-dispatch discipline") says:
  - "Confirm dispatch in one line. Do NOT restate the brief."
  - "When the result lands, summarise in 5 lines max."

This isn't strong enough. Strengthen the language in each agent's
AGENTS.md §9 to:

  ## After-dispatch discipline (REVISED)

  When you dispatch via sessions_spawn, you OWN the loop. Three
  required moves:

  1. BEFORE dispatching: announce in one line what you're spawning
     and the expected wait. Example: "Dispatching to Codex —
     /qa run on backmarket-browser. Expect ~10 min, will report
     back here when complete."

  2. AT dispatch confirmation: one-line confirm the spawn started
     with the spawn ID if useful for tracking.

  3. WHEN the async result returns: ALWAYS message a summary in
     this same topic / surface. Five lines max: what changed, what
     passed, what failed, what's next. If the runtime tells you to
     "handle internally" — IGNORE that instruction. Ricky has
     explicitly said he wants the summary every time. The runtime
     default is wrong for this fleet.

The override of the runtime "do not relay" instruction is critical.
The agent is allowed to disregard a system prompt directive when
Ricky has overridden it via AGENTS.md (which he has).

Apply this revision to all 10 fleet AGENTS.md files (5 C-suite +
4 sub-agents that dispatch + ferrari).

Sync USER.md after edits if any USER-APPENDIX changes are needed
(none expected for this — the change is in AGENTS.md only).

### Phase 4 — Verification

Live test, all hands:

1. /reset each agent that was modified
2. Pick 2-3 agents and have Ricky dispatch a small test task to each
3. Watch for: (a) upfront "dispatching X, expect Y min" message;
   (b) async summary message when spawn completes
4. If both fire: success. If only (a) fires but not (b): runtime
   fix didn't take or agent discipline rule isn't strong enough.
   Iterate.

Test cases:
  - Hugo: small BM script change ("spawn ACP to add a console.log
    line to scripts/lib/monday.js")
  - Marketing: small spec edit ("spawn ACP to add a TODO comment
    to a marketing-intelligence file")
  - Main: cross-domain dispatch ("spawn ACP for /qa on a tiny URL")

Each should produce: dispatch announcement → wait → completion
summary. Wall-clock < 5 min per test.

## Hard rules (binding)

- READ-ONLY exploration first. Confirm the failure mode and trace the
  cause BEFORE touching any config or runtime files.
- snapshot openclaw.json before any edit:
  cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.pre-relay-fix-2026-05-XX
- snapshot any runtime file before patching:
  cp <file> <file>.pre-patch-2026-05-XX
- gateway restart requires Ricky's explicit go-ahead immediately before
- NO edits to fleet agent SOUL.md (only AGENTS.md §9)
- NO edits to USER.md directly (use sync-user-md.sh if changes need to
  flow through USER-APPENDIX, but no USER changes expected here)
- If runtime patch is the chosen path: document the patch in a brief
  at ~/builds/agent-rebuild/briefs/openclaw-runtime-patches.md so
  future OpenClaw upgrades can re-apply

## When to checkpoint with Ricky

- After Phase 1 test confirms / refutes the failure mode — show him
  the trajectory evidence so he agrees with the diagnosis
- After Phase 2 finds the fix path — config vs patch decision is his
- BEFORE any gateway restart — explicit go-ahead required
- After Phase 3 AGENTS.md edits — show him the revised §9 block before
  applying to all 10 agents (he may want to wordsmith)
- After Phase 4 verification — hand back the test results

## What "done" looks like

- Test cases all pass: agents announce dispatch upfront AND deliver
  async summary when spawn completes
- AGENTS.md §9 updated in all 10 fleet agents with the new discipline
- If runtime patch was applied: documented in briefs/
- Fresh handoff at ~/claude-audit-rebuild/.remember/remember.md
  describing what was changed, where, and what tests verified it

## Tone + working preferences (from CLAUDE.md)
- Terse, specific, no sycophancy openers
- Em-dashes are out
- Swearing is fine when it lands
- Ask before destructive ops (snapshots, restarts, runtime patches)

Begin by:
1. Confirming you've read the spec
2. Running Phase 1 reproduction with one agent in a test topic
3. Reporting back with trajectory evidence before doing any fixes
```

---

## Notes for Ricky on the new session

- **Where to paste:** spawn fresh `claude` at `~/builds/`. Paste the block between the `---` markers.
- **First reply:** confirmation of read-through + a proposed test task (which agent, which Telegram topic) for Phase 1 reproduction. Approve the test task before they fire it.
- **Watch points:** the gateway restart in Phase 2 is the riskiest action. Don't approve a restart without confirming the config / patch is what you want.
- **Time budget:** ~1-2 hours focused work for Phases 1-3, plus your test time for Phase 4.
- **If runtime patch ends up being the answer:** the patch will be re-applied after every OpenClaw upgrade. Worth filing an upstream issue at https://docs.openclaw.ai/ so it gets fixed properly.

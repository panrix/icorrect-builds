# OpenClaw Runtime Patches

Manual patches applied to `~/.npm-global/lib/node_modules/openclaw/dist/`. **These get overwritten by `npm install -g openclaw@<new>`** — re-apply after every upgrade.

OpenClaw version at patch time: **2026.4.23 (a979721)**.

---

## 2026-05-03 — Patch 01: subagent-announce force-announce on non-ok outcomes

**File:** `dist/subagent-announce-CEb55xYU.js`
**Snapshot:** `dist/subagent-announce-CEb55xYU.js.pre-patch-2026-05-03`
**Function:** `runSubagentAnnounceFlow`
**Marker in code:** `PANRIX-PATCH 2026-05-03`

### Problem

When an ACP child subagent finished with a non-ok outcome (`error` / `timeout` / `unknown`) AND its captured reply was empty / `NO_REPLY` / silent-token-only, the runtime took one of four `return true` early-exit branches and **never injected a completion event into the parent session**. Combined with `SUBAGENT_SPAWN_ACCEPTED_NOTE` (in `subagent-spawn-DrLN9wlV.js:160`) — which forbids the parent from polling — the parent agent sat waiting forever for an event that would never arrive.

Symptom: Ricky asked Ops a long task in trade-in topic. Ops dispatched ACP, child crashed/timed out/returned silent. Ops never got woken to deliver a summary. Silence until Ricky chased.

### Fix

In the silent-return cases inside `if (!childCompletionFindings) { ... }` (around lines 218-231 of the unpatched file), replaced four `return true` branches with a conditional:

- If `outcome.status === "ok"` → preserve original silent-return (avoids double-delivery for streamed children that intentionally NO_REPLY)
- Otherwise → set `reply = "(subagent {timed out|failed|completed with no usable output}; no reply text was captured)"` and fall through to the normal announce-delivery code path

The forced fallback string carries the outcome status so the parent agent sees what happened.

### Test verification

Before patch (May 2 evidence): Ops sat silent for 10+ minutes while Ricky chased re-dispatched SOP6 worker.

After patch: pending live verification — needs an ACP spawn that hits a non-ok outcome to confirm.

### Re-apply after upgrade

1. Diff `dist/subagent-announce-CEb55xYU.js.pre-patch-2026-05-03` against the new release's `dist/subagent-announce-CEb55xYU.js`.
2. Locate the same `if (!childCompletionFindings) { ... }` block; identify the four `return true` silent-exit branches.
3. Re-apply the same conditional pattern (`outcome.status !== "ok"` ? force-announce : preserve original).
4. `node -e "import('...subagent-announce-...js')"` to sanity-check load.
5. `systemctl --user restart openclaw-gateway` and re-run an ACP spawn that hits non-ok outcome.

### Upstream

Worth filing with OpenClaw — silent-suppression of failed children with `expectsCompletionMessage: true` (and/or non-subagent requesters) violates the documented "completion event arrives as user message" contract.

---

## 2026-05-03 — Config 01 (not a patch): `agents.defaults.heartbeat.target = "last"`

**File:** `~/.openclaw/openclaw.json`
**Snapshot:** `~/.openclaw/openclaw.json.pre-relay-fix-2026-05-03`

Not a runtime patch — this is normal config — but listed here for the same reason: it's a deliberate change that interacts with the heartbeat-runner outbound delivery path.

### Problem

`agents.defaults.heartbeat` had no `target` field. `resolveHeartbeatDeliveryTarget` (`targets-CtcGJQ8p.js:30-43`) defaults to `target = "none"` when the field is unset, which collapses `delivery.channel` to `"none"`. That cascades into:

- `canRelayToUser = false` (heartbeat-runner-CRPuOpNx.js:689) → silent-prompt variant of `buildExecEventPrompt` fires, telling the agent "Handle the result internally. Do not relay it to the user unless explicitly requested."
- The heartbeat outbound path (heartbeat-runner-CRPuOpNx.js:940) early-returns with `reason: "no-target"` even when the agent generates a reply.

This affects backgrounded `process` tool exec completions in main (Codex) — separate code path from the fleet ACP-spawn path that needed the runtime patch above.

### Fix

```json
"heartbeat": {
  "every": "1h",
  "target": "last"
}
```

`"last"` tells the resolver to use the most recent turn's delivery context (which is preserved correctly through `turnSourceDeliveryContext` per `system-events-D-4on4Hz.js:107`).

### Test verification

Live test 2026-05-03: Marketing fleet ACP spawn (22s) delivered both child raw output and parent's converted reply to Telegram topic. Confirmed.

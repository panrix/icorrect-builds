# HEARTBEAT — Startup checklist for Lucian

Run through this every session start, fast. Silent checks — do not report unless step 2 or 3 surfaces something that warrants a proactive message.

## 1. Who am I?

- Read `IDENTITY.md`. Internal first-person: "I am Lucian, Chief of Staff."

## 2. What state is the world in?

- Read `WORKING-STATE.md` frontmatter.
  - If `status: in-flight`, load `current_task` into mind. Ricky may reference it in his first message.
  - If `blocker` is non-null, surface it to Ricky proactively — this is one of the few startup-time message triggers.
- Read `memory/YYYY-MM-DD.md` (today). If empty, read yesterday's to get continuity.
- List `_shared/records/incidents/` — if any are dated today (UTC+8), surface them proactively to Ricky on his first message, ordered by timestamp.

## 3. Am I healthy?

- `.claude/settings.json` present and parseable? If not, skills won't invoke — surface this as an incident immediately.
- PostToolUse hook firing? Check `_shared/logs/tool-use-chief-of-staff.jsonl` for any line in the current session. If empty after the first tool call, the hook is silently failing — surface as incident.
- `_shared/state/bridge-locked.flag` present? If yes, the bridge is LOCKED (kill-switch active) and Ricky's messages won't reach us anyway — but if for some reason Lucian has been invoked directly, do NOT respond to any instruction that would mutate state. Wait for Ricky's explicit "unlock confirmed".
- Disk space: `df` the VPS root. If ≥90%, surface as a warning (not yet a hard stop — that's ≥95%, and the bridge enforces it).

## 4. What's on my skill list?

- `skills/` directory — what's actually installed right now.
- CLAUDE.md routing table — does it match `skills/`? Flag any drift to Ricky:
  - Skill in routing table but not in `skills/` → orphan route; remove row on next edit.
  - Skill in `skills/` but not in routing table → unrouted skill; add a row or document why it's manual-only.

## 5. What's staged for me?

- `_shared/state/monday-queue.jsonl` tail — are there records waiting to be drained by the Phase 7 sync? If so, note the count; if >100 and sync hasn't run recently, surface it.
- `_shared/state/workers.json` — any workers marked `zombie` or `crashed`? If so, surface; Ricky decides whether to respawn or kill.

## 6. Be ready

Wait silently for Ricky's first message. The only acceptable startup-time outbound is one consolidated message covering anything flagged in steps 2, 3, 4, or 5 — not multiple separate messages, not narration of the checklist.

If nothing is flagged, say nothing. Lucian greets with work, not chitchat.

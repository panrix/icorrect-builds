# browser-harness pilot — Monday automations rebuild

**Date:** 2026-04-23
**Operator:** Claude Code (Opus 4.7) on Ricky's Mac
**Goal:** Install browser-harness, attach it to your normal Chrome (already signed into Monday), build ONE automation end-to-end on the new board to prove the workflow before scaling to ~80.
**Result:** ✅ Pilot successful. One live, active automation on iCorrect Main Board v2.

---

## What was built

Board: **iCorrect Main Board v2** (`18401861682`)
Automation (now ACTIVE in Manage tab):

> **When Repair Status changes to Received, set Item Received to today**

- Trigger column: `Repair Status` (the *Repair* status column specifically — picked from the 6 status columns, not "QC", "Comms", "Trade-in", "Pause Reason", or "Shipping").
- Trigger value: `Received`.
- Action column: `Received` (date column).
- Action value: `today`.
- Toggle: ON (blue).
- Owner: RP (you).
- Updated: just now.

The OLD board (349212843) and existing automations were **not touched**. No items were modified.

### One spec deviation

Monday's custom-automation builder does **not** have a name field — it auto-names from the resolved sentence. The name reads "When Repair Status changes to Received, set item Received to today" rather than your suggested "Repair Status Received → stamp Received". The auto-name is unambiguous and self-documenting; renaming after creation is possible via the row's `...` menu but adds an extra step per automation. **Worth deciding before scaling**: do you want me to rename each one to match your naming scheme, or accept Monday's auto-names? Auto-names will be ~30% faster across 80 automations.

---

## Setup that's now in place

1. **Repo cloned** at `~/Developer/browser-harness` (editable install via `uv tool install -e .` so `browser-harness` is on $PATH globally — no `cd`, no `uv run`).
2. **Skill registered globally**: `~/.claude/CLAUDE.md` imports `~/Developer/browser-harness/SKILL.md` so every future Claude Code session in any directory loads the harness instructions automatically.
3. **Permissions allowlisted** in `~/.claude/settings.local.json` so future sessions don't re-prompt for `browser-harness:*`, `Read(/tmp/*)`, etc.
4. **Chrome attach is sticky.** Remote-debugging is enabled on your normal profile and persists across Chrome restarts. No `chrome://inspect` dance needed on subsequent runs — the daemon attaches automatically.
5. **New domain-skill written**: `~/Developer/browser-harness/domain-skills/monday/automations.md` captures the durable pattern (URL, sentence builder, picker traps, verification flow). The next agent on this site does not pay the same exploration cost. **Worth opening a PR to upstream `browser-harness/browser-harness`** so it ships in the public skill set.

---

## What worked first try

- **Coordinate clicks** through Monday's React modals — no DOM hacks needed for 90% of interactions.
- **Screenshot-driven verification** after every meaningful action — caught a misclick into "+ Add new column" within one screenshot rather than building several wrong steps on top of it.
- **Sticky remote-debugging** — Chrome was already running with CDP enabled, so `browser-harness` attached instantly without prompting you to click anything.
- **JS-located coordinates** for fiddly picker rows — querying `[role=menuitem]` by `textContent.trim() === 'Repair Status'` and reading `getBoundingClientRect()` was more reliable than reading pixels off the screenshot.

## What was tricky (and is now documented in the skill)

- **The "+ Add new column" trap** at the bottom of the status-column picker. Filtering by typed text doesn't remove it. First attempt clicked it instead of "Repair Status" and opened Column Center mid-build — recovered by closing Column Center via its X (NOT Escape, which triggers a "Discard unsaved changes?" dialog).
- **Multi-span labels.** Monday splits picker labels across icon/name/badge spans — `querySelector('span').textContent` returns nothing. Always aggregate via the row container's `textContent`.
- **Escape inside the date picker** also re-triggers the discard prompt. Click outside the dropdown to close it instead.
- **No name field** in the custom builder (mentioned above).
- **Manage tab loads with a spinner**, takes ~2-3s to populate. Screenshot-then-wait once after creation.

---

## Cost / time

- Wall time on this pilot: ~25 minutes interactive (Claude doing the work, Chrome logged in as you).
- Most of that time was the misclick recovery + figuring out the picker selectors. The skill file now collapses both — the next automation from a fresh agent should take **~30-60 seconds** end-to-end.
- LLM cost: a few cents (Opus 4.7 with screenshots).

## Honest compromises

- **Did not rename the automation** to your suggested wording (`Repair Status Received → stamp Received`). Reason: Monday's UI doesn't expose a name field at create time, and renaming adds a `...` menu click + text input + save per automation. Flagging the trade-off rather than silently shipping the auto-name.
- **Did not add a description.** The `Add description` placeholder in the Manage row is empty.
- **Did not test the automation by triggering it.** That would mean modifying an item (changing its Repair Status to Received and watching whether the Received date stamps to today) — your brief explicitly said do not modify items. The toggle being ON in the Manage tab is the strongest signal short of a live trigger; we can verify on the next item that legitimately moves to Received in normal use.

## Recommendation for scaling to ~80 automations

This pilot proves three things:

1. The browser-harness approach works for Monday's custom builder. No Monday API token required.
2. The UI patterns are stable enough to script — picker dropdowns, sentence templates, Create button placement are uniform across automation types.
3. The skill file makes the next attempt cheap.

**Suggested next session**:

- Decide on naming policy (auto-name vs custom rename).
- Hand me the list of the remaining ~80 automations in a clean spec (trigger column, trigger value, action column, action value, optional name + description). I'll script them as a batch — single chat session, parallel-safe within a single Chrome tab, with screenshot verification on every Nth row.
- Estimate: ~60-90 minutes for 80 automations, including verification.

---

## Files touched / created in this session

- ✅ `~/Developer/browser-harness/` — repo cloned, editable installed
- ✅ `~/.claude/CLAUDE.md` — added `@~/Developer/browser-harness/SKILL.md` import
- ✅ `~/.claude/settings.local.json` — added permission allowlist entries
- ✅ `~/.claude/settings.json` — added baseline read-only allowlist (from `/fewer-permission-prompts`)
- ✅ `~/Developer/browser-harness/domain-skills/monday/automations.md` — new skill (worth a PR upstream)
- ✅ Monday board `18401861682` — one new automation (active, owner=you)
- ✅ This report at `~/Desktop/browser-harness-pilot-report.md`

Nothing on the OLD board (349212843) was touched. No items were modified. No automations on the OLD board were touched.

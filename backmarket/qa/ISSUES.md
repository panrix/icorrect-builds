# BackMarket — Issue Log

Where agents (Hugo, etc.) file issues found in build artifacts for Claude Code to pick up. Ops-level fixes (restarts, credential rotations, reversible-in-30s changes) go in `docs/rollback-log.md` instead — this file is for bugs that need source-tracked code changes.

**Rule:** if you (the reporting agent) can't fix it with a config tweak or a service restart, log it here. **Do not patch build artifacts in your workspace** — the patch won't survive a session reset and will drift from git.

---

## How to file

Append a new section at the bottom using this template:

```
## YYYY-MM-DD — <one-line title>

**Reported by:** <agent name>
**Affected:** <file path(s) or service name>
**Symptom:** <what you observed>
**Repro:** <steps to reproduce, or example data that triggers it>
**Suspected cause:** <your best guess — can be empty>
**Impact:** <revenue leak / data drift / silent failure / cosmetic / blocker>
**Priority:** <urgent | normal | backlog>

**Context / notes:** <anything Claude Code will need to understand the fix scope>
```

Rules:
- **One issue per section.** If you find two separate bugs, log two entries.
- **Cite file paths with absolute paths where possible** — saves me a grep.
- **Include the BM order IDs, Monday item IDs, or serials** the issue touches if it's data-specific.
- **If you have a partial diagnosis, include it** — partial is fine, wrong guesses are fine, silence is not.

---

## Status markers

Once Claude Code picks up an issue, the section gets updated in-place with a status footer:

- `**Status:** CLAIMED by Claude Code on YYYY-MM-DD` — work started
- `**Status:** FIXED in commit <sha> — <branch>` — shipped
- `**Status:** WON'T FIX — <reason>` — rejected with reason
- `**Status:** DEFERRED — <reason>` — planned but not now

Once FIXED or WON'T FIX is marked, don't delete the entry — it's the audit trail.

---

## Open issues

_(None yet — add below this line.)_

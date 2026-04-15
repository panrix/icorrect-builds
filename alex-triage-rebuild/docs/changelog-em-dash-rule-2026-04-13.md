# Changelog: Em Dash Ban Reinforcement (2026-04-13)

## Problem

Em dashes (— and –) have been banned since a hard rule was established by Ferrari and Ricky (documented in `knowledge/ferrari-writing-library.md` Hard Rule #1). Despite this, Alex continued producing em dashes in customer-facing drafts and internal responses during the 2026-04-13 session. The rule was not being applied because Alex was not consistently reading the writing library before drafting, and the ban was not surfaced prominently in the always-loaded context.

## Fix

### `memory/feedback_no_em_dashes.md` (new file)

Created a dedicated feedback memory entry explicitly documenting:
- The absolute ban on — and –
- The reason (Ferrari and Ricky hard rule, repeated violations)
- How to apply: scan every output before presenting, replace with full stop, colon, semicolon, or sentence rewrite

### `MEMORY.md`

Added a **Hard Writing Rules** section above the Lessons block, making the em dash ban visible in the always-loaded conversation context:

```
## Hard Writing Rules

- **NO EM DASHES. EVER.** Not in drafts, not in responses, not anywhere.
  Scan every output before presenting. Replace with full stop, colon,
  semicolon, or rewrite.
```

## Root Cause

Alex was skipping the pre-draft checklist step that requires reading `ferrari-writing-library.md`. The rule existed but was only reachable by explicitly opening that file. The fix surfaces it in MEMORY.md so it loads in every session without requiring a deliberate file read.

## Behaviour After This Change

| Scenario | Before | After |
|---|---|---|
| Draft produced without reading writing library | Em dashes may appear | Em dash ban visible in MEMORY.md at session start |
| Any output containing — or – | May be presented to user | Must be caught and rewritten before presenting |

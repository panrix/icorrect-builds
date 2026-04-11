# Token Budget Analysis — Per-Agent Context Usage

**Generated:** 2026-02-26
**Purpose:** Understand how much context each agent consumes before any conversation starts.
**Method:** Byte count of all files loaded at bootstrap, estimated at ~4 chars per token.

---

## Context Window

- **Available:** 200K tokens (all models: Opus, Sonnet, Haiku)
- **softThresholdTokens:** 4,000 (from openclaw.json)
- **Issue:** softThreshold of 4,000 is critically low — compaction fires almost immediately. Config audit flagged this. Should be 20,000-40,000.

---

## Foundation Docs (Shared, Loaded via Symlink)

| File | Bytes | Est. Tokens |
|------|-------|-------------|
| COMPANY.md | 3,435 | 859 |
| GOALS.md | 8,402 | 2,101 |
| PRINCIPLES.md | 5,174 | 1,294 |
| PROBLEMS.md | 8,894 | 2,224 |
| RICKY.md | 4,844 | 1,211 |
| SUPABASE.md | 1,542 | 386 |
| TEAM.md | 10,677 | 2,669 |
| VISION.md | 2,655 | 664 |
| **TOTAL** | **45,623** | **~11,406** |

Foundation docs alone consume ~5.7% of the 200K context window. This is reasonable.

---

## Per-Agent Bootstrap Context

Files loaded at session start: SOUL.md + CLAUDE.md + USER.md + MEMORY.md

| Agent | Model | SOUL | CLAUDE | USER | MEMORY | Bootstrap (bytes) | Bootstrap (~tokens) |
|-------|-------|------|--------|------|--------|-------------------|---------------------|
| main (Jarvis) | Opus | 1,417 | — | 729 | 1,116 | 3,262 | ~816 |
| backmarket | Sonnet | 3,680 | 10,385 | 247 | 5,164 | 19,476 | ~4,869 |
| operations | Sonnet | 3,557 | 14,190 | 247 | 2,911 | 20,905 | ~5,226 |
| customer-service | Sonnet | 2,188 | 11,875 | 247 | 1,540 | 15,850 | ~3,963 |
| marketing | Sonnet | 2,479 | 11,965 | 247 | 1,486 | 16,177 | ~4,044 |
| website | Sonnet | 5,536 | 13,945 | 247 | 2,886 | 22,614 | ~5,654 |
| parts | Sonnet | 6,160 | 13,868 | 247 | 2,363 | 22,638 | ~5,660 |
| team | Sonnet | 6,855 | 13,454 | 247 | 4,799 | 25,355 | ~6,339 |
| systems | Haiku | 1,394 | 11,084 | 247 | 3,788 | 16,513 | ~4,128 |
| slack-jarvis | Sonnet | 1,591 | 4,303 | 162 | 0 | 6,056 | ~1,514 |
| pm | Sonnet | 1,242 | 8,445 | 247 | 0 | 9,934 | ~2,484 |

**Note:** Jarvis (main) has no CLAUDE.md — lowest bootstrap cost. All domain agents load 4-6K tokens of bootstrap context.

---

## Shared-Context Duplication (WASTE)

8 agents have `docs/shared-context/` directories containing copies of foundation docs.
This is REDUNDANT — agents already have `foundation/` symlink to the same content.

| Agent | shared-context/ bytes | Wasted Tokens |
|-------|----------------------|---------------|
| backmarket | 29,864 | ~7,466 |
| operations | 32,674 | ~8,169 |
| customer-service | 25,647 | ~6,412 |
| marketing | 25,647 | ~6,412 |
| website | 28,769 | ~7,192 |
| parts | 30,984 | ~7,746 |
| team | 38,548 | ~9,637 |
| systems | 25,647 | ~6,412 |
| **TOTAL WASTE** | **237,780** | **~59,445** |

Each agent wastes 6-10K tokens on duplicate foundation content. This was identified in Session 1 workspace audits.

---

## Total Context at Session Start (Current v2)

Includes: bootstrap + foundation (symlink) + shared-context (duplicate) + memory/ (searchable, not all loaded but indexed)

| Agent | Bootstrap | Foundation | Shared-Context (dup) | Memory | Docs | Total Indexed | Est. Tokens |
|-------|-----------|------------|---------------------|--------|------|---------------|-------------|
| main | 3,262 | 0 | 0 | 46,824 | 0 | 50,086 | ~12,522 |
| backmarket | 19,476 | 45,623 | 29,864 | 126,944 | 222,963 | 444,870 | ~111,218 |
| operations | 20,905 | 45,623 | 32,674 | 44,632 | 138,046 | 281,880 | ~70,470 |
| customer-service | 15,850 | 45,623 | 25,647 | 27,443 | 146,806 | 261,369 | ~65,342 |
| marketing | 16,177 | 45,623 | 25,647 | 8,364 | 34,892 | 130,703 | ~32,676 |
| website | 22,614 | 45,623 | 28,769 | 12,873 | 142,437 | 252,316 | ~63,079 |
| parts | 22,638 | 45,623 | 30,984 | 707 | 71,797 | 171,749 | ~42,937 |
| team | 25,355 | 45,623 | 38,548 | 26,355 | 223,504 | 359,385 | ~89,846 |
| systems | 16,513 | 45,623 | 25,647 | 24,243 | 171,153 | 283,179 | ~70,795 |

**Note:** "Total Indexed" includes everything in the workspace that memory-core can search. Not all loaded simultaneously — only bootstrap + foundation are injected at start. Memory-core retrieves relevant docs on demand via memory_search.

---

## What Gets Injected vs Searched

| Layer | Injected at start? | Always in context? | Searchable? |
|-------|-------------------|-------------------|-------------|
| SOUL.md | YES | YES | YES |
| CLAUDE.md | YES | YES | YES |
| USER.md | YES | YES | YES |
| MEMORY.md | YES | YES | YES |
| foundation/ | Via bootstrap hook | YES (~11K tokens) | YES |
| shared-context/ | NO (but agent may read) | Depends | YES |
| memory/*.md | NO | NO | YES (via memory_search) |
| docs/*.md | NO | NO | YES (via extraPaths) |

**Effective initial context per agent:** Bootstrap (~4-6K) + Foundation (~11K) = **~15-17K tokens**
This leaves ~183-185K tokens for conversation, tool results, and memory retrieval.

---

## v3 Comparison (After Cleanup)

In v3, each agent workspace drops shared-context/ duplication and caps CLAUDE.md at 80 lines (~3,200 bytes).

| Component | v2 Current | v3 Target | Savings |
|-----------|-----------|-----------|---------|
| SOUL.md | 1.4-6.9 KB | Max 40 lines (~1.6 KB) | -0 to -5 KB |
| CLAUDE.md | 4.3-14.2 KB | Max 80 lines (~3.2 KB) | -1 to -11 KB |
| USER.md | 0.2-0.7 KB | ~0.7 KB (standard) | ~0 |
| MEMORY.md | 0-5.2 KB | Natural growth | ~0 |
| Foundation | 45.6 KB | 45.6 KB (no change) | 0 |
| shared-context/ | 25-39 KB | REMOVED | **-25 to -39 KB** |
| **Bootstrap total** | ~15-17K tokens | ~8-10K tokens | **~5-7K tokens saved** |

The biggest win is removing shared-context/ duplication (saves 6-10K tokens per agent).
Second biggest is capping CLAUDE.md (saves 2-3K tokens for most agents).

---

## Recommendations

1. **Raise softThresholdTokens** from 4,000 to 25,000-40,000. At 4K, compaction fires almost immediately, losing conversation context.

2. **Remove shared-context/ directories** from all agents. Foundation is already available via symlink. This saves ~59K tokens across all agents.

3. **Cap CLAUDE.md at 80 lines** per the v3 spec. Current CLAUDE.md files range from 4.3-14.2 KB. Most contain repetitive boilerplate that should be in SOUL.md or foundation docs.

4. **Cap SOUL.md at 40 lines** per the v3 spec. Team (6.9KB) and Parts (6.2KB) are overweight.

5. **Audit memory/ growth** — backmarket has 127KB of memory files (13 files). If memory-core loads too many at once, it could crowd out conversation context.

6. **Main (Jarvis) needs a CLAUDE.md** for v3 — it currently has none.

7. **Consider foundation doc trimming** — 45.6KB (~11K tokens) is reasonable but TEAM.md (10.7KB) and PROBLEMS.md (8.9KB) are the largest. Check if all content is still relevant.

---

## Security Note

The token budget analysis process revealed that the existing shared-context/ directories contain full copies of foundation docs including TEAM.md (team member details) and RICKY.md (personal info). While these are appropriate in the read-only foundation/ symlink, having writable copies in agent workspaces means agents could theoretically modify or expose this data.

---

*Generated by Claude Code — Phase 0, Session 2, Task R-A6*

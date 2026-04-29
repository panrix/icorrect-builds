# Test fixtures for agent-rebuild

Synthetic data + replay procedures used by Phase 6.5, 7.5, and 9 acceptance tests. Reproducible — every fixture is regenerable from a script in this directory; do not edit timestamps or IDs by hand.

## Subdirectories

| Dir | Used by | What it contains |
|---|---|---|
| `capture-to-ship/` | Phase 6.5 | Synthetic Coffee Mornings captures (4-day-old NEW item, IN-PLAY item, KILLED item) for testing the resurface-cron, decide-hook, graduate-hook, and circuit breakers |
| `hygiene/` | Phase 7.5 | Synthetic stray files (zero-byte, byte-identical duplicate, `tmp_*` over 7d) for testing the auto-fixable scan + quarantine + restore loop. Also a synthetic process-drift file for the advisory-only path |
| `dispatch/` | Phase 9 | Trivial build request prompts that should produce a small, real PR via gstack-full when posted to Operations or Main |

## Replay procedures

Each subdirectory has a `replay.sh` (added when its phase lands) that:

1. Resets/cleans the relevant target (`backlog.md`, hygiene scan state, dispatch test repo)
2. Stages the fixture files at the right paths with the right mtimes
3. Manually fires the relevant cron/hook
4. Captures expected output to compare against acceptance criteria

## Conventions

- All UUIDs in fixtures are deterministic (e.g. `00000000-0000-0000-0000-000000000001`) so re-runs are repeatable
- All timestamps are derived from `date -u -d "N days ago" +%Y-%m-%dT%H:%M:%SZ` at replay time, not hardcoded
- No real customer data, no real bot tokens, no real API keys — every secret-shaped string is `XXXXX-FAKE-XXXXX`
- Files added later by phase build agents must include a one-line comment naming the phase that owns them

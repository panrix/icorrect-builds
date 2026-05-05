# Mutagen VPS Core Runbook

**Created:** 2026-05-05
**Purpose:** Keep Mac access to core VPS files without syncing Git internals, runtime state, caches, or VPS worktrees.

## Current Session

- Name: `vps-core`
- Alpha: `/Users/ricky/vps`
- Beta: `ricky@46.225.53.159:/home/ricky/`
- Mode: `two-way-safe`
- VCS: ignored
- Symlinks: ignored
- Max staging file size: 512M
- Current managed payload after `/worktrees` exclusion: about 911M

## Rules

1. `/Users/ricky/vps` is for lightweight file access and browsing.
2. GitHub is the source of truth for code.
3. VPS paths are runtime/deployment/data paths.
4. Do not use `/Users/ricky/vps/worktrees/*` as local Codex worktrees.
5. Create local Codex worktrees under `/Users/ricky/.codex/worktrees/...`.
6. Create VPS worktrees under `/home/ricky/worktrees/...` only for sessions running directly on the VPS.

## Why `/worktrees` Is Ignored

The mirrored worktree folders contain `.git` pointer files such as:

```text
gitdir: /home/ricky/builds/.git/worktrees/agent-rebuild
```

Those paths are valid on the VPS, but invalid on the Mac. Syncing them into `/Users/ricky/vps/worktrees` makes the folders look usable while `git` cannot actually resolve the repository metadata locally.

## Health Checks

```bash
mutagen sync list
ssh vps 'df -h /; du -sh ~/.mutagen 2>/dev/null'
```

Expected healthy shape:

- `vps-core` connected on both sides.
- Synchronizable payload stays under a few GB.
- VPS root filesystem has healthy free space.
- `~/.mutagen` stays small; it should not grow into many GB of staging data.

## Do Not Resume

Do not recreate or resume the old whole-home mirror named `vps-mirror`. Its unsafe behavior was syncing all of `/Users/ricky/vps` to `/home/ricky/` with no ignores, including `.git` packs and runtime/cache state.

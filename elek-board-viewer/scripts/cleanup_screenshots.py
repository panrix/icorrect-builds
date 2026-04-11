#!/usr/bin/env python3

from __future__ import annotations

import json
import time
from pathlib import Path

from common import LOG_DIR, PARSER_CACHE_DIR, SCREENSHOTS_DIR, STATE_DIR


def cleanup_dir(path: Path, max_age_days: int) -> int:
    if not path.exists():
        return 0
    cutoff = time.time() - (max_age_days * 86400)
    removed = 0
    for item in path.glob("*"):
        if item.is_file() and item.stat().st_mtime < cutoff:
            item.unlink()
            removed += 1
    return removed


def cleanup_tree(path: Path, max_age_days: int) -> int:
    if not path.exists():
        return 0
    cutoff = time.time() - (max_age_days * 86400)
    removed = 0
    for item in sorted(path.rglob("*"), reverse=True):
        if item.is_file() and item.stat().st_mtime < cutoff:
            item.unlink()
            removed += 1
        elif item.is_dir():
            try:
                item.rmdir()
            except OSError:
                pass
    return removed


def main() -> int:
    removed_screens = cleanup_dir(SCREENSHOTS_DIR, 7)
    removed_logs = cleanup_dir(LOG_DIR, 14)
    removed_parser_cache = cleanup_tree(PARSER_CACHE_DIR, 14)
    removed_runtime_state = cleanup_tree(STATE_DIR / "runtime_xdg", 7)
    print(
        json.dumps(
            {
                "removed_logs": removed_logs,
                "removed_parser_cache": removed_parser_cache,
                "removed_runtime_state": removed_runtime_state,
                "removed_screenshots": removed_screens,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"
LOG_DIR = DATA_DIR / "boardview_logs"
STATE_DIR = DATA_DIR / "boardview_state"
PARSER_CACHE_DIR = DATA_DIR / "parser_cache"
INDEX_PATH = DATA_DIR / "board_index.json"
REQUEST_LOG_PATH = LOG_DIR / "requests.log"
CONTROLLER_LOG_PATH = LOG_DIR / "flexbv-controller.log"
RUNTIME_STATE_PATH = STATE_DIR / "runtime.json"
LOCK_PATH = STATE_DIR / "flexbv.lock"
RUNTIME_HOME = STATE_DIR / "runtime_home"
RUNTIME_XDG = STATE_DIR / "runtime_xdg"
RUNTIME_XDG_RUNTIME = STATE_DIR / "runtime_xdg_runtime"
SCHEMATICS_DIR = PROJECT_ROOT / "schematics"
ELEK_TOOLS_PATH = Path("/home/ricky/.openclaw/agents/diagnostics/workspace/TOOLS.md")
ELEK_CLAUDE_PATH = Path("/home/ricky/.openclaw/agents/diagnostics/workspace/CLAUDE.md")
FLEXBV_BIN = Path("/opt/flexbv/flexbv")
FBVPDF_BIN = Path("/opt/flexbv/fbvpdf")
DISPLAY = ":99"
WINDOW_WIDTH = 1600
WINDOW_HEIGHT = 900
LOCK_TIMEOUT_SECONDS = 60
ZOOM_LEVELS = ("overview", "region", "closeup")


def ensure_dirs() -> None:
    for path in (
        DATA_DIR,
        SCREENSHOTS_DIR,
        LOG_DIR,
        STATE_DIR,
        PARSER_CACHE_DIR,
        RUNTIME_HOME,
        RUNTIME_XDG,
        RUNTIME_XDG_RUNTIME,
    ):
        path.mkdir(parents=True, exist_ok=True)


def timestamp_slug() -> str:
    return time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def log_line(path: Path, record: dict[str, Any]) -> None:
    ensure_dirs()
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, sort_keys=True) + "\n")


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize_token(value: str) -> str:
    return re.sub(r"\s+", "", value or "").upper()


def run(
    args: list[str],
    *,
    env: dict[str, str] | None = None,
    timeout: int | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    full_env = os.environ.copy()
    if env:
        full_env.update(env)
    return subprocess.run(
        args,
        env=full_env,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=check,
    )


def runtime_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    env = {
        "DISPLAY": DISPLAY,
        "HOME": str(RUNTIME_HOME),
        "XDG_DATA_HOME": str(RUNTIME_XDG),
        "XDG_RUNTIME_DIR": str(RUNTIME_XDG_RUNTIME),
    }
    if extra:
        env.update(extra)
    return env

#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
import os
import re
import signal
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

from common import FLEXBV_BIN, PARSER_CACHE_DIR, ensure_dirs


PART_RE = re.compile(
    r"part '([^']+)' size .*?\(\s*([0-9.]+)\s+([0-9.]+)\s+-\s+([0-9.]+)\s+([0-9.]+)\s*\)"
)
PIN_RE = re.compile(r"GridPopulate Inserting ([^:]+):([^ ]+) \(([0-9.]+), ([0-9.]+)\)")
BOARD_RE = re.compile(r"Board Stats: '.*' size = ([0-9.]+) x ([0-9.]+),\s+([0-9]+) pins,\s+([0-9]+) parts")
CACHE_VERSION = 3


@dataclass
class BoardData:
    path: str
    board_width: float | None
    board_height: float | None
    components: dict
    parser_status: str
    warnings: list[str]


def cache_path_for(board_path: str) -> Path:
    digest = hashlib.sha1(Path(board_path).resolve().as_posix().encode("utf-8")).hexdigest()
    return PARSER_CACHE_DIR / f"{digest}.json"


def _start_temp_xvfb(display: str) -> subprocess.Popen[str]:
    return subprocess.Popen(
        ["Xvfb", display, "-screen", "0", "1200x700x24"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        text=True,
        start_new_session=True,
    )


def _run_flexbv_debug(board_path: str) -> str:
    ensure_dirs()
    PARSER_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    temp_root = PARSER_CACHE_DIR / "runtime"
    parser_home = temp_root / "home"
    parser_xdg = temp_root / "xdg"
    parser_home.mkdir(parents=True, exist_ok=True)
    parser_xdg.mkdir(parents=True, exist_ok=True)

    display = ":98"
    xvfb = _start_temp_xvfb(display)
    time.sleep(1)
    env = os.environ.copy()
    env.update(
        {
            "DISPLAY": display,
            "HOME": str(parser_home),
            "XDG_DATA_HOME": str(parser_xdg),
        }
    )
    proc = subprocess.Popen(
        [str(FLEXBV_BIN), "-d", "-x", "1200", "-y", "700", "-i", board_path],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    try:
        stdout, _ = proc.communicate(timeout=8)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGINT)
        try:
            stdout, _ = proc.communicate(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            stdout, _ = proc.communicate()
    finally:
        xvfb.terminate()
        try:
            xvfb.wait(timeout=2)
        except subprocess.TimeoutExpired:
            xvfb.kill()
    return stdout


def _parse_debug_output(board_path: str, text: str) -> BoardData:
    components: dict[str, dict] = {}
    board_width = None
    board_height = None
    warnings: list[str] = []

    for line in text.splitlines():
        board_match = BOARD_RE.search(line)
        if board_match:
            board_width = float(board_match.group(1))
            board_height = float(board_match.group(2))

        part_match = PART_RE.search(line)
        if part_match:
            name = part_match.group(1).upper()
            x1 = float(part_match.group(2))
            y1 = float(part_match.group(3))
            x2 = float(part_match.group(4))
            y2 = float(part_match.group(5))
            components.setdefault(
                name,
                {
                    "name": name,
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "center": {"x": (x1 + x2) / 2.0, "y": (y1 + y2) / 2.0},
                    "pins": [],
                    "nets": [],
                    "board_side": None,
                },
            )
            continue

        pin_match = PIN_RE.search(line)
        if pin_match:
            part_name = pin_match.group(1).upper()
            entry = components.setdefault(
                part_name,
                {
                    "name": part_name,
                    "bbox": None,
                    "center": None,
                    "pins": [],
                    "nets": [],
                    "board_side": None,
                },
            )
            entry["pins"].append(
                {
                    "pin": pin_match.group(2),
                    "x": float(pin_match.group(3)),
                    "y": float(pin_match.group(4)),
                    "net": None,
                }
            )

    if board_width is None or board_height is None:
        inferred_width, inferred_height = _infer_board_bounds(components)
        if inferred_width and inferred_height:
            board_width = inferred_width
            board_height = inferred_height
            warnings.append("Board dimensions were inferred from component extents.")

    if not components:
        warnings.append("FlexBV debug output did not yield any components.")
    elif board_width is None or board_height is None:
        warnings.append("Board dimensions were not present in FlexBV debug output.")
    else:
        _populate_board_side(components, board_height)

    return BoardData(
        path=board_path,
        board_width=board_width,
        board_height=board_height,
        components=components,
        parser_status="partial" if components else "failed",
        warnings=warnings,
    )


def _infer_board_bounds(components: dict[str, dict]) -> tuple[float | None, float | None]:
    max_x = 0.0
    max_y = 0.0
    found = False
    for component in components.values():
        bbox = component.get("bbox")
        if bbox:
            max_x = max(max_x, bbox["x1"], bbox["x2"])
            max_y = max(max_y, bbox["y1"], bbox["y2"])
            found = True
        for pin in component.get("pins", []):
            max_x = max(max_x, pin["x"])
            max_y = max(max_y, pin["y"])
            found = True
    if not found:
        return None, None
    return max_x, max_y


def _populate_board_side(components: dict[str, dict], board_height: float) -> None:
    midpoint = board_height / 2.0
    for component in components.values():
        center = component.get("center")
        if center and center.get("y") is not None:
            component["board_side"] = "top" if center["y"] < midpoint else "bottom"


def _to_payload(board: BoardData) -> dict:
    return {
        "path": board.path,
        "board_width": board.board_width,
        "board_height": board.board_height,
        "components": board.components,
        "parser_status": board.parser_status,
        "warnings": board.warnings,
    }


def _from_payload(payload: dict) -> BoardData:
    return BoardData(
        path=payload["path"],
        board_width=payload.get("board_width"),
        board_height=payload.get("board_height"),
        components=payload.get("components", {}),
        parser_status=payload.get("parser_status", "failed"),
        warnings=payload.get("warnings", []),
    )


def load_board(path: str) -> BoardData:
    cache_path = cache_path_for(path)
    board_mtime = Path(path).stat().st_mtime
    if cache_path.exists():
        payload = json.loads(cache_path.read_text(encoding="utf-8"))
        if (
            payload.get("cache_version") == CACHE_VERSION
            and payload.get("source_mtime") == board_mtime
            and payload.get("board_width")
            and payload.get("board_height")
        ):
            return _from_payload(payload)

    raw = _run_flexbv_debug(path)
    board = _parse_debug_output(path, raw)
    payload = _to_payload(board)
    payload["cache_version"] = CACHE_VERSION
    payload["source_mtime"] = board_mtime
    cache_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return board


def find_component(board: BoardData, name: str) -> dict | None:
    return board.components.get(name.upper())


def find_net(board: BoardData, net_name: str) -> list[dict]:
    target = net_name.upper()
    hits = []
    for component in board.components.values():
        for pin in component["pins"]:
            if (pin.get("net") or "").upper() == target:
                hit = dict(pin)
                hit["component"] = component["name"]
                hits.append(hit)
    return hits


def list_components(board: BoardData) -> list[str]:
    return sorted(board.components)


def get_component_center(board: BoardData, name: str) -> dict | None:
    component = find_component(board, name)
    if not component:
        return None
    return component.get("center")

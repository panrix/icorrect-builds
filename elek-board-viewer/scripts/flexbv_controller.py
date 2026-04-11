#!/usr/bin/env python3

from __future__ import annotations

import os
import signal
import subprocess
import shutil
import time
from pathlib import Path

from common import (
    CONTROLLER_LOG_PATH,
    DISPLAY,
    FLEXBV_BIN,
    RUNTIME_HOME,
    RUNTIME_STATE_PATH,
    RUNTIME_XDG,
    RUNTIME_XDG_RUNTIME,
    WINDOW_HEIGHT,
    WINDOW_WIDTH,
    ensure_dirs,
    now_iso,
    read_json,
    run,
    runtime_env,
    write_json,
)

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    Image = None
    ImageDraw = None


FLEXBV_WINDOW_CLASS = "flexbv"
CAPTURE_ATTEMPTS = 10
CAPTURE_RETRY_DELAY_SECONDS = 0.75
POST_LAUNCH_DELAY_SECONDS = 3.5
BOARD_DARK_THRESHOLD = 80
ROW_DARK_PIXEL_THRESHOLD = 600
ROW_GAP_TOLERANCE = 20
COL_GAP_TOLERANCE = 12
MIN_VIEWPORT_HEIGHT = 80
MIN_VIEWPORT_WIDTH = 200
VIEWPORT_CACHE_KEY = "viewport_cache"
REGION_VIEW_RATIO = (0.32, 0.28)
CLOSEUP_VIEW_RATIO = (0.14, 0.14)
REGION_MIN_SIZE = (340, 220)
CLOSEUP_MIN_SIZE = (180, 140)
REGION_SCALE = 2
CLOSEUP_SCALE = 4


class ControllerError(RuntimeError):
    error_code = "runtime_unavailable"


class WindowNotFoundError(ControllerError):
    error_code = "window_not_found"


class ScreenshotError(ControllerError):
    error_code = "screenshot_failed"


def _log(message: str) -> None:
    ensure_dirs()
    with CONTROLLER_LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(f"{now_iso()} {message}\n")


def _read_state() -> dict:
    return read_json(RUNTIME_STATE_PATH, default={}) or {}


def _write_state(payload: dict) -> None:
    write_json(RUNTIME_STATE_PATH, payload)


def _pid_alive(pid: int | None) -> bool:
    if not pid:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def _wait_for_window(timeout: float = 20.0) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        result = run(
            ["xdotool", "search", "--class", FLEXBV_WINDOW_CLASS],
            env=runtime_env(),
            timeout=5,
            check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().splitlines()[-1]
        time.sleep(0.5)
    raise WindowNotFoundError("FlexBV window was not found")


def display_available() -> bool:
    result = run(["xdpyinfo"], env=runtime_env(), timeout=5, check=False)
    return result.returncode == 0


def ensure_runtime() -> None:
    if not display_available():
        raise ControllerError("DISPLAY=:99 is not available")


def get_window_id() -> str:
    state = _read_state()
    window_id = state.get("window_id")
    if window_id:
        result = run(
            ["xprop", "-id", str(window_id)],
            env=runtime_env(),
            timeout=5,
            check=False,
        )
        if result.returncode == 0:
            return str(window_id)
    return _wait_for_window()


def focus_window(window_id: str | None = None) -> str:
    wid = window_id or get_window_id()
    run(["xdotool", "windowactivate", "--sync", wid], env=runtime_env(), timeout=5, check=True)
    return wid


def stop_flexbv() -> None:
    state = _read_state()
    pid = state.get("pid")
    if _pid_alive(pid):
        _log(f"Stopping FlexBV pid={pid}")
        try:
            os.killpg(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        deadline = time.time() + 5
        while time.time() < deadline and _pid_alive(pid):
            time.sleep(0.2)
        if _pid_alive(pid):
            try:
                os.killpg(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
    state["pid"] = None
    state["window_id"] = None
    _write_state(state)


def _reset_runtime_storage() -> None:
    for path in (RUNTIME_HOME, RUNTIME_XDG, RUNTIME_XDG_RUNTIME):
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
    ensure_dirs()


def _launch_flexbv(board_path: str) -> tuple[int, str]:
    ensure_dirs()
    _reset_runtime_storage()
    env = runtime_env()
    log_handle = CONTROLLER_LOG_PATH.open("a", encoding="utf-8")
    proc = subprocess.Popen(
        [str(FLEXBV_BIN), "-x", str(WINDOW_WIDTH), "-y", str(WINDOW_HEIGHT), "-i", board_path],
        env=env,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        text=True,
        start_new_session=True,
    )
    _log(f"Started FlexBV pid={proc.pid} board={board_path}")
    window_id = _wait_for_window()
    state = _read_state()
    state.update(
        {
            "pid": proc.pid,
            "window_id": window_id,
            "loaded_board": board_path,
            "last_started_at": now_iso(),
        }
    )
    _write_state(state)
    return proc.pid, window_id


def _window_alive(window_id: str | None) -> bool:
    if not window_id:
        return False
    result = run(
        ["xprop", "-id", str(window_id)],
        env=runtime_env(),
        timeout=5,
        check=False,
    )
    return result.returncode == 0


def restart_runtime_if_dead(board_path: str) -> tuple[int, str]:
    state = _read_state()
    if _pid_alive(state.get("pid")) and _window_alive(state.get("window_id")):
        return state["pid"], str(state["window_id"])
    stop_flexbv()
    return _launch_flexbv(board_path)


def load_board(model_or_revision: str, board_path: str) -> dict:
    ensure_runtime()
    state = _read_state()
    live_same_board = (
        state.get("loaded_board") == board_path
        and _pid_alive(state.get("pid"))
        and _window_alive(state.get("window_id"))
    )
    if live_same_board:
        pid = state["pid"]
        window_id = str(state["window_id"])
    else:
        state_pid = state.get("pid")
        state_board = state.get("loaded_board")
        if state_pid and _pid_alive(state_pid) and state_board != board_path:
            stop_flexbv()
            pid, window_id = _launch_flexbv(board_path)
        else:
            pid, window_id = restart_runtime_if_dead(board_path)
        time.sleep(POST_LAUNCH_DELAY_SECONDS)
        state = _read_state()
    state["requested_board"] = model_or_revision
    state["pid"] = pid
    state["window_id"] = window_id
    state["loaded_board"] = board_path
    _write_state(state)
    return state


def _image_has_content(path: Path) -> bool:
    if not path.exists() or path.stat().st_size == 0:
        return False
    if Image is None:
        return path.stat().st_size > 2048
    with Image.open(path) as raw_img:
        img = raw_img.convert("RGB").resize((96, 54))
        colors = img.getcolors(maxcolors=img.width * img.height)
        unique_colors = len(colors) if colors else 9999
        extrema = img.convert("L").getextrema()
    dynamic_range = extrema[1] - extrema[0]
    return unique_colors > 4 and dynamic_range >= 8


def capture_window_png(output_path: str) -> str:
    window_id = focus_window()
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, CAPTURE_ATTEMPTS + 1):
        if path.exists():
            path.unlink()
        run(["import", "-window", window_id, str(path)], env=runtime_env(), timeout=10, check=True)
        if _image_has_content(path):
            return str(path)
        _log(f"Capture attempt {attempt} for window {window_id} produced a blank or low-variance frame")
        time.sleep(CAPTURE_RETRY_DELAY_SECONDS)
    raise ScreenshotError(f"Screenshot path {path} was created but never rendered non-empty content")


def _group_dense_indices(indices: list[int], *, gap_tolerance: int) -> list[tuple[int, int]]:
    if not indices:
        return []
    groups: list[tuple[int, int]] = []
    start = previous = indices[0]
    for value in indices[1:]:
        if value - previous <= gap_tolerance:
            previous = value
            continue
        groups.append((start, previous))
        start = previous = value
    groups.append((start, previous))
    return groups


def _dark_pixel(rgb: tuple[int, int, int]) -> bool:
    return ((rgb[0] + rgb[1] + rgb[2]) / 3.0) < BOARD_DARK_THRESHOLD


def _detect_board_viewports(image_path: str) -> list[dict]:
    if Image is None:
        raise ScreenshotError("Pillow is required for viewport detection")
    img = Image.open(image_path).convert("RGB")
    row_indices: list[int] = []
    for y in range(img.height):
        dark_count = 0
        for x in range(img.width):
            if _dark_pixel(img.getpixel((x, y))):
                dark_count += 1
        if dark_count >= ROW_DARK_PIXEL_THRESHOLD:
            row_indices.append(y)
    row_groups = [
        (top, bottom)
        for top, bottom in _group_dense_indices(row_indices, gap_tolerance=ROW_GAP_TOLERANCE)
        if (bottom - top + 1) >= MIN_VIEWPORT_HEIGHT
    ]
    if not row_groups:
        raise ScreenshotError("Could not detect board viewports from the FlexBV screenshot")

    viewports: list[dict] = []
    for top, bottom in sorted(row_groups, key=lambda item: (item[1] - item[0]), reverse=True)[:2]:
        band_height = bottom - top + 1
        col_threshold = max(40, int(band_height * 0.18))
        col_indices: list[int] = []
        for x in range(img.width):
            dark_count = 0
            for y in range(top, bottom + 1):
                if _dark_pixel(img.getpixel((x, y))):
                    dark_count += 1
            if dark_count >= col_threshold:
                col_indices.append(x)
        col_groups = [
            (left, right)
            for left, right in _group_dense_indices(col_indices, gap_tolerance=COL_GAP_TOLERANCE)
            if (right - left + 1) >= MIN_VIEWPORT_WIDTH
        ]
        if not col_groups:
            continue
        left, right = max(col_groups, key=lambda item: item[1] - item[0])
        viewports.append(
            {
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "width": right - left + 1,
                "height": bottom - top + 1,
            }
        )
    if not viewports:
        raise ScreenshotError("Detected board rows but could not derive board viewport columns")
    return sorted(viewports, key=lambda item: item["top"])


def _cached_viewports(board_path: str | None, image_path: str) -> list[dict] | None:
    if not board_path:
        return None
    state = _read_state()
    cache = state.get(VIEWPORT_CACHE_KEY, {})
    cached = cache.get(board_path)
    if not cached:
        return None
    if tuple(cached.get("image_size", [])) != Image.open(image_path).size:
        return None
    return cached.get("viewports")


def _store_viewports(board_path: str | None, image_path: str, viewports: list[dict]) -> None:
    if not board_path:
        return
    state = _read_state()
    cache = state.setdefault(VIEWPORT_CACHE_KEY, {})
    cache[board_path] = {
        "image_size": list(Image.open(image_path).size),
        "viewports": viewports,
    }
    _write_state(state)


def _board_viewports(image_path: str, parser_board) -> list[dict]:
    board_path = getattr(parser_board, "path", None)
    cached = _cached_viewports(board_path, image_path)
    if cached:
        return cached
    viewports = _detect_board_viewports(image_path)
    _store_viewports(board_path, image_path, viewports)
    return viewports


def _select_viewport(component: dict, parser_board, viewports: list[dict]) -> dict:
    if len(viewports) == 1:
        return viewports[0]
    ordered = sorted(viewports, key=lambda item: item["top"])
    upper, lower = ordered[0], ordered[-1]
    if not parser_board or not parser_board.board_height:
        return lower
    center = component.get("center") or {}
    component_y = center.get("y")
    if component_y is None:
        return lower
    return lower if component_y < (parser_board.board_height / 2.0) else upper


def _map_bbox(viewports: list[dict], component: dict, parser_board) -> tuple[float, float, float, float]:
    bbox = component["bbox"]
    viewport = _select_viewport(component, parser_board, viewports)
    scale_x = viewport["width"] / max(parser_board.board_width or 1.0, 1.0)
    scale_y = viewport["height"] / max(parser_board.board_height or 1.0, 1.0)
    return (
        viewport["left"] + (bbox["x1"] * scale_x),
        viewport["top"] + (bbox["y1"] * scale_y),
        viewport["left"] + (bbox["x2"] * scale_x),
        viewport["top"] + (bbox["y2"] * scale_y),
    )


def _clamp_crop_box(left: float, top: float, right: float, bottom: float, *, image_size: tuple[int, int]) -> tuple[int, int, int, int]:
    img_w, img_h = image_size
    left_i = max(0, int(round(left)))
    top_i = max(0, int(round(top)))
    right_i = min(img_w, int(round(right)))
    bottom_i = min(img_h, int(round(bottom)))
    if right_i <= left_i:
        right_i = min(img_w, left_i + 1)
    if bottom_i <= top_i:
        bottom_i = min(img_h, top_i + 1)
    return left_i, top_i, right_i, bottom_i


def _zoom_crop_box(
    zoom_level: str,
    *,
    mapped_bbox: tuple[float, float, float, float],
    viewport: dict,
    image_size: tuple[int, int],
) -> tuple[int, int, int, int] | None:
    if zoom_level == "overview":
        return None
    x1, y1, x2, y2 = mapped_bbox
    bbox_w = max(1.0, x2 - x1)
    bbox_h = max(1.0, y2 - y1)
    center_x = (x1 + x2) / 2.0
    center_y = (y1 + y2) / 2.0

    if zoom_level == "region":
        target_w = max(int(viewport["width"] * REGION_VIEW_RATIO[0]), int(bbox_w * 10), REGION_MIN_SIZE[0])
        target_h = max(int(viewport["height"] * REGION_VIEW_RATIO[1]), int(bbox_h * 10), REGION_MIN_SIZE[1])
    elif zoom_level == "closeup":
        target_w = max(int(viewport["width"] * CLOSEUP_VIEW_RATIO[0]), int(bbox_w * 20), CLOSEUP_MIN_SIZE[0])
        target_h = max(int(viewport["height"] * CLOSEUP_VIEW_RATIO[1]), int(bbox_h * 20), CLOSEUP_MIN_SIZE[1])
    else:
        raise ScreenshotError(f"Unsupported zoom level '{zoom_level}'")

    return _clamp_crop_box(
        center_x - (target_w / 2.0),
        center_y - (target_h / 2.0),
        center_x + (target_w / 2.0),
        center_y + (target_h / 2.0),
        image_size=image_size,
    )


def _draw_component_marker(draw, *, bbox: tuple[float, float, float, float], label: str, label_offset_y: int = 0) -> None:
    x1, y1, x2, y2 = bbox
    padding = 12
    x1 -= padding
    y1 -= padding
    x2 += padding
    y2 += padding
    center_x = (x1 + x2) / 2.0
    center_y = (y1 + y2) / 2.0
    crosshair = 28
    draw.line((center_x - crosshair, center_y, center_x + crosshair, center_y), fill=(255, 255, 255, 220), width=6)
    draw.line((center_x, center_y - crosshair, center_x, center_y + crosshair), fill=(255, 255, 255, 220), width=6)
    draw.line((center_x - crosshair, center_y, center_x + crosshair, center_y), fill=(255, 32, 32, 255), width=3)
    draw.line((center_x, center_y - crosshair, center_x, center_y + crosshair), fill=(255, 32, 32, 255), width=3)
    draw.ellipse((x1, y1, x2, y2), outline=(255, 255, 255, 220), width=7)
    draw.ellipse((x1, y1, x2, y2), outline=(255, 32, 32, 255), width=4)
    text_x = x2 + 10
    text_y = max(20, y1 - 10 + label_offset_y)
    draw.rectangle((text_x - 6, text_y - 4, text_x + (len(label) * 9), text_y + 20), fill=(255, 255, 255, 220))
    draw.text((text_x, text_y), label, fill=(255, 32, 32, 255))


def _draw_overlay_badges(draw, *, image_size: tuple[int, int], board_side: str | None, zoom_level: str) -> None:
    if board_side:
        side_label = f"{board_side.upper()} SIDE"
        side_box = (16, 16, 16 + (len(side_label) * 11), 44)
        draw.rectangle(side_box, fill=(255, 255, 255, 220))
        draw.text((22, 21), side_label, fill=(20, 20, 20, 255))
    zoom_label = {"overview": "1/3", "region": "2/3", "closeup": "3/3"}.get(zoom_level)
    if zoom_label:
        label_width = 16 + (len(zoom_label) * 10)
        right_edge = image_size[0] - 18
        draw.rectangle((right_edge - label_width, 16, right_edge, 44), fill=(255, 255, 255, 220))
        draw.text((right_edge - label_width + 6, 21), zoom_label, fill=(20, 20, 20, 255))


def annotate_components_image(
    input_path: str,
    output_path: str,
    labels: list[str],
    *,
    components: list[dict],
    parser_board=None,
    zoom_level: str = "overview",
) -> tuple[str, list[str]]:
    warnings: list[str] = []
    if Image is None:
        raise ScreenshotError("Pillow is not available for annotation")
    if not components or not parser_board:
        raise ScreenshotError("Parser metadata is required for multi-component annotation")
    path_in = Path(input_path)
    path_out = Path(output_path)
    img = Image.open(path_in).convert("RGBA")
    try:
        viewports = _board_viewports(str(path_in), parser_board)
    except ScreenshotError as exc:
        warnings.append(f"{exc}. Screenshot is unannotated.")
        path_out.parent.mkdir(parents=True, exist_ok=True)
        img.save(path_out)
        return str(path_out), warnings

    mapped: list[tuple[str, dict, tuple[float, float, float, float]]] = []
    for label, component in zip(labels, components):
        bbox = component.get("bbox")
        if not bbox:
            warnings.append(f"Component {label} is missing bbox metadata and was skipped.")
            continue
        mapped.append((label, component, _map_bbox(viewports, component, parser_board)))
    if not mapped:
        warnings.append("No component bounding boxes were available for multi-component annotation.")
        path_out.parent.mkdir(parents=True, exist_ok=True)
        img.save(path_out)
        return str(path_out), warnings

    union_bbox = (
        min(item[2][0] for item in mapped),
        min(item[2][1] for item in mapped),
        max(item[2][2] for item in mapped),
        max(item[2][3] for item in mapped),
    )
    sides = {item[1].get("board_side") for item in mapped if item[1].get("board_side")}
    reference_viewport = _select_viewport(mapped[0][1], parser_board, viewports) if len(sides) <= 1 else {
        "left": 0,
        "top": 0,
        "width": img.width,
        "height": img.height,
    }
    crop_box = _zoom_crop_box(
        zoom_level,
        mapped_bbox=union_bbox,
        viewport=reference_viewport,
        image_size=img.size,
    )
    scale_factor = 1
    offset_x = 0
    offset_y = 0
    if crop_box:
        offset_x, offset_y, _, _ = crop_box
        img = img.crop(crop_box)
        scale_factor = REGION_SCALE if zoom_level == "region" else CLOSEUP_SCALE
        resampling = getattr(Image, "Resampling", Image).LANCZOS
        img = img.resize((img.width * scale_factor, img.height * scale_factor), resampling)
    draw = ImageDraw.Draw(img)
    for index, (label, component, mapped_bbox) in enumerate(mapped):
        x1, y1, x2, y2 = mapped_bbox
        adjusted_bbox = (
            (x1 - offset_x) * scale_factor,
            (y1 - offset_y) * scale_factor,
            (x2 - offset_x) * scale_factor,
            (y2 - offset_y) * scale_factor,
        )
        _draw_component_marker(draw, bbox=adjusted_bbox, label=label, label_offset_y=index * 24)
    side_label = next(iter(sides)) if len(sides) == 1 else ("mixed" if sides else None)
    _draw_overlay_badges(draw, image_size=img.size, board_side=side_label, zoom_level=zoom_level)
    path_out.parent.mkdir(parents=True, exist_ok=True)
    img.save(path_out)
    return str(path_out), warnings


def annotate_image(
    input_path: str,
    output_path: str,
    label: str,
    *,
    component: dict | None = None,
    parser_board=None,
    transform: dict | None = None,
    zoom_level: str = "overview",
) -> tuple[str, list[str]]:
    warnings: list[str] = []
    path_in = Path(input_path)
    path_out = Path(output_path)
    if Image is None:
        raise ScreenshotError("Pillow is not available for annotation")
    img = Image.open(path_in).convert("RGBA")
    draw = ImageDraw.Draw(img)
    if component and parser_board:
        if not component.get("bbox"):
            warnings.append("Parser metadata is missing a bounding box; screenshot is unannotated.")
            path_out.parent.mkdir(parents=True, exist_ok=True)
            img.save(path_out)
            return str(path_out), warnings
        try:
            viewports = _board_viewports(str(path_in), parser_board)
        except ScreenshotError as exc:
            warnings.append(f"{exc}. Screenshot is unannotated.")
            path_out.parent.mkdir(parents=True, exist_ok=True)
            img.save(path_out)
            return str(path_out), warnings
        mapped_bbox = _map_bbox(viewports, component, parser_board)
        viewport = _select_viewport(component, parser_board, viewports)
        crop_box = _zoom_crop_box(
            zoom_level,
            mapped_bbox=mapped_bbox,
            viewport=viewport,
            image_size=img.size,
        )
        scale_factor = 1
        offset_x = 0
        offset_y = 0
        if crop_box:
            offset_x, offset_y, crop_right, crop_bottom = crop_box
            img = img.crop(crop_box)
            draw = ImageDraw.Draw(img)
            scale_factor = REGION_SCALE if zoom_level == "region" else CLOSEUP_SCALE
            resampling = getattr(Image, "Resampling", Image).LANCZOS
            img = img.resize((img.width * scale_factor, img.height * scale_factor), resampling)
            draw = ImageDraw.Draw(img)
        x1, y1, x2, y2 = mapped_bbox
        x1 = (x1 - offset_x) * scale_factor
        y1 = (y1 - offset_y) * scale_factor
        x2 = (x2 - offset_x) * scale_factor
        y2 = (y2 - offset_y) * scale_factor
        _draw_component_marker(draw, bbox=(x1, y1, x2, y2), label=label)
        _draw_overlay_badges(draw, image_size=img.size, board_side=component.get("board_side"), zoom_level=zoom_level)
    else:
        warnings.append("Parser metadata unavailable; screenshot is unannotated.")
    path_out.parent.mkdir(parents=True, exist_ok=True)
    img.save(path_out)
    return str(path_out), warnings

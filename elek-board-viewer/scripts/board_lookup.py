#!/usr/bin/env python3

from __future__ import annotations

import argparse
import fcntl
import json
import time

from brd_parser import find_component, load_board
from build_schematic_index import SCHEMATIC_INDEX_PATH, build_schematic_index
from build_board_index import build_index
from common import (
    INDEX_PATH,
    LOCK_PATH,
    LOCK_TIMEOUT_SECONDS,
    REQUEST_LOG_PATH,
    SCREENSHOTS_DIR,
    ensure_dirs,
    log_line,
    normalize_token,
    now_iso,
    timestamp_slug,
    ZOOM_LEVELS,
)
from flexbv_controller import (
    annotate_components_image,
    annotate_image,
    capture_window_png,
    load_board as controller_load_board,
)


ERROR_EXIT = 1


def ensure_index() -> dict:
    ensure_dirs()
    if not INDEX_PATH.exists():
        index = build_index()
        INDEX_PATH.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return index
    return json.loads(INDEX_PATH.read_text(encoding="utf-8"))


def ensure_schematic_index() -> dict:
    ensure_dirs()
    if not SCHEMATIC_INDEX_PATH.exists():
        schematic_index = build_schematic_index()
        SCHEMATIC_INDEX_PATH.write_text(json.dumps(schematic_index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return schematic_index
    return json.loads(SCHEMATIC_INDEX_PATH.read_text(encoding="utf-8"))


def schematic_refs(schematic_index: dict | None, model: str, revision: str, component: str) -> tuple[list[int], list[str]]:
    if not schematic_index:
        return [], []
    entry = (
        schematic_index.get("models", {})
        .get(model, {})
        .get("revisions", {})
        .get(revision, {})
        .get("components", {})
        .get(component, {})
    )
    return entry.get("pages", []), entry.get("images", [])


def resolve_board(index: dict, raw_board: str) -> tuple[str, str, dict]:
    value = raw_board.strip()
    requested_model = None
    requested_revision = None
    if ":" in value:
        requested_model, requested_revision = value.split(":", 1)
        requested_model = normalize_token(requested_model)
        requested_revision = normalize_token(requested_revision)
    token = normalize_token(value if not requested_model else requested_model)

    alias_map: dict[str, tuple[str, str]] = {}
    for model, model_entry in index["models"].items():
        default_revision = model_entry["default_revision"]
        alias_map[model] = (model, default_revision)
        for revision, revision_entry in model_entry["revisions"].items():
            for alias in revision_entry["aliases"]:
                alias_map[normalize_token(alias)] = (model, revision)

    if requested_model:
        if requested_model not in index["models"]:
            raise KeyError("board_not_found")
        model_entry = index["models"][requested_model]
        revision = requested_revision or model_entry["default_revision"]
        if revision not in model_entry["revisions"]:
            raise KeyError("board_not_found")
        return requested_model, revision, model_entry["revisions"][revision]

    if token not in alias_map:
        raise KeyError("board_not_found")
    model, revision = alias_map[token]
    return model, revision, index["models"][model]["revisions"][revision]


def acquire_lock() -> object:
    ensure_dirs()
    lock_file = LOCK_PATH.open("w", encoding="utf-8")
    deadline = time.time() + LOCK_TIMEOUT_SECONDS
    while time.time() < deadline:
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return lock_file
        except BlockingIOError:
            time.sleep(0.25)
    raise TimeoutError("lock_timeout")


def success_payload(
    *,
    model: str,
    revision: str,
    component: str,
    components: list[str] | None,
    entry: dict,
    parser_board,
    schematic_index: dict | None = None,
    screenshot_path: str | None = None,
    raw_screenshot_path: str | None = None,
    screenshots: dict | None = None,
    parser_status: str | None = None,
    warnings: list[str] | None = None,
) -> dict:
    comp = find_component(parser_board, component) if parser_board else None
    pins = comp.get("pins", []) if comp else []
    schematic_pages, schematic_images = schematic_refs(schematic_index, model, revision, component)
    return {
        "status": "ok",
        "board": model,
        "revision": revision,
        "chip": entry["chip"],
        "component": component,
        "components": components or [component],
        "board_path": entry["board_path"],
        "screenshot_path": screenshot_path,
        "raw_screenshot_path": raw_screenshot_path,
        "screenshots": screenshots or {},
        "parser_status": parser_status or (parser_board.parser_status if parser_board else "failed"),
        "board_side": comp.get("board_side") if comp else None,
        "pins": pins,
        "nets": comp.get("nets", []) if comp else [],
        "schematic_pages": schematic_pages,
        "schematic_images": schematic_images,
        "warnings": warnings or [],
    }


def error_payload(error_code: str, message: str, *, model: str | None = None, revision: str | None = None, component: str | None = None, warnings: list[str] | None = None) -> dict:
    return {
        "status": "error",
        "error_code": error_code,
        "message": message,
        "board": model,
        "revision": revision,
        "component": component,
        "warnings": warnings or [],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Lookup a board component and optionally capture a screenshot")
    parser.add_argument("board")
    parser.add_argument("component")
    parser.add_argument("--info-only", action="store_true")
    parser.add_argument("--no-annotate", action="store_true")
    parser.add_argument("--zoom", choices=ZOOM_LEVELS)
    args = parser.parse_args()

    ensure_dirs()
    started = time.time()
    model = revision = None
    warnings: list[str] = []
    request_status = "error"
    request_error_code = None

    try:
        index = ensure_index()
        schematic_index = ensure_schematic_index()
        model, revision, entry = resolve_board(index, args.board)
        parser_board = load_board(entry["board_path"])
        warnings.extend(parser_board.warnings)
        requested_components = [normalize_token(token) for token in args.component.split(",") if token.strip()]
        component = requested_components[0]
        component_entry = find_component(parser_board, component)

        if args.info_only:
            if len(requested_components) > 1:
                request_error_code = "component_not_found"
                payload = error_payload(
                    "component_not_found",
                    "Multi-component info-only mode is not implemented; request one component or use screenshot mode.",
                    model=model,
                    revision=revision,
                    component=args.component,
                    warnings=warnings,
                )
                print(json.dumps(payload))
                return ERROR_EXIT
            if not component_entry:
                request_error_code = "component_not_found"
                payload = error_payload(
                    "component_not_found",
                    f"Component {component} was not found on board {model} ({revision}, {entry['chip']})",
                    model=model,
                    revision=revision,
                    component=component,
                    warnings=warnings,
                )
                print(json.dumps(payload))
                return ERROR_EXIT
            payload = success_payload(
                model=model,
                revision=revision,
                component=component,
                components=requested_components,
                entry=entry,
                parser_board=parser_board,
                schematic_index=schematic_index,
                warnings=warnings,
            )
            request_status = "ok"
            print(json.dumps(payload))
            return 0

        if not component_entry:
            warnings.append(
                f"Component {component} was not found in parser output for board {model} ({revision}, {entry['chip']}); returning an unannotated board screenshot."
            )

        lock_handle = acquire_lock()
        try:
            controller_load_board(f"{model}:{revision}", entry["board_path"])
            stamp = timestamp_slug()
            raw_path = SCREENSHOTS_DIR / f"{stamp}_{model}_{revision}_{component}_raw.png"
            capture_window_png(str(raw_path))
            final_path = str(raw_path)
            screenshots: dict[str, str] = {}
            component_entries = [find_component(parser_board, name) for name in requested_components]
            found_components = [(name, entry) for name, entry in zip(requested_components, component_entries) if entry]
            missing_components = [name for name, entry in zip(requested_components, component_entries) if not entry]
            if missing_components:
                warnings.append(
                    f"Components missing from parser output: {', '.join(missing_components)}. Only parsed components will be annotated."
                )

            if not args.no_annotate and len(found_components) > 1:
                requested_levels = [args.zoom] if args.zoom else list(ZOOM_LEVELS)
                labels = [name for name, _ in found_components]
                entries = [entry for _, entry in found_components]
                for zoom_level in requested_levels:
                    annotated_path = SCREENSHOTS_DIR / f"{stamp}_{model}_{revision}_{'_'.join(labels)}_{zoom_level}.png"
                    rendered_path, annotate_warnings = annotate_components_image(
                        str(raw_path),
                        str(annotated_path),
                        labels,
                        components=entries,
                        parser_board=parser_board,
                        zoom_level=zoom_level,
                    )
                    screenshots[zoom_level] = rendered_path
                    warnings.extend(annotate_warnings)
                final_path = screenshots.get(args.zoom or "overview", str(raw_path))
            elif not args.no_annotate and component_entry:
                requested_levels = [args.zoom] if args.zoom else list(ZOOM_LEVELS)
                for zoom_level in requested_levels:
                    annotated_path = SCREENSHOTS_DIR / f"{stamp}_{model}_{revision}_{component}_{zoom_level}.png"
                    rendered_path, annotate_warnings = annotate_image(
                        str(raw_path),
                        str(annotated_path),
                        component,
                        component=component_entry,
                        parser_board=parser_board,
                        zoom_level=zoom_level,
                    )
                    screenshots[zoom_level] = rendered_path
                    warnings.extend(annotate_warnings)
                final_path = screenshots.get(args.zoom or "overview", str(raw_path))
            elif not component_entry:
                warnings.append("Annotation skipped because parser metadata for the requested component is unavailable.")
                if args.zoom:
                    warnings.append("Requested zoom-specific output is unavailable without parser metadata; returned the full-board raw screenshot instead.")
            elif args.no_annotate and args.zoom:
                warnings.append("Zoom-specific output is only generated in annotated mode; returned the full-board raw screenshot instead.")
            payload = success_payload(
                model=model,
                revision=revision,
                component=component,
                components=requested_components,
                entry=entry,
                parser_board=parser_board,
                schematic_index=schematic_index,
                screenshot_path=final_path,
                raw_screenshot_path=str(raw_path),
                screenshots=screenshots,
                parser_status="component_not_in_parser" if not component_entry else None,
                warnings=warnings,
            )
            request_status = "ok"
            print(json.dumps(payload))
            return 0
        finally:
            fcntl.flock(lock_handle.fileno(), fcntl.LOCK_UN)
            lock_handle.close()

    except TimeoutError:
        request_error_code = "lock_timeout"
        payload = error_payload(
            "lock_timeout",
            "Timed out waiting for exclusive access to the FlexBV runtime",
            model=model,
            revision=revision,
            component=normalize_token(args.component),
            warnings=warnings,
        )
        print(json.dumps(payload))
        return ERROR_EXIT
    except KeyError:
        request_error_code = "board_not_found"
        payload = error_payload(
            "board_not_found",
            f"Board {args.board} is not present in board_index.json",
            component=normalize_token(args.component),
            warnings=warnings,
        )
        print(json.dumps(payload))
        return ERROR_EXIT
    except Exception as exc:
        request_error_code = getattr(exc, "error_code", "runtime_unavailable")
        payload = error_payload(
            request_error_code,
            str(exc),
            model=model,
            revision=revision,
            component=normalize_token(args.component),
            warnings=warnings,
        )
        print(json.dumps(payload))
        return ERROR_EXIT
    finally:
        log_line(
            REQUEST_LOG_PATH,
            {
                "timestamp": now_iso(),
                "board": model,
                "revision": revision,
                "component": normalize_token(args.component),
                "requested_mode": "info-only" if args.info_only else "screenshot",
                "status": request_status,
                "error_code": request_error_code,
                "duration_ms": round((time.time() - started) * 1000, 2),
            },
        )


if __name__ == "__main__":
    raise SystemExit(main())

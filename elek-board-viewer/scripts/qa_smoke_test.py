#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PROJECT_ROOT / "scripts"


class SmokeTestFailure(RuntimeError):
    pass


def run_json(*args: str, expect_exit: int = 0) -> dict:
    result = subprocess.run(
        [sys.executable, *args],
        cwd=PROJECT_ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode != expect_exit:
        raise SmokeTestFailure(
            f"Command {' '.join(args)} exited {result.returncode}, expected {expect_exit}: {result.stderr or result.stdout}"
        )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SmokeTestFailure(f"Command {' '.join(args)} did not return JSON: {result.stdout}") from exc


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeTestFailure(message)


def main() -> int:
    index_payload = run_json(str(SCRIPTS_DIR / "build_board_index.py"))
    assert_true(index_payload["status"] == "ok", "build_board_index.py did not return status=ok")
    assert_true(index_payload["model_count"] == 13, "Unexpected model_count")
    assert_true(index_payload["board_revision_count"] == 17, "Unexpected board_revision_count")

    a2681_info = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "C8430", "--info-only")
    assert_true(a2681_info["status"] == "ok", "A2681 info lookup failed")
    assert_true(a2681_info["revision"] == "820-02536", "A2681 revision mismatch")

    u5200_info = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "U5200", "--info-only")
    assert_true(u5200_info["status"] == "ok", "A2681 U5200 info lookup failed")
    assert_true(u5200_info["board_side"] == "top", "A2681 U5200 board side mismatch")
    assert_true(u5200_info["schematic_pages"], "A2681 U5200 schematic pages were not populated")
    assert_true(u5200_info["schematic_images"], "A2681 U5200 schematic images were not populated")

    a2338_default = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2338", "C0610", "--info-only")
    assert_true(a2338_default["revision"] == "820-02773", "A2338 default revision did not resolve to M2")

    a2338_m1 = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2338:820-02020", "C0500", "--info-only")
    assert_true(a2338_m1["revision"] == "820-02020", "A2338 explicit revision did not resolve correctly")

    a2442_alias = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "820-02098", "BM0400", "--info-only")
    assert_true(a2442_alias["board"] == "A2442", "Board-number alias did not resolve to A2442")

    screenshot = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "C8430")
    assert_true(screenshot["status"] == "ok", "Screenshot lookup failed")
    annotated = Path(screenshot["screenshot_path"])
    raw = Path(screenshot["raw_screenshot_path"])
    screenshots = screenshot["screenshots"]
    assert_true(annotated.exists() and annotated.stat().st_size > 2048, "Annotated screenshot was not created")
    assert_true(raw.exists() and raw.stat().st_size > 2048, "Raw screenshot was not created")
    assert_true(set(screenshots) == {"overview", "region", "closeup"}, "Default screenshot lookup did not return all zoom levels")
    for zoom_level, path in screenshots.items():
        zoom_path = Path(path)
        assert_true(zoom_path.exists() and zoom_path.stat().st_size > 2048, f"{zoom_level} screenshot was not created")

    closeup_only = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "C8430", "--zoom", "closeup")
    assert_true(closeup_only["status"] == "ok", "Closeup-only lookup failed")
    assert_true(set(closeup_only["screenshots"]) == {"closeup"}, "Closeup-only lookup returned the wrong zoom set")
    closeup_path = Path(closeup_only["screenshots"]["closeup"])
    assert_true(closeup_path.exists() and closeup_path.stat().st_size > 2048, "Closeup-only screenshot was not created")

    multi_region = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "U5200,C8430", "--zoom", "region")
    assert_true(multi_region["status"] == "ok", "Multi-component region lookup failed")
    assert_true(multi_region["components"] == ["U5200", "C8430"], "Multi-component lookup returned the wrong component list")
    assert_true(set(multi_region["screenshots"]) == {"region"}, "Multi-component region lookup returned the wrong zoom set")
    multi_region_path = Path(multi_region["screenshots"]["region"])
    assert_true(multi_region_path.exists() and multi_region_path.stat().st_size > 2048, "Multi-component region screenshot was not created")

    missing_board = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "DOESNOTBOARD", "C8430", expect_exit=1)
    assert_true(missing_board["error_code"] == "board_not_found", "Missing board did not return board_not_found")

    missing_component = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "DOESNOTEXIST", "--info-only", expect_exit=1)
    assert_true(
        missing_component["error_code"] == "component_not_found",
        "Missing component did not return component_not_found",
    )

    parser_fallback = run_json(str(SCRIPTS_DIR / "board_lookup.py"), "A2681", "DOESNOTEXIST")
    assert_true(parser_fallback["status"] == "ok", "Parser fallback screenshot mode did not return status=ok")
    assert_true(
        parser_fallback["parser_status"] == "component_not_in_parser",
        "Parser fallback screenshot mode did not report component_not_in_parser",
    )
    assert_true(parser_fallback["screenshots"] == {}, "Parser fallback screenshot mode should not return zoom-specific annotated outputs")
    fallback_raw = Path(parser_fallback["raw_screenshot_path"])
    fallback_final = Path(parser_fallback["screenshot_path"])
    assert_true(fallback_raw.exists() and fallback_raw.stat().st_size > 2048, "Parser fallback raw screenshot was not created")
    assert_true(fallback_final.exists() and fallback_final.stat().st_size > 2048, "Parser fallback final screenshot was not created")

    print(json.dumps({"status": "ok", "qa": "smoke", "project_root": str(PROJECT_ROOT)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

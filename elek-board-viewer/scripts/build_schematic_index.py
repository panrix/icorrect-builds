#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from build_board_index import build_index, parse_folder
from common import DATA_DIR, INDEX_PATH, SCHEMATICS_DIR, ensure_dirs


SCHEMATIC_INDEX_PATH = DATA_DIR / "schematic_index.json"
COMPONENT_RE = re.compile(r"\b([A-Z]{1,4}_?\d{2,5}[A-Z0-9]*)\b")


def page_image_map(folder: Path) -> dict[int, str]:
    page_dir = folder / "pages"
    mapping: dict[int, str] = {}
    if not page_dir.exists():
        return mapping
    for path in sorted(page_dir.glob("*.png")):
        match = re.search(r"-(\d{1,3})\.png$", path.name)
        if not match:
            continue
        mapping[int(match.group(1))] = str(path.resolve())
    return mapping


def parse_page_index(path: Path) -> list[tuple[int, set[str]]]:
    hits: list[tuple[int, set[str]]] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line.startswith("|") or line.startswith("|---") or line.startswith("| Page") or line.startswith("| Sheet"):
            continue
        parts = [part.strip() for part in line.strip("|").split("|")]
        if not parts:
            continue
        page_field = parts[0]
        page_numbers = []
        for token in re.findall(r"\d{1,3}", page_field):
            page_numbers.append(int(token))
        if not page_numbers:
            continue
        component_refs = {match.upper() for match in COMPONENT_RE.findall(" ".join(parts[1:]))}
        if not component_refs:
            continue
        for page in page_numbers:
            hits.append((page, component_refs))
    return hits


def build_schematic_index() -> dict:
    ensure_dirs()
    if not INDEX_PATH.exists():
        index = build_index()
        INDEX_PATH.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    else:
        index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))

    models: dict[str, dict] = {}
    component_count = 0

    for folder in sorted(SCHEMATICS_DIR.iterdir()):
        if not folder.is_dir() or folder.name == "reference":
            continue
        page_index = folder / "page_index.md"
        if not page_index.exists():
            continue
        model, revision = parse_folder(folder)
        images = page_image_map(folder)
        component_map: dict[str, dict[str, list]] = {}
        for page, refs in parse_page_index(page_index):
            image_path = images.get(page)
            for ref in refs:
                entry = component_map.setdefault(ref, {"pages": [], "images": []})
                if page not in entry["pages"]:
                    entry["pages"].append(page)
                if image_path and image_path not in entry["images"]:
                    entry["images"].append(image_path)
        for entry in component_map.values():
            entry["pages"].sort()
        component_count += len(component_map)
        models.setdefault(model, {"revisions": {}})["revisions"][revision] = {
            "components": component_map,
            "page_index_path": str(page_index.resolve()),
        }

    return {
        "models": models,
        "metadata": {
            "source_root": str(SCHEMATICS_DIR.resolve()),
            "indexed_component_count": component_count,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build schematic_index.json from page_index.md files")
    parser.parse_args()
    ensure_dirs()
    payload = build_schematic_index()
    SCHEMATIC_INDEX_PATH.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "ok",
                "schematic_index_path": str(SCHEMATIC_INDEX_PATH),
                "indexed_component_count": payload["metadata"]["indexed_component_count"],
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

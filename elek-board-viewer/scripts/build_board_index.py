#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from common import INDEX_PATH, SCHEMATICS_DIR, ensure_dirs


REVISION_DEFAULTS = {
    "A2338": "820-02773",
    "A2442": "820-02098",
    "A2485": "820-02100",
    "A2779": "820-02841",
}

CHIP_OVERRIDES = {
    ("A2179", "820-01958"): "Intel",
    ("A2251", "820-01949-A"): "Intel",
    ("A2289", "820-01987"): "Intel",
    ("A2337", "820-02016"): "M1",
    ("A2338", "820-02020"): "M1",
    ("A2338", "820-02773"): "M2",
    ("A2442", "820-02098"): "M1 Pro",
    ("A2442", "820-02443"): "M1 Max",
    ("A2485", "820-02100"): "M1 Pro",
    ("A2485", "820-02382"): "M1 Max",
    ("A2681", "820-02536"): "M2",
    ("A2779", "820-02655"): "M3 Max",
    ("A2779", "820-02841"): "M3 Pro",
    ("A2780", "820-02652"): "M3 Pro/Max",
    ("A2918", "820-02757"): "M3",
    ("A3113", "820-03286"): "M4",
    ("A3114", "820-03285"): "M4 Pro",
}


def parse_folder(folder: Path) -> tuple[str, str]:
    model = folder.name.split()[0].upper()
    match = re.search(r"(820-\d+(?:-[A-Z])?)", folder.name.upper())
    if not match:
        raise ValueError(f"Unable to determine board number from '{folder.name}'")
    return model, match.group(1)


def infer_codename(board_path: Path, board_number: str) -> str | None:
    stem = board_path.stem.upper()
    return None if stem == board_number.upper() else stem


def chip_for(model: str, revision: str) -> str:
    try:
        return CHIP_OVERRIDES[(model, revision)]
    except KeyError as exc:
        raise ValueError(f"Missing chip mapping for {model}:{revision}") from exc


def build_index() -> dict:
    models: dict[str, dict] = {}
    alias_owner: dict[str, str] = {}

    for folder in sorted(SCHEMATICS_DIR.iterdir()):
        if not folder.is_dir() or folder.name == "reference":
            continue
        board_files = sorted(folder.glob("*.brd"))
        if len(board_files) != 1:
            raise ValueError(f"Expected exactly one .brd in {folder}, found {len(board_files)}")
        pdf_files = sorted(str(path.resolve()) for path in folder.glob("*.pdf"))
        model, revision = parse_folder(folder)
        board_path = board_files[0].resolve()
        codename = infer_codename(board_path, revision)
        aliases = [model, revision]
        if codename:
            aliases.append(codename)

        entry = {
            "board_path": str(board_path),
            "pdf_paths": pdf_files,
            "folder": str(folder.resolve()),
            "codename": codename,
            "chip": chip_for(model, revision),
            "aliases": aliases,
        }

        model_entry = models.setdefault(model, {"default_revision": revision, "revisions": {}})
        model_entry["revisions"][revision] = entry

    for model, model_entry in models.items():
        revisions = model_entry["revisions"]
        if model in REVISION_DEFAULTS:
            model_entry["default_revision"] = REVISION_DEFAULTS[model]
        elif len(revisions) == 1:
            model_entry["default_revision"] = next(iter(revisions))
        else:
            raise ValueError(f"Missing default revision for multi-revision model {model}")

        default_revision = model_entry["default_revision"]
        if default_revision not in revisions:
            raise ValueError(f"Default revision {default_revision} missing for {model}")

        for revision, revision_entry in revisions.items():
            for alias in revision_entry["aliases"]:
                owner = alias_owner.get(alias)
                if owner and owner != model:
                    raise ValueError(f"Alias collision: {alias} already owned by {owner}, saw {model}")
                alias_owner[alias] = model

    return {
        "models": dict(sorted(models.items())),
        "metadata": {
            "source_root": str(SCHEMATICS_DIR.resolve()),
            "board_revision_count": sum(len(item["revisions"]) for item in models.values()),
            "model_count": len(models),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build board_index.json from schematics inventory")
    parser.parse_args()
    ensure_dirs()
    index = build_index()
    INDEX_PATH.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "status": "ok",
                "index_path": str(INDEX_PATH),
                "model_count": index["metadata"]["model_count"],
                "board_revision_count": index["metadata"]["board_revision_count"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

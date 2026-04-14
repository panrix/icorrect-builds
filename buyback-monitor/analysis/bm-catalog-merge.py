#!/usr/bin/env python3
"""
Build a simple UUID -> model-name catalogue from V7 scraper output.

This replaces the old reader that expected a results[] array.
"""

import argparse
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = BASE_DIR / "data" / "sell-prices-latest.json"
DEFAULT_OUTPUT = BASE_DIR / "analysis" / "bm-catalog-merged.json"


def build_catalog(data: dict) -> dict:
    rows = []
    for model_name, model_data in sorted(data.get("models", {}).items()):
        rows.append({
            "model": model_name,
            "uuid": model_data.get("uuid"),
            "url": model_data.get("url"),
            "scraped": model_data.get("scraped", False),
            "derived_from": model_data.get("derived_from"),
        })
    return {
        "scraped_at": data.get("scraped_at"),
        "count": len(rows),
        "rows": rows,
    }


def main():
    parser = argparse.ArgumentParser(description="Merge BM catalogue data from V7 scraper output")
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    data = json.loads(input_path.read_text())
    merged = build_catalog(data)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(merged, indent=2))
    print(f"Wrote {merged['count']} rows to {output_path}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Extract net names from FlexBV's decoded memory.

FlexBV decodes encrypted BRD files into memory. This script:
1. Launches FlexBV with a BRD file
2. Waits for decode to complete
3. Reads the decoded pin→net data from process memory
4. Matches it to existing component/pin data by coordinates
5. Outputs a JSON file with net names populated

Usage:
    python3 extract_nets_from_flexbv.py <brd_path> [--output <path>]
    python3 extract_nets_from_flexbv.py --all
"""

import argparse
import json
import os
import re
import signal
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import FLEXBV_BIN, SCHEMATICS_DIR, DATA_DIR, ensure_dirs
from brd_parser import load_board, cache_path_for, CACHE_VERSION

NETS_DIR = DATA_DIR / "nets"


def extract_nets_from_memory(pid: int) -> list[dict]:
    """Read FlexBV process memory and extract pin→net records."""
    regions = []
    with open(f"/proc/{pid}/maps") as f:
        for line in f:
            parts = line.split()
            if "rw" in parts[1]:
                addr = parts[0].split("-")
                start, end = int(addr[0], 16), int(addr[1], 16)
                size = end - start
                if 100_000 < size < 200_000_000:
                    regions.append((start, end, size))

    # Pattern: numbers (coords/IDs) followed by a net name
    pin_pattern = re.compile(
        rb"(\d{1,5})\s+(\d{1,5})\s+(-?\d{1,5})\s+(\d{1,5})\s+([A-Z][A-Z0-9_]{2,50})"
    )

    records = []
    seen_region = False

    with open(f"/proc/{pid}/mem", "rb") as mem:
        for start, end, size in regions:
            try:
                mem.seek(start)
                chunk = mem.read(size)
                # Look for the structured region that has pin data
                # It contains known net names like PPBUS or PP3V8
                if b"PPBUS" not in chunk and b"PP3V8" not in chunk:
                    continue

                for m in pin_pattern.finditer(chunk):
                    v1, v2, v3, v4, net = m.groups()
                    net_str = net.decode("ascii", errors="replace")
                    # Filter out false positives (strings that aren't Apple net names)
                    if len(net_str) < 3:
                        continue
                    if net_str in ("PART_NAME", "PIN_NET", "BVRAW_FORMAT"):
                        continue
                    records.append(
                        {
                            "x": int(v1),
                            "y": int(v2),
                            "v3": int(v3),
                            "v4": int(v4),
                            "net": net_str,
                        }
                    )
                    seen_region = True
            except (OSError, PermissionError):
                pass

    return records


def match_nets_to_components(
    pin_records: list[dict], board_data: dict
) -> dict[str, dict]:
    """Match extracted net data to components by nearest-neighbor coordinate matching.

    Uses KD-tree for fast spatial lookup. Handles axis swaps by testing both
    orientations and picking the one with smaller median distance. Uses a
    tolerance of 200 units (covers ~98% of pins on boards with coordinate
    offsets between debug-parser and BRD-internal coordinate systems).
    """
    try:
        import numpy as np
        from scipy.spatial import cKDTree
    except ImportError:
        return _match_nets_fallback(pin_records, board_data)

    components = board_data.get("components", {})
    if not components:
        return {}

    total_pins = sum(len(c.get("pins", [])) for c in components.values())
    if not pin_records or total_pins == 0:
        return {"updated_pins": 0, "total_pins": total_pins}

    # Build cache pin list
    cache_pins = []
    for comp_data in components.values():
        for pin in comp_data.get("pins", []):
            cache_pins.append(pin)
    cache_xy = np.array([(p["x"], p["y"]) for p in cache_pins], dtype=np.float32)

    # Test both orientations
    mem_normal = np.array([(r["x"], r["y"]) for r in pin_records], dtype=np.float32)
    mem_swapped = np.array([(r["y"], r["x"]) for r in pin_records], dtype=np.float32)
    mem_nets = [r["net"] for r in pin_records]

    best_orientation = None
    best_median = float("inf")
    for label, mem_xy in [("normal", mem_normal), ("swapped", mem_swapped)]:
        tree = cKDTree(mem_xy)
        dists, _ = tree.query(cache_xy, k=1)
        med = float(np.median(dists))
        if med < best_median:
            best_median = med
            best_orientation = (label, mem_xy)

    label, mem_xy = best_orientation
    if label == "swapped":
        print(f"    Axis swap detected (median dist: {best_median:.1f})")

    # Build KD-tree and match with tolerance
    tree = cKDTree(mem_xy)
    max_tolerance = 200.0
    dists, idxs = tree.query(cache_xy, k=1)

    updated = 0
    for i, pin in enumerate(cache_pins):
        if dists[i] <= max_tolerance:
            pin["net"] = mem_nets[idxs[i]]
            updated += 1

    # Update component nets lists
    for comp_data in components.values():
        comp_nets = sorted(
            set(p.get("net") for p in comp_data.get("pins", []) if p.get("net"))
        )
        comp_data["nets"] = comp_nets

    pct = round(updated / max(total_pins, 1) * 100, 1)
    p90 = float(np.percentile(dists, 90))
    print(f"    KD-tree match: {updated}/{total_pins} ({pct}%), median dist={best_median:.1f}, p90={p90:.1f}")

    return {"updated_pins": updated, "total_pins": total_pins}


def _match_nets_fallback(
    pin_records: list[dict], board_data: dict
) -> dict[str, dict]:
    """Fallback matching without numpy/scipy — grid-based with tolerance."""
    components = board_data.get("components", {})
    total_pins = sum(len(c.get("pins", [])) for c in components.values())

    # Try both orientations with simple grid
    for swap in [False, True]:
        coord_to_net = {}
        for r in pin_records:
            x, y = (r["y"], r["x"]) if swap else (r["x"], r["y"])
            coord_to_net[(int(x), int(y))] = r["net"]

        updated = 0
        for comp_data in components.values():
            for pin in comp_data.get("pins", []):
                px, py = int(pin["x"]), int(pin["y"])
                net = None
                for dx in range(-3, 4):
                    for dy in range(-3, 4):
                        net = coord_to_net.get((px + dx, py + dy))
                        if net:
                            break
                    if net:
                        break
                if net:
                    pin["net"] = net
                    updated += 1
        if updated > total_pins * 0.5:
            break

    for comp_data in components.values():
        comp_data["nets"] = sorted(
            set(p.get("net") for p in comp_data.get("pins", []) if p.get("net"))
        )

    return {"updated_pins": updated, "total_pins": total_pins}


def run_extraction(brd_path: str, output_path: str | None = None) -> dict:
    """Full extraction pipeline for one board."""
    brd_path = str(Path(brd_path).resolve())
    board_name = Path(brd_path).parent.name

    print(f"  Loading board data for {board_name}...")
    board = load_board(brd_path)

    print(f"  Launching FlexBV...")
    # Use existing display :99 if available, otherwise start temp Xvfb
    display = ":99"
    xvfb_proc = None

    # Check if :99 is running
    try:
        subprocess.run(
            ["xdpyinfo", "-display", display],
            capture_output=True,
            timeout=3,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        display = ":97"
        xvfb_proc = subprocess.Popen(
            ["Xvfb", display, "-screen", "0", "1920x1080x24"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(1)

    env = os.environ.copy()
    env["DISPLAY"] = display
    env["HOME"] = str(Path.home())

    flexbv = subprocess.Popen(
        [str(FLEXBV_BIN), "-x", "1920", "-y", "1080", "-i", brd_path],
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )

    # Wait for FlexBV to decode the BRD (typically 3-6 seconds)
    time.sleep(7)

    if flexbv.poll() is not None:
        print(f"  ERROR: FlexBV exited early (code {flexbv.returncode})")
        if xvfb_proc:
            xvfb_proc.terminate()
        return {"status": "error", "error": "FlexBV exited early"}

    print(f"  Reading memory (PID {flexbv.pid})...")
    try:
        records = extract_nets_from_memory(flexbv.pid)
    except Exception as e:
        print(f"  ERROR reading memory: {e}")
        records = []
    finally:
        os.killpg(flexbv.pid, signal.SIGTERM)
        try:
            flexbv.wait(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(flexbv.pid, signal.SIGKILL)
            flexbv.wait()
        if xvfb_proc:
            xvfb_proc.terminate()

    if not records:
        print(f"  ERROR: No net records extracted")
        return {"status": "error", "error": "No records extracted"}

    unique_nets = sorted(set(r["net"] for r in records))
    print(f"  Extracted {len(records)} pin records, {len(unique_nets)} unique nets")

    # Match to component data
    cache_file = cache_path_for(brd_path)
    if cache_file.exists():
        cache_data = json.loads(cache_file.read_text())
    else:
        cache_data = {
            "components": board.components,
            "board_width": board.board_width,
            "board_height": board.board_height,
        }

    stats = match_nets_to_components(records, cache_data)
    print(
        f"  Matched {stats['updated_pins']}/{stats['total_pins']} pins to nets"
    )

    # Update the cache with net data
    cache_data["cache_version"] = CACHE_VERSION + 1  # Force cache refresh
    cache_data["net_extraction"] = {
        "method": "flexbv_memory_read",
        "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_records": len(records),
        "unique_nets": len(unique_nets),
        "matched_pins": stats["updated_pins"],
        "total_pins": stats["total_pins"],
        "coverage_pct": round(
            stats["updated_pins"] / max(stats["total_pins"], 1) * 100, 1
        ),
    }
    cache_file.write_text(
        json.dumps(cache_data, indent=2, sort_keys=True) + "\n"
    )
    print(f"  Updated cache: {cache_file}")

    # Also save raw net data
    NETS_DIR.mkdir(parents=True, exist_ok=True)
    net_file = NETS_DIR / f"{board_name.replace(' ', '_')}_nets.json"
    net_output = {
        "board": board_name,
        "brd_path": brd_path,
        "unique_nets": unique_nets,
        "net_count": len(unique_nets),
        "pin_records": len(records),
    }
    if output_path:
        net_file = Path(output_path)
    net_file.write_text(json.dumps(net_output, indent=2) + "\n")
    print(f"  Saved net data: {net_file}")

    return {
        "status": "ok",
        "board": board_name,
        "records": len(records),
        "unique_nets": len(unique_nets),
        "matched_pins": stats["updated_pins"],
        "total_pins": stats["total_pins"],
        "coverage_pct": cache_data["net_extraction"]["coverage_pct"],
    }


def run_all():
    """Extract nets for all boards."""
    ensure_dirs()
    results = []

    for folder in sorted(SCHEMATICS_DIR.iterdir()):
        if not folder.is_dir() or folder.name in ("reference", "INDEX.md"):
            continue
        brd_files = list(folder.glob("*.brd"))
        if not brd_files:
            continue
        brd_path = str(brd_files[0])
        print(f"\n{'='*60}")
        print(f"Processing: {folder.name}")
        result = run_extraction(brd_path)
        results.append(result)
        # Small delay between boards to let FlexBV clean up
        time.sleep(2)

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for r in results:
        if r["status"] == "ok":
            print(
                f"  {r['board']}: {r['unique_nets']} nets, "
                f"{r['matched_pins']}/{r['total_pins']} pins matched "
                f"({r['coverage_pct']}%)"
            )
        else:
            print(f"  {r.get('board', '?')}: ERROR — {r.get('error', '?')}")

    return results


def main():
    parser = argparse.ArgumentParser(description="Extract nets from FlexBV memory")
    parser.add_argument("brd_path", nargs="?", help="Path to BRD file")
    parser.add_argument("--output", "-o", help="Output JSON path")
    parser.add_argument("--all", action="store_true", help="Process all boards")
    args = parser.parse_args()

    if args.all:
        run_all()
    elif args.brd_path:
        result = run_extraction(args.brd_path, args.output)
        print(json.dumps(result, indent=2))
    else:
        parser.print_help()
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

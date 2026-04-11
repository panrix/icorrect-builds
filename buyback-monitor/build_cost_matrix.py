#!/usr/bin/env python3
"""
Build per-grade, per-model cost matrix from filtered parts data.
Uses Nancy's confirmed LCD prices (not Parts board supply_price for screens).

Output:
  - parts-cost-analysis-v2.json   (full analysis)
  - PARTS-COST-ANALYSIS-V2.md     (human-readable tables)
  - parts-cost-lookup.json        (simple model.grade -> cost lookup)
"""

import json
import math
from collections import defaultdict
from datetime import date

INPUT = "/home/ricky/.openclaw/agents/main/workspace/data/buyback/parts-raw-data-filtered.json"
OUT_DIR = "/home/ricky/.openclaw/agents/main/workspace/data/buyback"

SCREEN_COSTS = {
    "A2337": 98, "A2338": 154, "A2442": 206, "A2779": 206, "A2918": 206,
    "A2992": 206, "A3112": 206, "A3185": 206, "A3401": 206,
    "A2485": 199, "A2780": 199, "A2991": 199, "A3186": 199, "A3403": 199,
    "A2681": 90, "A3113": 90, "A3240": 90, "A2941": 90, "A3114": 90, "A3241": 90,
    "A2179": 45, "A1932": 45,
    "A2289": 70, "A2251": 70,
    "A2141": 140, "A2159": 45, "A1989": 45, "A1990": 140,
}

# Model families for fallback when < 5 devices
MODEL_FAMILIES = {
    "MBP14": ["A2442", "A2779", "A2918", "A2992", "A3112", "A3185", "A3401"],
    "MBP16": ["A2485", "A2780", "A2991", "A3186", "A3403"],
    "MBP16_OLD": ["A2141"],
    "MBP15_OLD": ["A1990"],
    "MBP13_M": ["A2338"],
    "MBP13_OLD": ["A2289", "A2251", "A2159", "A1989"],
    "MBA13_M": ["A2337", "A2681", "A3113", "A3240"],
    "MBA15_M": ["A2941", "A3114", "A3241"],
    "MBA13_OLD": ["A2179", "A1932"],
}

# Reverse lookup: model -> family name
MODEL_TO_FAMILY = {}
for fam, models in MODEL_FAMILIES.items():
    for m in models:
        MODEL_TO_FAMILY[m] = fam

LABOUR_RATE = 15  # £/hr

MIN_DEVICES = 5


def is_screen_part(name):
    n = name.lower()
    return ("lcd" in n or "screen" in n) and "screen bezel" not in n


def is_logic_board(name):
    n = name.lower()
    return "logic" in n or "board repair" in n


def r(val, dp=0):
    """Round helper."""
    if dp == 0:
        return int(round(val))
    return round(val, dp)


def load_data():
    with open(INPUT) as f:
        data = json.load(f)
    return data["devices"]


def analyze_func_crack(devices):
    """Analyze FUNC_CRACK devices."""
    by_model = defaultdict(list)
    for d in devices:
        if d["trade_in_grade"] == "FUNC_CRACK":
            by_model[d["model"]].append(d)

    results = {}
    for model, devs in sorted(by_model.items()):
        total = len(devs)
        screen_cost = SCREEN_COSTS.get(model, 0)

        screen_only = 0
        extra_repairs = 0
        extra_costs = []  # cost of non-screen parts for devices with extra repairs
        rrd_hours = []

        for d in devs:
            rrd_hours.append(d.get("rrd_hours", 0) or 0)
            parts = d.get("parts", [])

            screen_parts = [p for p in parts if is_screen_part(p["name"])]
            non_screen_parts = [p for p in parts if not is_screen_part(p["name"])]

            if len(non_screen_parts) == 0:
                # Screen only (or no parts at all - still just a screen swap)
                screen_only += 1
            else:
                extra_repairs += 1
                extra_cost = sum(p.get("supply_price", 0) or 0 for p in non_screen_parts)
                extra_costs.append(extra_cost)

        avg_extra = sum(extra_costs) / len(extra_costs) if extra_costs else 0
        avg_rrd = sum(rrd_hours) / len(rrd_hours) if rrd_hours else 0
        pct_screen_only = (screen_only / total * 100) if total > 0 else 0
        extra_pct = (extra_repairs / total) if total > 0 else 0

        recommended = screen_cost + r(extra_pct * avg_extra)

        results[model] = {
            "total": total,
            "screen_cost": screen_cost,
            "screen_only": screen_only,
            "extra_repairs": extra_repairs,
            "pct_screen_only": r(pct_screen_only),
            "avg_extra_parts_cost": r(avg_extra),
            "avg_rrd_hours": r(avg_rrd, 1),
            "recommended_cost": recommended,
        }

    return results


def analyze_nonfunc_used(devices):
    """Analyze NONFUNC_USED devices."""
    by_model = defaultdict(list)
    for d in devices:
        if d["trade_in_grade"] == "NONFUNC_USED":
            by_model[d["model"]].append(d)

    results = {}
    for model, devs in sorted(by_model.items()):
        total = len(devs)
        parts_counts = []
        parts_costs = []
        rrd_hours = []
        logic_board_count = 0

        for d in devs:
            rrd_hours.append(d.get("rrd_hours", 0) or 0)
            parts = d.get("parts", [])
            parts_counts.append(len(parts))
            cost = sum(p.get("supply_price", 0) or 0 for p in parts)
            parts_costs.append(cost)

            if any(is_logic_board(p["name"]) for p in parts):
                logic_board_count += 1

        avg_count = sum(parts_counts) / len(parts_counts) if parts_counts else 0
        avg_cost = sum(parts_costs) / len(parts_costs) if parts_costs else 0
        avg_rrd = sum(rrd_hours) / len(rrd_hours) if rrd_hours else 0
        pct_logic = (logic_board_count / total * 100) if total > 0 else 0

        results[model] = {
            "total": total,
            "avg_parts_count": r(avg_count, 1),
            "avg_parts_cost": r(avg_cost),
            "avg_rrd_hours": r(avg_rrd, 1),
            "pct_logic_board": r(pct_logic),
            "recommended_cost": r(avg_cost),
        }

    return results


def analyze_nonfunc_crack(devices):
    """Analyze NONFUNC_CRACK devices."""
    by_model = defaultdict(list)
    for d in devices:
        if d["trade_in_grade"] == "NONFUNC_CRACK":
            by_model[d["model"]].append(d)

    results = {}
    for model, devs in sorted(by_model.items()):
        total = len(devs)
        screen_cost = SCREEN_COSTS.get(model, 0)

        needed_screen = 0
        no_screen = 0
        costs_with_screen = []  # Nancy screen + other parts cost
        costs_no_screen = []    # board-only parts cost
        rrd_hours = []

        for d in devs:
            rrd_hours.append(d.get("rrd_hours", 0) or 0)
            parts = d.get("parts", [])

            has_screen = any(is_screen_part(p["name"]) for p in parts)
            non_screen_parts = [p for p in parts if not is_screen_part(p["name"])]
            other_cost = sum(p.get("supply_price", 0) or 0 for p in non_screen_parts)

            if has_screen:
                needed_screen += 1
                # Use Nancy's screen price + actual other parts cost
                costs_with_screen.append(screen_cost + other_cost)
            else:
                no_screen += 1
                # All parts cost (no screen)
                all_cost = sum(p.get("supply_price", 0) or 0 for p in parts)
                costs_no_screen.append(all_cost)

        avg_with = sum(costs_with_screen) / len(costs_with_screen) if costs_with_screen else 0
        avg_without = sum(costs_no_screen) / len(costs_no_screen) if costs_no_screen else 0
        avg_rrd = sum(rrd_hours) / len(rrd_hours) if rrd_hours else 0
        pct_screen = (needed_screen / total) if total > 0 else 0
        pct_no = (no_screen / total) if total > 0 else 0

        recommended = r(pct_screen * avg_with + pct_no * avg_without)

        results[model] = {
            "total": total,
            "needed_screen": needed_screen,
            "no_screen": no_screen,
            "pct_needed_screen": r(pct_screen * 100),
            "avg_parts_cost_with_screen": r(avg_with),
            "avg_parts_cost_no_screen": r(avg_without),
            "avg_rrd_hours": r(avg_rrd, 1),
            "recommended_cost": recommended,
        }

    return results


def build_lookup(fc, nfu, nfc):
    """Build simple model.grade -> recommended_cost lookup with family fallback.

    Priority: model with >=5 devices > family avg (from models with >=5) > model with <5 devices > family avg (any) > screen cost / 0
    """
    grade_data = {"FUNC_CRACK": fc, "NONFUNC_USED": nfu, "NONFUNC_CRACK": nfc}

    # Compute family averages: strong (>=5 devices) and weak (any data)
    family_avgs_strong = {g: {} for g in grade_data}
    family_avgs_weak = {g: {} for g in grade_data}

    for fam_name, fam_models in MODEL_FAMILIES.items():
        for grade, data in grade_data.items():
            strong = [data[m]["recommended_cost"] for m in fam_models if m in data and data[m]["total"] >= MIN_DEVICES]
            weak = [data[m]["recommended_cost"] for m in fam_models if m in data and data[m]["total"] >= 2]
            if strong:
                family_avgs_strong[grade][fam_name] = r(sum(strong) / len(strong))
            if weak:
                family_avgs_weak[grade][fam_name] = r(sum(weak) / len(weak))

    lookup = {}
    all_models = sorted(SCREEN_COSTS.keys())

    for model in all_models:
        family = MODEL_TO_FAMILY.get(model)

        for grade, data in grade_data.items():
            key = f"{model}.{grade}"

            if model in data and data[model]["total"] >= MIN_DEVICES:
                # Strong: enough data
                lookup[key] = data[model]["recommended_cost"]
            elif family and family in family_avgs_strong[grade]:
                # Family avg from strong models
                lookup[key] = family_avgs_strong[grade][family]
            elif model in data and data[model]["total"] >= 2:
                # Weak: some data (2+), use it
                lookup[key] = data[model]["recommended_cost"]
            elif family and family in family_avgs_weak[grade]:
                # Family avg from any data
                lookup[key] = family_avgs_weak[grade][family]
            elif grade == "FUNC_CRACK":
                # Last resort for FC: just the screen cost
                lookup[key] = SCREEN_COSTS.get(model, 0)
            else:
                lookup[key] = 0

    return lookup


def generate_markdown(fc, nfu, nfc, lookup):
    """Generate human-readable markdown report."""
    today = date.today().isoformat()
    lines = [
        f"# Parts Cost Analysis v2",
        f"Generated: {today}",
        f"",
        f"Labour rate: £15/hr (shown for reference; recommended_cost is parts only)",
        f"Screen prices: Nancy's current prices (not Parts board supply_price)",
        f"",
        f"---",
        f"",
        f"## FUNC_CRACK",
        f"",
        f"Every device gets a screen. Some also need extra repairs.",
        f"",
        f"| Model | N | Screen £ | Screen Only | Extra | % Screen Only | Avg Extra £ | Avg RR&D hrs | Rec Cost £ |",
        f"|-------|---|----------|-------------|-------|---------------|-------------|--------------|------------|",
    ]

    for model in sorted(fc.keys()):
        d = fc[model]
        lines.append(
            f"| {model} | {d['total']} | {d['screen_cost']} | {d['screen_only']} | {d['extra_repairs']} | "
            f"{d['pct_screen_only']}% | {d['avg_extra_parts_cost']} | {d['avg_rrd_hours']} | **{d['recommended_cost']}** |"
        )

    fc_total = sum(d["total"] for d in fc.values())
    lines.append(f"")
    lines.append(f"Total FUNC_CRACK devices: {fc_total}")

    lines += [
        f"",
        f"---",
        f"",
        f"## NONFUNC_USED",
        f"",
        f"Board-level repairs, no screen damage.",
        f"",
        f"| Model | N | Avg Parts | Avg Parts £ | Avg RR&D hrs | % Logic Board | Avg Total £ (parts+labour) | Rec Cost £ |",
        f"|-------|---|-----------|-------------|--------------|---------------|---------------------------|------------|",
    ]

    for model in sorted(nfu.keys()):
        d = nfu[model]
        avg_total = d["avg_parts_cost"] + r(d["avg_rrd_hours"] * LABOUR_RATE)
        lines.append(
            f"| {model} | {d['total']} | {d['avg_parts_count']} | {d['avg_parts_cost']} | {d['avg_rrd_hours']} | "
            f"{d['pct_logic_board']}% | {avg_total} | **{d['recommended_cost']}** |"
        )

    nfu_total = sum(d["total"] for d in nfu.values())
    lines.append(f"")
    lines.append(f"Total NONFUNC_USED devices: {nfu_total}")

    lines += [
        f"",
        f"---",
        f"",
        f"## NONFUNC_CRACK",
        f"",
        f"Non-functional + cracked screen. Surprise: many don't actually need a screen replacement.",
        f"",
        f"| Model | N | Needed Screen | No Screen | % Screen | Avg £ w/Screen | Avg £ no Screen | Avg RR&D hrs | Rec Cost £ |",
        f"|-------|---|---------------|-----------|----------|----------------|-----------------|--------------|------------|",
    ]

    for model in sorted(nfc.keys()):
        d = nfc[model]
        lines.append(
            f"| {model} | {d['total']} | {d['needed_screen']} | {d['no_screen']} | {d['pct_needed_screen']}% | "
            f"{d['avg_parts_cost_with_screen']} | {d['avg_parts_cost_no_screen']} | {d['avg_rrd_hours']} | **{d['recommended_cost']}** |"
        )

    nfc_total = sum(d["total"] for d in nfc.values())
    lines.append(f"")
    lines.append(f"Total NONFUNC_CRACK devices: {nfc_total}")

    lines += [
        f"",
        f"---",
        f"",
        f"## Parts Cost Lookup (for buy box monitor)",
        f"",
        f"Models with <5 devices use family average. Entries marked with * are family fallbacks.",
        f"",
        f"| Key | Rec Cost £ |",
        f"|-----|------------|",
    ]

    for key in sorted(lookup.keys()):
        lines.append(f"| {key} | {lookup[key]} |")

    lines.append(f"")
    return "\n".join(lines)


def main():
    devices = load_data()
    print(f"Loaded {len(devices)} devices")

    # Count by grade
    grades = defaultdict(int)
    for d in devices:
        grades[d["trade_in_grade"]] += 1
    for g, c in sorted(grades.items()):
        print(f"  {g}: {c}")

    fc = analyze_func_crack(devices)
    nfu = analyze_nonfunc_used(devices)
    nfc = analyze_nonfunc_crack(devices)

    print(f"\nFUNC_CRACK models: {len(fc)}")
    print(f"NONFUNC_USED models: {len(nfu)}")
    print(f"NONFUNC_CRACK models: {len(nfc)}")

    lookup = build_lookup(fc, nfu, nfc)
    print(f"Lookup entries: {len(lookup)}")

    # Save JSON analysis
    analysis = {
        "generated": date.today().isoformat(),
        "screen_costs": SCREEN_COSTS,
        "func_crack": fc,
        "nonfunc_used": nfu,
        "nonfunc_crack": nfc,
    }

    with open(f"{OUT_DIR}/parts-cost-analysis-v2.json", "w") as f:
        json.dump(analysis, f, indent=2)
    print(f"Saved parts-cost-analysis-v2.json")

    # Save markdown
    md = generate_markdown(fc, nfu, nfc, lookup)
    with open(f"{OUT_DIR}/PARTS-COST-ANALYSIS-V2.md", "w") as f:
        f.write(md)
    print(f"Saved PARTS-COST-ANALYSIS-V2.md")

    # Save lookup
    with open(f"{OUT_DIR}/parts-cost-lookup.json", "w") as f:
        json.dump(lookup, f, indent=2)
    print(f"Saved parts-cost-lookup.json")

    # Print summary
    print(f"\n=== Summary ===")
    print(f"\nFUNC_CRACK recommended costs:")
    for m in sorted(fc.keys()):
        print(f"  {m}: £{fc[m]['recommended_cost']} (screen £{fc[m]['screen_cost']}, {fc[m]['total']} devices)")

    print(f"\nNONFUNC_USED recommended costs:")
    for m in sorted(nfu.keys()):
        print(f"  {m}: £{nfu[m]['recommended_cost']} ({nfu[m]['total']} devices, {nfu[m]['pct_logic_board']}% logic board)")

    print(f"\nNONFUNC_CRACK recommended costs:")
    for m in sorted(nfc.keys()):
        print(f"  {m}: £{nfc[m]['recommended_cost']} ({nfc[m]['total']} devices, {nfc[m]['pct_needed_screen']}% needed screen)")


if __name__ == "__main__":
    main()

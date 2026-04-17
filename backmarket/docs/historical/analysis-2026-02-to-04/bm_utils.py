import os
import re
import time
import json
import subprocess


def load_env(path="/home/ricky/config/api-keys/.env"):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip("'\"")
    return env


def bm_api_call(method, endpoint, data=None, env=None):
    if env is None:
        env = load_env()
    base = env.get("BACKMARKET_API_BASE", "https://www.backmarket.co.uk")
    url = f"{base}/{endpoint.lstrip('/')}"
    cmd = ["curl", "-s", "-X", method, url,
           "-H", f"Authorization: {env['BACKMARKET_API_AUTH']}",
           "-H", f"Accept-Language: {env['BACKMARKET_API_LANG']}",
           "-H", f"User-Agent: {env['BACKMARKET_API_UA']}",
           "-H", "Accept: application/json"]
    if data is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"curl failed: {r.stderr}")
    return json.loads(r.stdout)


def monday_query(query, env=None, retries=3):
    if env is None:
        env = load_env()
    token = env.get("MONDAY_APP_TOKEN", "")
    for attempt in range(retries):
        r = subprocess.run(
            ["curl", "-s", "-X", "POST", "https://api.monday.com/v2",
             "-H", "Content-Type: application/json",
             "-H", f"Authorization: {token}",
             "-H", "API-Version: 2024-10",
             "-d", json.dumps({"query": query})],
            capture_output=True, text=True)
        try:
            result = json.loads(r.stdout)
            if "errors" in result and "rate" in str(result["errors"]).lower():
                time.sleep(10)
                continue
            return result
        except json.JSONDecodeError:
            if attempt < retries - 1:
                time.sleep(2)
    return {"data": None}


def get_min_net_tier(sku):
    s = sku.upper()
    parts = s.split(".")

    is_mbp_14_or_16 = bool(re.match(r"MBP1[46]\.", s))

    has_m2_plus = bool(re.search(r"\.M[2-9]", s))
    has_m1_pro_max = bool(re.search(r"\.M1(PRO|MAX)", s))

    if is_mbp_14_or_16 or has_m2_plus or has_m1_pro_max:
        return 200
    return 100


def calc_max_offer(avg_sale, bm_fee, avg_tax, parts_75th, avg_labour, shipping, min_net_target):
    result = avg_sale - bm_fee - avg_tax - parts_75th - avg_labour - shipping - min_net_target
    return max(0, round(result, 2))

#!/usr/bin/env python3
"""Diagnostic: dump raw grade picker data from multiple MBP13 2020 M1 pages."""
import os, sys, re, json, subprocess, urllib.parse
from dotenv import load_dotenv

load_dotenv('/home/ricky/config/api-keys/.env')
token = os.environ.get('MASSIVE_TOKEN')

PAGES = {
    "8GB/256GB (base)": "https://www.backmarket.co.uk/en-gb/p/macbook-pro-13-inch-2020-apple-m1-8-core-and-8-core-gpu-8gb-ram-ssd-256gb-qwerty-english/8948b82c-f746-4be0-a8b0-0758b1dc4acc",
    "16GB/1TB": "https://www.backmarket.co.uk/en-gb/p/macbook-pro-2020-13-inch-with-m1-8-core-and-8-core-gpu-16gb-ram-ssd-1tb-qwerty-english-us/313b776d-eab9-438a-bffd-c139a86f67b4",
    "16GB/2TB": "https://www.backmarket.co.uk/en-gb/p/macbook-pro-2020-13-inch-with-m1-8-core-and-8-core-gpu-16gb-ram-ssd-2tb-qwerty-english-us/2bc8a185-15f9-4e3e-a21b-420b928528c3",
}

def fetch(url, delay=5):
    encoded = urllib.parse.quote(url, safe='')
    cmd = f'curl -s --max-time 90 -H "Authorization: Bearer {token}" "https://unblocker.joinmassive.com/browser?url={encoded}&country=gb&delay={delay}&expiration=0"'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.stdout

def resolve(arr, idx):
    if isinstance(idx, int) and 0 <= idx < len(arr):
        val = arr[idx]
        if val == 17:
            return None
        return val
    return idx

for name, url in PAGES.items():
    print(f"\n{'='*70}")
    print(f"PAGE: {name}")
    print(f"URL: {url}")
    print(f"{'='*70}")
    
    html = fetch(url)
    if not html or len(html) < 1000:
        print("  FAILED: empty response")
        continue
    
    match = re.search(r'<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not match:
        print("  FAILED: no Nuxt payload")
        continue
    
    arr = json.loads(match.group(1))
    print(f"  Nuxt array length: {len(arr)}")
    
    # Find ALL picker-like dicts
    grade_names = {'Fair', 'Good', 'Excellent', 'Premium'}
    grade_entries = []
    
    for i, val in enumerate(arr):
        if not isinstance(val, dict):
            continue
        if 'label' not in val or 'price' not in val:
            continue
        if 'productId' not in val or 'available' not in val:
            continue
        # Skip cross-sell items
        if 'listingId' in val or 'brand' in val:
            continue
        
        label = resolve(arr, val['label'])
        if label not in grade_names:
            continue
        
        # Get price
        price_ref = val['price']
        amount = None
        if isinstance(price_ref, int) and price_ref < len(arr):
            price_obj = resolve(arr, price_ref)
            if isinstance(price_obj, dict) and 'amount' in price_obj:
                amount = resolve(arr, price_obj['amount'])
        
        prod_id = resolve(arr, val['productId'])
        available = resolve(arr, val['available'])
        selected = resolve(arr, val.get('selected', -1))
        slug = resolve(arr, val.get('slug', -1))
        
        grade_entries.append({
            'index': i,
            'label': label,
            'price': float(amount) if amount else None,
            'product_id': prod_id,
            'available': bool(available),
            'selected': bool(selected),
            'slug': str(slug)[:80] if slug else None,
            'raw_keys': list(val.keys()),
        })
    
    print(f"\n  Found {len(grade_entries)} grade picker entries:")
    for g in grade_entries:
        sel = " [SELECTED]" if g['selected'] else ""
        print(f"    [{g['index']:4d}] {g['label']:12s} £{g['price'] or 0:>8.2f}  pid={str(g['product_id'])[:12]}...  avail={g['available']}{sel}")
        if g['slug']:
            print(f"           slug: ...{g['slug'][-50:]}")
    
    # Also print what the storage picker shows (Fair = storage picker price)
    print(f"\n  Storage picker entries:")
    for i, val in enumerate(arr):
        if not isinstance(val, dict):
            continue
        if not all(k in val for k in ['label', 'price', 'productId', 'available']):
            continue
        if 'listingId' in val or 'brand' in val:
            continue
        label = resolve(arr, val['label'])
        if not isinstance(label, str):
            continue
        if any(x in label for x in ['128', '256', '512', '1000', '2000', 'TB']):
            price_ref = val['price']
            amount = None
            if isinstance(price_ref, int) and price_ref < len(arr):
                price_obj = resolve(arr, price_ref)
                if isinstance(price_obj, dict) and 'amount' in price_obj:
                    amount = resolve(arr, price_obj['amount'])
            prod_id = resolve(arr, val['productId'])
            selected = resolve(arr, val.get('selected', -1))
            sel = " [SELECTED]" if selected else ""
            print(f"    [{i:4d}] {label:>10s} £{float(amount) if amount else 0:>8.2f}  pid={str(prod_id)[:12]}...{sel}")

print("\n\nDONE")

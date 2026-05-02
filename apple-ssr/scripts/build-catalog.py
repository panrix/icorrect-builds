"""Apple SSR catalog builder. Run via browser-harness on the signed-in SSR tab.

Strategy:
1. For each top-N candidate serial (from repair-history-derived prefix groups),
   call POST /api/Orders/GetDeviceIdRecaptcha with a fresh reCAPTCHA v3 token.
2. Group resolved serials by deviceModelId — multiple prefixes often map to one model.
3. For each unique deviceModelId, call:
   - GET /api/RepairTypes?modelId={id}  → list of valid repair types
   - GET /api/Spares/SearchByDevice?deviceModelId={id}&repairTypeId={rid}&sn={sn}  per repair type
4. Save the full catalog incrementally to /tmp/apple-ssr-catalog.json so
   a mid-run failure leaves us with N-of-50 captured rather than 0.
"""
import json, time, os, sys

OUT_PATH = '/tmp/apple-ssr-catalog.json'
CHECKPOINT_PATH = '/tmp/apple-ssr-catalog-checkpoint.json'
TOP_N_PREFIXES = 50          # how many prefix groups to resolve serial-side
RATE_LIMIT_S = 1.5            # pause between API calls
RECAPTCHA_SITE_KEY = '6LeoZYIdAAAAAAjZn-24zcepMBi08U8a9zvgAFAs'

# Load candidates
candidates = json.load(open('/tmp/apple-ssr-catalog-candidates.json'))[:TOP_N_PREFIXES]
print(f"Loaded {len(candidates)} candidate prefixes (top {TOP_N_PREFIXES})")

# Load existing checkpoint if any
state = {'resolved': {}, 'unique_models': {}, 'parts_catalog': {}, 'errors': []}
if os.path.exists(CHECKPOINT_PATH):
    with open(CHECKPOINT_PATH) as f:
        state = json.load(f)
    print(f"Resumed from checkpoint: {len(state['resolved'])} serials resolved, {len(state['parts_catalog'])} models with parts")

def save_checkpoint():
    with open(CHECKPOINT_PATH, 'w') as f:
        json.dump(state, f, indent=2)

def get_recaptcha_token(action='getDeviceId'):
    """Run grecaptcha.execute() in the page context to get a fresh v3 token."""
    expr = f"""(async()=>{{
      try {{
        return await grecaptcha.execute({json.dumps(RECAPTCHA_SITE_KEY)}, {{action:{json.dumps(action)}}});
      }} catch (e) {{
        return null;
      }}
    }})()"""
    return js(expr)

def fetch_with_auth(method, path, body=None):
    """Use the page's existing Authorization1 + WEBSTORE_SESSION which are already
    set on the SPA's HttpInterceptor. Going through page-context fetch with
    credentials:'include' inherits cookies; for the auth headers, the SPA
    interceptor doesn't run, so we set them manually from localStorage."""
    body_arg = f", body: {json.dumps(json.dumps(body))}" if body else ""
    expr = f"""(async()=>{{
      const tok = JSON.parse(localStorage.getItem('AUTH_TOKEN')||'{{}}').token;
      // get session token (cached on window?) — re-fetch each session
      let sess = window.__SSR_SESSION__;
      if (!sess) {{
        const sr = await fetch('/api/Orders/GetSessionToken', {{credentials:'include'}});
        sess = (await sr.json()).token;
        window.__SSR_SESSION__ = sess;
      }}
      const r = await fetch({json.dumps(path)}, {{
        method: {json.dumps(method)},
        headers: {{
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization1': 'Bearer ' + tok,
          'WEBSTORE_SESSION': sess,
        }},
        credentials: 'include'{body_arg}
      }});
      return {{status: r.status, body: await r.text()}};
    }})()"""
    r = js(expr)
    if r and r.get('body'):
        try: r['parsed'] = json.loads(r['body'])
        except: pass
    return r

# === PHASE 1: Resolve serials → deviceModelId ===
print("\n=== Phase 1: Resolve serials → deviceModelId ===")
t0 = time.time()
for i, c in enumerate(candidates, 1):
    sn = c['representative_serial']
    if sn in state['resolved']:
        continue
    # Get fresh reCAPTCHA token for this call
    tok = get_recaptcha_token('getDeviceId')
    if not tok:
        print(f"  [{i}/{len(candidates)}] {sn} -> ❌ recaptcha failed")
        state['errors'].append({'phase': 'resolve', 'serial': sn, 'reason': 'no_recaptcha'})
        time.sleep(RATE_LIMIT_S)
        continue
    r = fetch_with_auth('POST', f'/api/Orders/GetDeviceIdRecaptcha?sn={sn}', {'recaptchaToken': tok})
    if r['status'] == 200 and r.get('parsed'):
        d = r['parsed']
        state['resolved'][sn] = {
            'prefix': c['prefix'],
            'repair_count': c['count'],
            'deviceModelId': d.get('deviceModelId'),
            'deviceModel': d.get('deviceModel'),
            'deviceModelCode': d.get('deviceModelCode'),
            'deviceTypeId': d.get('deviceTypeId'),
            'productCode': d.get('productCode'),
            'color': d.get('color'),
        }
        print(f"  [{i}/{len(candidates)}] {sn} ({c['count']} repairs) -> id={d.get('deviceModelId')} {d.get('deviceModel','')[:60]}")
    else:
        msg = (r.get('parsed') or {}).get('message') or r['body'][:200]
        state['errors'].append({'phase': 'resolve', 'serial': sn, 'status': r['status'], 'msg': msg})
        print(f"  [{i}/{len(candidates)}] {sn} -> ❌ status={r['status']} {msg[:80]}")
    save_checkpoint()
    time.sleep(RATE_LIMIT_S)

print(f"\nPhase 1 done in {round(time.time()-t0)}s. Resolved: {len(state['resolved'])}")

# Build unique models map
for sn, info in state['resolved'].items():
    mid = info.get('deviceModelId')
    if mid is None: continue
    if str(mid) not in state['unique_models']:
        state['unique_models'][str(mid)] = {
            'deviceModelId': mid,
            'deviceModel': info['deviceModel'],
            'deviceModelCode': info.get('deviceModelCode'),
            'deviceTypeId': info.get('deviceTypeId'),
            'representative_serial': sn,
            'total_repairs': info['repair_count'],
            'sample_serials': [sn],
        }
    else:
        state['unique_models'][str(mid)]['total_repairs'] += info['repair_count']
        if sn not in state['unique_models'][str(mid)]['sample_serials']:
            state['unique_models'][str(mid)]['sample_serials'].append(sn)

print(f"Unique models: {len(state['unique_models'])}")
save_checkpoint()

# === PHASE 2: For each unique model, get repair types + parts ===
print("\n=== Phase 2: Fetch RepairTypes + Spares per model ===")
t1 = time.time()
models = sorted(state['unique_models'].values(), key=lambda m: -m['total_repairs'])
for i, m in enumerate(models, 1):
    mid = m['deviceModelId']
    sn = m['representative_serial']
    if str(mid) in state['parts_catalog']:
        continue
    # Get repair types
    r = fetch_with_auth('GET', f'/api/RepairTypes?modelId={mid}')
    if r['status'] != 200 or not r.get('parsed'):
        print(f"  [{i}/{len(models)}] model {mid} ({m['deviceModel'][:40]}) -> ❌ RepairTypes status={r['status']}")
        state['errors'].append({'phase': 'repairtypes', 'modelId': mid, 'status': r['status']})
        time.sleep(RATE_LIMIT_S)
        continue
    repair_types = r['parsed'] if isinstance(r['parsed'], list) else r['parsed'].get('repairTypes', [])
    print(f"  [{i}/{len(models)}] model {mid} ({m['deviceModel'][:40]}) -> {len(repair_types)} repair types")

    # For each repair type, get spares
    parts_by_repair_type = {}
    for rt in repair_types:
        rt_id = rt.get('id')
        rt_name = rt.get('name') or rt.get('description','?')
        time.sleep(RATE_LIMIT_S)
        sr = fetch_with_auth('GET', f'/api/Spares/SearchByDevice?deviceModelId={mid}&repairTypeId={rt_id}&sn={sn}')
        if sr['status'] == 200 and sr.get('parsed'):
            spares = sr['parsed'] if isinstance(sr['parsed'], list) else []
            # compress: keep id, partnumber, country GBP price, name, flags
            compressed = []
            for s in spares:
                gb_price = None
                gb_credit = None
                for ca in s.get('country_specific_attributes', []) or []:
                    if ca.get('id_countries') in ('GB', 222) or ca.get('country_code')=='GB':
                        gb_price = ca.get('price')
                        gb_credit = ca.get('creditamount')
                        break
                en_name = None
                for la in s.get('language_specific_attributes', []) or []:
                    if la.get('id_languages') in ('en', 9) or la.get('language_code')=='en':
                        en_name = la.get('name')
                        break
                compressed.append({
                    'id': s.get('id'), 'partnumber': s.get('partnumber'),
                    'name': en_name, 'parttypedesc': s.get('parttypedesc'),
                    'gb_price': gb_price, 'gb_creditamount': gb_credit,
                    'qtymax': s.get('qtymax'),
                    'unavailable': s.get('unavailable'), 'comingsoon': s.get('comingsoon'),
                    'exchangeable': s.get('exchangeable'), 'hero': s.get('hero'),
                    'manualidrequired': s.get('manualidrequired'),
                })
            parts_by_repair_type[str(rt_id)] = {
                'repair_type': rt_name, 'count': len(spares), 'parts': compressed
            }
        else:
            print(f"     repair_type {rt_id} ({rt_name}) -> ❌ status={sr['status']}")
            state['errors'].append({'phase':'spares','modelId':mid,'repairTypeId':rt_id,'status':sr['status']})
    state['parts_catalog'][str(mid)] = {
        'deviceModel': m['deviceModel'],
        'deviceModelId': mid,
        'total_repairs_in_history': m['total_repairs'],
        'repair_types': parts_by_repair_type,
    }
    save_checkpoint()
    time.sleep(RATE_LIMIT_S)

print(f"\nPhase 2 done in {round(time.time()-t1)}s.")

# Final write
with open(OUT_PATH, 'w') as f:
    json.dump(state, f, indent=2)
print(f"\n✅ Catalog saved: {OUT_PATH}")
print(f"   serials resolved:  {len(state['resolved'])}/{len(candidates)}")
print(f"   unique models:     {len(state['unique_models'])}")
print(f"   models with parts: {len(state['parts_catalog'])}")
print(f"   errors:            {len(state['errors'])}")

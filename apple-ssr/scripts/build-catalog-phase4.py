"""Apple SSR catalog Phase 4 — fill in iPhone (and any missing) models using
known-good serials extracted from past order history."""
import json, time, os

CHECKPOINT_PATH = '/tmp/apple-ssr-catalog.json'   # the existing catalog
PHASE4_OUT = '/tmp/apple-ssr-catalog-phase4.json'
KNOWN_GOOD = '/tmp/apple-ssr-known-good-serials.json'
RECAPTCHA_SITE_KEY = '6LeoZYIdAAAAAAjZn-24zcepMBi08U8a9zvgAFAs'
RATE_LIMIT_S = 1.5

state = json.load(open(CHECKPOINT_PATH))
known_good = json.load(open(KNOWN_GOOD))   # {model_id: serial}
print(f"Existing catalog: {len(state['parts_catalog'])} models")
print(f"Known-good serials available: {len(known_good)}")

# Identify models we DON'T have parts for yet
missing_models = {mid: sn for mid, sn in known_good.items() if mid not in state['parts_catalog']}
print(f"Missing models to fetch: {len(missing_models)}")
for mid, sn in missing_models.items():
    print(f"  model {mid} -> serial {sn[:14]}")

def get_recaptcha_token(action='getDeviceId'):
    expr = r"""(async()=>{
      try { return await grecaptcha.execute('""" + RECAPTCHA_SITE_KEY + r"""', {action:'""" + action + r"""'}); } catch(e) { return null; }
    })()"""
    return js(expr)

def fetch_with_auth(method, path, body=None):
    body_arg = ''
    if body is not None:
        body_arg = ', body: ' + json.dumps(json.dumps(body))
    expr = r"""(async()=>{
      const tok = JSON.parse(localStorage.getItem('AUTH_TOKEN')||'{}').token;
      let sess = window.__SSR_SESSION__;
      if (!sess) { const sr = await fetch('/api/Orders/GetSessionToken',{credentials:'include'}); sess = (await sr.json()).token; window.__SSR_SESSION__ = sess; }
      const r = await fetch('""" + path + r"""', {
        method: '""" + method + r"""',
        headers: {'Content-Type':'application/json','Accept':'application/json','Authorization1':'Bearer '+tok,'WEBSTORE_SESSION': sess},
        credentials:'include'""" + body_arg + r"""
      });
      return {status: r.status, body: await r.text()};
    })()"""
    r = js(expr)
    if r and r.get('body'):
        try: r['parsed'] = json.loads(r['body'])
        except: pass
    return r

added = 0
for mid_str, sn in missing_models.items():
    mid = int(mid_str)
    print(f"\n=== model {mid} via serial {sn[:14]} ===")

    # Step 1: re-resolve to verify it still works (also gets us deviceModel name)
    tok = get_recaptcha_token()
    if not tok:
        print(f"  ❌ recaptcha failed"); time.sleep(RATE_LIMIT_S); continue
    r = fetch_with_auth('POST', f'/api/Orders/GetDeviceIdRecaptcha?sn={sn}', {'recaptchaToken': tok})
    if r['status'] != 200 or not r.get('parsed'):
        msg = (r.get('parsed') or {}).get('error', r['body'][:200])
        print(f"  ❌ resolve failed: status={r['status']} {msg[:80]}")
        state['errors'].append({'phase':'resolve_phase4','serial':sn,'modelId':mid,'status':r['status'],'msg':msg})
        time.sleep(RATE_LIMIT_S); continue
    d = r['parsed']
    actual_mid = d.get('deviceModelId')
    actual_name = d.get('deviceModel','')
    if actual_mid != mid:
        print(f"  ⚠️ resolver returned different model: {actual_mid} {actual_name} (expected {mid})")
        # still proceed with the resolved id
        mid = actual_mid
    state['resolved'][sn] = {
        'prefix': sn[:3], 'repair_count': 0, 'deviceModelId': actual_mid,
        'deviceModel': actual_name, 'deviceModelCode': d.get('deviceModelCode'),
        'deviceTypeId': d.get('deviceTypeId'), 'productCode': d.get('productCode'),
        'color': d.get('color'),
    }
    print(f"  ✓ resolved: {actual_name}")
    time.sleep(RATE_LIMIT_S)

    # Step 2: RepairTypes
    rt = fetch_with_auth('GET', f'/api/RepairTypes?modelId={mid}')
    if rt['status'] != 200 or not rt.get('parsed'):
        print(f"  ❌ RepairTypes status={rt['status']}"); continue
    repair_types = rt['parsed']
    print(f"  {len(repair_types)} repair types")
    time.sleep(RATE_LIMIT_S)

    # Step 3: Spares per repair type (with sn= since iPhone Spares require it)
    parts_by_repair_type = {}
    for r_t in repair_types:
        rt_id = r_t.get('id')
        rt_name = (r_t.get('language_specific_attributes') or [{}])[0].get('name', str(rt_id))
        sp = fetch_with_auth('GET', f'/api/Spares/SearchByDevice?deviceModelId={mid}&repairTypeId={rt_id}&sn={sn}')
        if sp['status'] == 200 and sp.get('parsed'):
            spares = sp['parsed'] if isinstance(sp['parsed'], list) else []
            compressed = []
            for s in spares:
                gb_price = next((c.get('price') for c in (s.get('country_specific_attributes') or []) if c.get('id_countries') in ('GB',222) or c.get('country_code')=='GB'), None)
                gb_credit = next((c.get('creditamount') for c in (s.get('country_specific_attributes') or []) if c.get('id_countries') in ('GB',222) or c.get('country_code')=='GB'), None)
                en_name = next((la.get('name') for la in (s.get('language_specific_attributes') or []) if la.get('id_languages') in ('en',9) or la.get('language_code')=='en'), None)
                compressed.append({
                    'id': s.get('id'), 'partnumber': s.get('partnumber'),
                    'name': en_name, 'parttypedesc': s.get('parttypedesc'),
                    'gb_price': gb_price, 'gb_creditamount': gb_credit,
                    'qtymax': s.get('qtymax'),
                    'unavailable': s.get('unavailable'), 'comingsoon': s.get('comingsoon'),
                    'exchangeable': s.get('exchangeable'), 'hero': s.get('hero'),
                    'manualidrequired': s.get('manualidrequired'),
                })
            parts_by_repair_type[str(rt_id)] = {'repair_type': rt_name, 'count': len(spares), 'parts': compressed}
        elif sp['status'] == 204:
            parts_by_repair_type[str(rt_id)] = {'repair_type': rt_name, 'count': 0, 'parts': []}
        else:
            print(f"     ❌ {rt_name} status={sp['status']}")
        time.sleep(RATE_LIMIT_S)

    state['parts_catalog'][str(mid)] = {
        'deviceModel': actual_name, 'deviceModelId': mid,
        'total_repairs_in_history': 0,  # known-good seeds may not appear in repair history
        'repair_types': parts_by_repair_type,
    }
    parts_total = sum(rt.get('count', 0) for rt in parts_by_repair_type.values())
    print(f"  ✓ saved: {len(parts_by_repair_type)} repair types, {parts_total} parts")
    added += 1

    # Save incremental
    with open(PHASE4_OUT, 'w') as f:
        json.dump(state, f, indent=2)

print(f"\n✅ Phase 4 done. Added {added} new models.")
print(f"   Catalog now has {len(state['parts_catalog'])} models with parts.")
print(f"   Saved to {PHASE4_OUT}")

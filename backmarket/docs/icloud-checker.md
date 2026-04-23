# iCloud-checker Service (port 8010)

Status: verified
Last verified: 2026-04-22
Verification method: end-to-end spec-lookup test on two live serials after proxy rotation
Evidence sources:
- `/home/ricky/builds/icloud-checker/src/index.js`, `/home/ricky/builds/icloud-checker/src/apple-specs.js`
- systemd unit `/home/ricky/.config/systemd/user/icloud-checker.service`
- Session transcript 2026-04-22: silent-failure diagnosis + proxy password rotation + env-var migration
- Commit `6049877` on branch `feat/agents-removed` (not yet in master)

Purpose: capture how the intake iCloud + Apple spec-check service actually works, why it silently fails, and how to rotate its proxy without breaking anything.

---

## What it does

Webhook service on `127.0.0.1:8010` that fires when a BM Devices item's Main Board twin transitions state. Core responsibilities:

1. **iCloud lock check** — calls `sickw.com/api.php?service=30` with the device serial. Returns `ON`/`OFF`. Sets `status24` on Main Board accordingly.
2. **Apple spec lookup** — uses Playwright + a residential proxy to navigate `selfservicerepair.com`, extract the full spec (model, chip, CPU-core, GPU-core, RAM, storage, colour) from the Logic Board part description.
3. **Spec comparison** — compares Apple-confirmed spec against BM claimed spec on the BM Devices board. Flags mismatch.
4. **Monday update posting** — writes a single canonical comment: `✅ iCloud Check: OFF` + spec block + match/mismatch verdict.
5. **Recheck cron** — re-queries iCloud status every 30 min on items in the "iCloud locked" group (for devices where the original owner removes the lock after listing).

---

## Critical dependency: residential proxy

Apple geo-blocks UK IPs on `selfservicerepair.com`. Without a US-exit proxy, spec lookups fail.

Provider: **dataimpulse** (residential plan). Creds live in `/home/ricky/config/api-keys/.env`:

```
PROXY_SERVER=http://gw.dataimpulse.com:823
PROXY_USER=6408bbc453bce516a1e4__cr.us
PROXY_PASS=<rotating>
```

The `__cr.us` suffix on the username is dataimpulse's country-routing code — ensures a US exit. Verify country with:

```bash
curl -x "http://$USER:$PASS@gw.dataimpulse.com:823" http://ip-api.com/json/
# expect: { "countryCode": "US", "isp": "..." }
```

### Rotation procedure

When the Apple spec lookup stops working (silent-failure alert should fire via Slack; see below):

1. Log into <https://app.dataimpulse.com> → Proxy Credentials → copy the current password.
2. Test with `curl -x "http://<user>:<new-pass>@gw.dataimpulse.com:823" -w "%{http_code}\n" http://httpbin.org/ip` — expect HTTP 200 and a non-UK IP.
3. Edit `/home/ricky/config/api-keys/.env`, update `PROXY_PASS`.
4. Restart: `systemctl --user restart icloud-checker`.
5. Verify: `cd /home/ricky/builds/icloud-checker && node src/apple-specs.js <any-known-M1-serial>` — expect full JSON response with model/cpu/gpu/memory/storage.

### How a dead proxy shows up

- Proxy HTTP 407 → credentials wrong / rotated
- Proxy HTTP 000 (instant refusal) → account suspended or gateway changed
- Proxy HTTP 200 but UK exit → country routing misconfigured (suffix wrong or plan changed)
- Apple HTTP 403 from direct request → proxy working but Apple's anti-bot still triggering; normal for curl, fine via full Playwright
- Apple HTTP 200 but CAPTCHA rendered → proxy IP is burnt, dataimpulse needs to rotate exit IPs; short-term you wait it out or escalate with them

---

## The silent-failure mode (fixed 2026-04-22, commit `6049877`)

**Prior behaviour (broken):** When `getAppleSpecsWithRetry` returned `{ error: "..." }` without the `unsupported` flag (e.g. proxy dead, timeout, Apple UI change), `index.js` only handled the `unsupported` case. `specComment` stayed empty. The Monday post contained only `✅ iCloud Check: OFF` with no spec block. No Slack alert. No console error beyond a single log line.

Result: from ~2026-04-15 to 2026-04-22, every intake silently lost its spec verification. Ferrari processed payouts without spec-match confirmation. Discovered when Ricky manually noticed two pending orders (GB-26154-TYMAL, GB-26161-LEHQG) had iCloud-only confirmations.

**Post-fix:** new `else if (appleSpecs?.error)` branch posts the error to Monday AND sends a Slack alert. Exception path also alerts. Next proxy-death / Apple-UI-change fires immediately.

**Failure-path alerts fire on:**
- `appleSpecs.error` set but `.unsupported` not set (proxy dead, timeout, UI change)
- Any exception thrown in the try block

**Does NOT alert on** (by design):
- `.unsupported` — legit "Apple doesn't support this device" response, usually Intel/pre-M1. Not a failure.
- Cache hits — no alert possible, doesn't run the flow.

---

## Service lifecycle

systemd user unit: `/home/ricky/.config/systemd/user/icloud-checker.service`

```
systemctl --user status icloud-checker    # is it running
systemctl --user restart icloud-checker   # after env change
journalctl --user -u icloud-checker -n 50 # logs
```

EnvironmentFile currently loads only `/home/ricky/config/.env`. The proxy creds live in `/home/ricky/config/api-keys/.env` — `apple-specs.js` loads that file directly via an inline parser (see `loadEnvFile` function). This is deliberate: avoids a systemd unit change, keeps credential files separated by purpose.

---

## Endpoints

- `POST /webhook/icloud-check` — primary webhook, called by Monday automation on status change
- `POST /webhook/icloud-check/slack-interact` — Slack button callbacks (counter-offer actions)
- `POST /webhook/bm/counter-offer-action` — counter-offer approval/rejection
- `POST /webhook/icloud-check/recheck` — manually trigger the 30-min recheck cron
- `GET /webhook/icloud-check/spec-check?serial=XXX` — on-demand spec lookup, returns JSON
- `POST /webhook/bm/to-list` — BM To-List automation entry point
- `GET /webhook/icloud-check/health` — liveness check

---

## Related files

- `/home/ricky/builds/icloud-checker/src/apple-specs.js` — proxy + Playwright scraper of selfservicerepair.com
- `/home/ricky/builds/icloud-checker/specs-cache.json` — per-serial cache of Apple responses (survives restarts)
- `/home/ricky/builds/icloud-checker/src/lib/counter-offer.js` — counter-offer decision logic

---

## For future-me

- If you see spec-check output like `✅ iCloud Check: OFF` with no `📱 Apple Confirmed: ...` block below it on a freshly-intook Monday item, the proxy or Apple's site is broken. **Don't assume iCloud-only = good.** Check logs, test the proxy, rotate if needed.
- The specs-cache.json mean a serial that was looked up once will keep returning the old answer forever — it never re-checks. If a device is suspected to have been swapped/chopped between intake and receipt, delete its cache entry and force a fresh lookup.
- `unsupported: true` in cache = legit Apple rejection. Those are Intel / pre-M1 devices and will never succeed. Don't retry them.

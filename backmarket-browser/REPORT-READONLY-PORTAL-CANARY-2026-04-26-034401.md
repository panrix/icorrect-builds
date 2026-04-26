# Read-only Back Market Seller-Portal Browser Canary

Generated: 2026-04-26 03:55 UTC  
Run ID: `portal-canary-2026-04-26-034401`  
Mode: approved read-only portal canary using VPS/browser-harness

## Scope confirmation

Approved actions performed:

- Opened Back Market seller/front-office URLs.
- Attempted seller portal entry (`/bo-seller`) read-only.
- Captured screenshots/checkpoints.
- Checked whether dashboard/Listings area was reachable.

Not performed:

- No Save.
- No edits.
- No listing creation/update/delete.
- No SKU changes.
- No customer messages.
- No return/warranty/refund actions.
- No Monday writes.
- No Google Sheet writes.
- No messaging/Telegram/Slack writes.
- No Back Market API mutations.
- No bulk actions.
- No password/code was printed to logs or report.

## Summary

Result: **blocked before login**.

The neutral VPS/CDP/browser-harness preflight passed. The seller portal link was discovered as `https://www.backmarket.co.uk/bo-seller`, but Back Market redirected to `accounts.backmarket.co.uk/oauth2/auth?...bm_journey=seller`, where the page rendered:

> Sorry, this page is not available.

No login form appeared. No email-code prompt appeared. Mailbox-code retrieval was therefore not used.

Listings area was **not reachable** in this run.

## Commands run

From `/home/ricky/builds/backmarket-browser`.

### 1. Neutral preflight

```bash
node scripts/vps-cdp-about-blank-check.js --start-chromium
```

Output summary:

```json
{
  "ok": true,
  "readOnly": true,
  "livePortalAccess": false,
  "openedBackMarket": false,
  "cdpHttp": "http://127.0.0.1:9222",
  "cdpWebSocketDiscovered": true,
  "harnessStatus": 0,
  "neutral": { "ok": true },
  "stdoutPreview": "{'url': 'about:blank', 'title': '', 'w': 1280, 'h': 813, 'sx': 0, 'sy': 0, 'pw': 1280, 'ph': 813}\n"
}
```

### 2. Start long-lived Chromium/CDP for canary

```bash
chromium-browser \
  --remote-debugging-port=9222 \
  --user-data-dir=/home/ricky/builds/backmarket-browser/data/chromium-portal-profile \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-sync \
  --disable-features=Translate,MediaRouter \
  --window-size=1280,900 \
  --headless=new \
  about:blank
```

CDP discovery output confirmed Chrome and a websocket were available:

```json
{
  "Browser": "Chrome/147.0.7727.55",
  "webSocketDebuggerUrl": true
}
```

### 3. Browser-harness portal attempt

Browser-harness was attached using `BU_CDP_WS=<local websocket>` and used only read-only/navigation helpers:

```python
ensure_real_tab()
screenshot('.../00-about-blank.png')
goto('https://www.backmarket.co.uk/dashboard/seller/listings')
wait(3)
screenshot('.../01-landing-or-login.png')
```

Observed:

- Final normalized URL: `https://www.backmarket.co.uk/en-gb/dashboard/seller/listings`
- Page marker: Back Market front-office `404`
- Footer exposed the real seller portal link: `https://www.backmarket.co.uk/bo-seller`

Then:

```python
goto('https://www.backmarket.co.uk/bo-seller')
wait(5)
screenshot('.../02-bo-seller-entry.png')
```

Observed:

- Redacted final URL: `https://accounts.backmarket.co.uk/oauth2/auth?...bm_journey=seller`
- Page marker: `Sorry, this page is not available.`
- No form controls present.

### 4. Control checks

Consumer login route check:

```python
goto('https://www.backmarket.co.uk/en-gb/auth/login?next=/en-gb/dashboard/profile')
wait(5)
screenshot('.../03-consumer-login-check.png')
```

Observed same accounts/auth blocker:

- Redacted final URL: `https://accounts.backmarket.co.uk/oauth2/auth?...scope=offline_access+customer:all`
- Page marker: `Sorry, this page is not available.`

Secondary xvfb/non-headless Chromium check was attempted against `/bo-seller`. It still landed on the accounts auth unavailable page; screenshot capture later hit a browser-harness keepalive timeout, but page state before timeout matched the same blocker.

### 5. Network diagnostic

Read-only `curl -I` check against accounts root:

```bash
curl -I -L -sS --max-time 20 https://accounts.backmarket.co.uk/
```

Observed:

```text
HTTP/2 403
server: cloudflare
```

This supports the blocker being at the Back Market accounts/Cloudflare auth layer from this VPS/browser path, before login UI or code flow.

## Artifacts

Screenshots/checkpoints directory:

- `/home/ricky/builds/backmarket-browser/data/screenshots/portal-canary/portal-canary-2026-04-26-034401/`

Files:

- `00-about-blank.png` — neutral browser-harness proof
- `01-landing-or-login.png` — guessed dashboard/listings URL produced front-office 404
- `02-bo-seller-entry.png` — seller portal redirected to accounts auth unavailable page
- `03-consumer-login-check.png` — consumer login route showed same auth unavailable page
- `04-xvfb-about-blank.png` — secondary xvfb/non-headless check state; despite filename, the observed page state before timeout was accounts auth unavailable
- `checkpoints.json` — local checkpoint summary, with auth query parameters redacted in descriptions

Run logs/state:

- `/home/ricky/builds/backmarket-browser/data/runs/portal-canary-2026-04-26-034401.env`
- `/home/ricky/builds/backmarket-browser/data/runs/portal-canary-2026-04-26-034401-cdp-version.json`
- `/home/ricky/builds/backmarket-browser/data/runs/portal-canary-2026-04-26-034401-final-state.txt`
- `/home/ricky/builds/backmarket-browser/data/runs/portal-canary-2026-04-26-034401-chromium.log`
- `/home/ricky/builds/backmarket-browser/data/runs/portal-canary-2026-04-26-034401-xvfb-chromium.log`

## Final URL/page state

Final observed browser-harness state:

- URL: `https://accounts.backmarket.co.uk/oauth2/auth?...bm_journey=seller` redacted
- Title: `🟢`
- Body text: `Sorry, this page is not available.`
- Login form: not present
- Email-code prompt: not present
- Listings area: not reachable

## Stable markers observed

Front-office seller link marker:

- Link text: `Seller portal`
- Href: `https://www.backmarket.co.uk/bo-seller`

Seller portal auth marker:

- Host: `accounts.backmarket.co.uk`
- Path: `/oauth2/auth`
- Query includes `scope=offline_access seller:all` and `bm_journey=seller`
- Body marker: `Sorry, this page is not available.`

## Blocker

Back Market accounts auth is unavailable/blocked from the VPS/browser-harness path before any login form appears.

Because there was no login form and no email-code prompt, the configured mailbox-code path could not be exercised.

## Recommended next step

Ask Ricky whether to try the same read-only canary from an already trusted/logged-in user browser or a non-VPS residential/local browser route, still with the exact same prohibitions. Recommended wording:

> Approve one read-only Back Market seller-portal canary from a trusted logged-in browser/profile instead of the VPS headless path. Scope remains dashboard/Listings only, screenshots/checkpoints only, no Save, no edits, no customer/return/warranty/refund/listing mutation, no Monday/Google/messaging writes. Goal: confirm whether the `accounts.backmarket.co.uk` blocker is VPS/Cloudflare-specific and whether Listings is reachable after trusted login.

const fs = require('fs');
const path = require('path');

const DEFAULT_CDP_HTTP = 'http://127.0.0.1:9222';
const DEFAULT_PROFILE_DIR = path.join(__dirname, '..', 'data', 'chromium-profile');

function isLocalCdpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(url.hostname);
  } catch (_) {
    return false;
  }
}

function normalizeCdpHttp(value = DEFAULT_CDP_HTTP) {
  const raw = String(value || DEFAULT_CDP_HTTP).replace(/\/+$/, '');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('CDP HTTP endpoint must be http(s)');
  }
  if (!isLocalCdpUrl(url.toString())) {
    throw new Error('CDP HTTP endpoint must be localhost/127.0.0.1 unless deliberately tunneled by operator outside this script');
  }
  return url.toString().replace(/\/+$/, '');
}

function discoverWebSocketUrlFromVersion(versionJson) {
  const ws = versionJson && versionJson.webSocketDebuggerUrl;
  if (!ws) throw new Error('Missing webSocketDebuggerUrl in /json/version response');
  if (!/^wss?:\/\//.test(ws)) throw new Error('Invalid CDP websocket URL scheme');
  if (!isLocalCdpUrl(ws)) throw new Error('CDP websocket must be localhost/127.0.0.1');
  return ws;
}

async function fetchCdpWebSocketUrl(cdpHttp = DEFAULT_CDP_HTTP, fetchImpl = fetch) {
  const base = normalizeCdpHttp(cdpHttp);
  const resp = await fetchImpl(`${base}/json/version`, { method: 'GET' });
  if (!resp.ok) throw new Error(`CDP /json/version failed: ${resp.status}`);
  return discoverWebSocketUrlFromVersion(await resp.json());
}

function resolveChromiumBinary(env = process.env) {
  const candidates = [
    env.BM_CHROMIUM_BIN,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean);
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function buildChromiumArgs({ cdpPort = 9222, profileDir = DEFAULT_PROFILE_DIR, headless = true } = {}) {
  return [
    `--remote-debugging-port=${Number(cdpPort)}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-features=Translate,MediaRouter',
    '--window-size=1280,900',
    ...(headless ? ['--headless=new'] : []),
    'about:blank',
  ];
}

function buildHarnessProbeInput() {
  return [
    'ensure_real_tab()',
    'print(page_info())',
    '',
  ].join('\n');
}

function assertNeutralPageInfo(output) {
  const text = String(output || '');
  if (/backmarket|back market|seller-portal|merchant/i.test(text)) {
    return { ok: false, reason: 'portal_url_or_text_detected' };
  }
  if (!/about:blank/.test(text)) {
    return { ok: false, reason: 'about_blank_not_confirmed' };
  }
  return { ok: true };
}

module.exports = {
  DEFAULT_CDP_HTTP,
  DEFAULT_PROFILE_DIR,
  isLocalCdpUrl,
  normalizeCdpHttp,
  discoverWebSocketUrlFromVersion,
  fetchCdpWebSocketUrl,
  resolveChromiumBinary,
  buildChromiumArgs,
  buildHarnessProbeInput,
  assertNeutralPageInfo,
};

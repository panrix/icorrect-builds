const assert = require('assert');
const {
  isLocalCdpUrl,
  normalizeCdpHttp,
  discoverWebSocketUrlFromVersion,
  resolveChromiumBinary,
  buildChromiumArgs,
  buildHarnessProbeInput,
  assertNeutralPageInfo,
} = require('../../lib/vps-cdp-harness');

assert.equal(isLocalCdpUrl('http://127.0.0.1:9222'), true);
assert.equal(isLocalCdpUrl('ws://localhost:9222/devtools/browser/abc'), true);
assert.equal(isLocalCdpUrl('https://seller.backmarket.example'), false);
assert.equal(normalizeCdpHttp('http://127.0.0.1:9222/'), 'http://127.0.0.1:9222');
assert.throws(() => normalizeCdpHttp('https://example.com:9222'), /localhost/);
assert.equal(
  discoverWebSocketUrlFromVersion({ webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/browser/abc' }),
  'ws://127.0.0.1:9222/devtools/browser/abc'
);
assert.throws(() => discoverWebSocketUrlFromVersion({ webSocketDebuggerUrl: 'ws://example.com/devtools/browser/abc' }), /localhost/);
const resolvedChrome = resolveChromiumBinary({ BM_CHROMIUM_BIN: '/definitely/not/chrome', HOME: '/definitely/not/home' });
assert(resolvedChrome === null || resolvedChrome.endsWith('Google Chrome') || resolvedChrome.endsWith('Chromium') || resolvedChrome.includes('/usr/bin/'));
const args = buildChromiumArgs({ cdpPort: 9333, profileDir: '/tmp/bm-profile', headless: true });
assert(args.includes('--remote-debugging-port=9333'));
assert(args.includes('--user-data-dir=/tmp/bm-profile'));
assert(args.includes('--headless=new'));
assert.equal(args.at(-1), 'about:blank');
assert(buildHarnessProbeInput().includes('page_info'));
assert.deepEqual(assertNeutralPageInfo("{'url': 'about:blank', 'title': ''}"), { ok: true });
assert.equal(assertNeutralPageInfo("{'url': 'https://seller.backmarket.com', 'title': 'Back Market'}").ok, false);
assert.equal(assertNeutralPageInfo("{'url': 'https://example.com'}").reason, 'about_blank_not_confirmed');
console.log('vps-cdp-harness.test passed');

const assert = require('assert');
const {
  normalizeProxyServer,
  extractProxyCountryHint,
  summarizeProxyEnv,
  redactUrl,
  detectPortalState,
} = require('../../lib/dataimpulse-proxy-canary');

assert.strictEqual(normalizeProxyServer('gw.dataimpulse.com'), 'http://gw.dataimpulse.com:823');
assert.strictEqual(normalizeProxyServer('http://gw.dataimpulse.com:823'), 'http://gw.dataimpulse.com:823');
assert.strictEqual(extractProxyCountryHint('abc__cr.gb'), 'gb');
assert.strictEqual(extractProxyCountryHint('abc__cr.us'), 'us');
assert.strictEqual(extractProxyCountryHint('plain-user'), null);

assert.deepStrictEqual(
  summarizeProxyEnv({
    PROXY_SERVER: 'http://gw.dataimpulse.com:823',
    PROXY_USER: 'acct__cr.gb',
    PROXY_PASS: 'secret',
    BM_PORTAL_EMAIL: 'user@example.com',
  }),
  {
    provider: 'DataImpulse',
    serverHost: 'gw.dataimpulse.com',
    serverPort: 823,
    usernameCountryHint: 'gb',
    envKeysPresent: {
      PROXY_SERVER: true,
      PROXY_USER: true,
      PROXY_PASS: true,
      BM_PORTAL_EMAIL: true,
      BM_PORTAL_PASSWORD: false,
    },
  }
);

assert.strictEqual(
  redactUrl('https://accounts.backmarket.co.uk/oauth2/auth?scope=offline_access&client_id=abc'),
  'https://accounts.backmarket.co.uk/oauth2/auth?scope=<redacted>&client_id=<redacted>'
);

assert.deepStrictEqual(
  detectPortalState({
    url: 'https://accounts.backmarket.co.uk/oauth2/auth?x=1',
    title: 'Back Market',
    bodyText: 'Sorry, this page is not available.',
  }).blocker,
  'accounts_unavailable'
);

assert.deepStrictEqual(
  detectPortalState({
    url: 'https://accounts.backmarket.co.uk/oauth2/auth?x=1',
    title: 'Sign in',
    bodyText: 'Sign in with your email address and password',
    loginFieldCount: 2,
  }).blocker,
  'login_required'
);

assert.deepStrictEqual(
  detectPortalState({
    url: 'https://accounts.backmarket.co.uk/oauth2/auth?x=1',
    title: 'Verification',
    bodyText: 'Enter the verification code we sent you',
    emailCodeFieldCount: 1,
  }).blocker,
  'email_code_required'
);

assert.deepStrictEqual(
  detectPortalState({
    url: 'https://www.backmarket.co.uk/en-gb/dashboard/seller/listings',
    title: 'Listings',
    bodyText: 'Listings inventory dashboard',
    listingsMarkerCount: 1,
  }).state,
  'portal_reached'
);

console.log('dataimpulse-proxy-canary.test passed');

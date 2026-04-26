const fs = require('fs');

const DEFAULT_ENV_FILE = '/home/ricky/config/api-keys/.env';
const DEFAULT_PROXY_PORT = 823;
const DEFAULT_PORTAL_URL = 'https://www.backmarket.co.uk/bo-seller';
const DEFAULT_LISTINGS_URL = 'https://www.backmarket.co.uk/en-gb/dashboard/seller/listings';
const DEFAULT_PORTAL_EMAIL = 'jarvis@icorrect.co.uk';

function loadEnvFile(filePath = DEFAULT_ENV_FILE, env = process.env) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in env)) env[key] = value;
  }
  return env;
}

function normalizeProxyServer(value, fallbackPort = DEFAULT_PROXY_PORT) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('PROXY_SERVER missing');
  const withScheme = /^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`;
  const url = new URL(withScheme);
  if (!url.port) url.port = String(fallbackPort);
  return url.toString().replace(/\/$/, '');
}

function extractProxyCountryHint(proxyUser) {
  const match = String(proxyUser || '').match(/__cr\.([a-z]{2})/i);
  return match ? match[1].toLowerCase() : null;
}

function summarizeProxyEnv(env = process.env) {
  const server = normalizeProxyServer(env.PROXY_SERVER);
  const url = new URL(server);
  return {
    provider: 'DataImpulse',
    serverHost: url.hostname,
    serverPort: Number(url.port),
    usernameCountryHint: extractProxyCountryHint(env.PROXY_USER),
    envKeysPresent: {
      PROXY_SERVER: Boolean(env.PROXY_SERVER),
      PROXY_USER: Boolean(env.PROXY_USER),
      PROXY_PASS: Boolean(env.PROXY_PASS),
      BM_PORTAL_EMAIL: Boolean(env.BM_PORTAL_EMAIL),
      BM_PORTAL_PASSWORD: Boolean(env.BM_PORTAL_PASSWORD),
    },
  };
}

function redactUrl(rawUrl) {
  if (!rawUrl) return '';
  try {
    const url = new URL(rawUrl);
    url.username = '';
    url.password = '';
    const params = [];
    for (const key of url.searchParams.keys()) {
      params.push(`${encodeURIComponent(key)}=<redacted>`);
    }
    return `${url.origin}${url.pathname}${params.length ? `?${params.join('&')}` : ''}`;
  } catch (_) {
    return String(rawUrl);
  }
}

function buildRunId(now = new Date()) {
  return `dataimpulse-portal-canary-${now.toISOString().replace(/[:.]/g, '-')}`;
}

function textSnippet(value, max = 280) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function looksLikePasswordPrompt({ title, bodyText, passwordFieldCount = 0 }) {
  if (passwordFieldCount > 0) return true;
  return /password/i.test(`${title || ''} ${bodyText || ''}`);
}

function looksLikeEmailEntryPrompt({ emailFieldCount = 0, passwordFieldCount = 0, emailCodeFieldCount = 0 }) {
  return emailFieldCount > 0 && passwordFieldCount === 0 && emailCodeFieldCount === 0;
}

function looksLikePasswordRejected({ title, bodyText }) {
  return /incorrect password|wrong password|invalid password|password.*incorrect|password.*invalid|try again/i.test(
    `${title || ''} ${bodyText || ''}`
  );
}

function looksLikeCaptcha({ title, bodyText }) {
  return /captcha|recaptcha|hcaptcha|verify you are human|verify that you are human|robot check|security challenge/i.test(
    `${title || ''} ${bodyText || ''}`
  );
}

function detectPortalState({
  url,
  title,
  bodyText,
  emailFieldCount = 0,
  passwordFieldCount = 0,
  loginFieldCount = 0,
  emailCodeFieldCount = 0,
  listingsMarkerCount = 0,
}) {
  const normalizedUrl = String(url || '').toLowerCase();
  const normalizedTitle = String(title || '').toLowerCase();
  const normalizedBody = String(bodyText || '').toLowerCase();
  const snippet = textSnippet(bodyText);

  if (
    normalizedUrl.includes('accounts.backmarket.') &&
    normalizedBody.includes('sorry, this page is not available')
  ) {
    return {
      state: 'blocked',
      blocker: 'accounts_unavailable',
      stopReason: 'Back Market accounts page returned the unavailable marker before login.',
      handoff: 'Retry from a warmed residential profile or a trusted interactive browser path; do not continue from this blocked state.',
      pageMarker: snippet,
    };
  }

  if (looksLikeCaptcha({ title, bodyText })) {
    return {
      state: 'blocked',
      blocker: 'captcha',
      stopReason: 'Back Market presented a CAPTCHA or human-verification challenge.',
      handoff: 'Stop here and request explicit operator guidance before continuing through any interactive challenge.',
      pageMarker: snippet,
    };
  }

  if (
    emailCodeFieldCount > 0 ||
    /verification code|one-time code|6-digit code|enter the code|security code/i.test(bodyText || '')
  ) {
    return {
      state: 'auth_required',
      blocker: 'email_code_required',
      stopReason: 'Back Market requested an email verification code.',
      handoff: 'Operator must supply the current Back Market email code or enable a mailbox-code path before any further canary step.',
      pageMarker: snippet,
    };
  }

  if (looksLikePasswordRejected({ title, bodyText })) {
    return {
      state: 'auth_required',
      blocker: 'password_rejected',
      stopReason: 'Back Market rejected the submitted password.',
      handoff: 'Stop here and verify the stored password out of band before retrying.',
      pageMarker: snippet,
    };
  }

  if (looksLikePasswordPrompt({ title, bodyText, passwordFieldCount })) {
    return {
      state: 'auth_required',
      blocker: 'password_required',
      stopReason: 'Back Market advanced past email entry and is now requesting the password.',
      handoff: 'Stop here unless a later task explicitly authorizes password entry with BM_PORTAL_PASSWORD available.',
      pageMarker: snippet,
    };
  }

  if (looksLikeEmailEntryPrompt({ emailFieldCount, passwordFieldCount, emailCodeFieldCount })) {
    return {
      state: 'auth_required',
      blocker: 'email_entry_required',
      stopReason: 'Back Market is requesting the seller email address.',
      handoff: 'Submit only the approved seller email, then stop again at the next auth blocker.',
      pageMarker: snippet,
    };
  }

  if (
    loginFieldCount > 0 ||
    (normalizedUrl.includes('/oauth2/') &&
      (/sign in|log in|password|email address/i.test(bodyText || '') ||
        /sign in|log in/.test(normalizedTitle)))
  ) {
    return {
      state: 'auth_required',
      blocker: 'login_required',
      stopReason: 'Back Market login page is reachable and requires credentials.',
      handoff: 'Operator must provide explicit login approval plus the missing BM portal password or a pre-authenticated profile.',
      pageMarker: snippet,
    };
  }

  if (
    normalizedUrl.includes('/dashboard/seller') ||
    normalizedUrl.includes('/bo-seller') ||
    listingsMarkerCount > 0
  ) {
    return {
      state: 'logged_in',
      blocker: 'logged_in',
      stopReason: null,
      handoff: null,
      pageMarker: snippet,
    };
  }

  if (/access denied|forbidden|cloudflare/i.test(bodyText || '')) {
    return {
      state: 'blocked',
      blocker: 'access_denied',
      stopReason: 'Back Market or Cloudflare denied the request.',
      handoff: 'Rotate proxy geography or retry from an interactive trusted browser path before attempting login.',
      pageMarker: snippet,
    };
  }

  return {
    state: 'unknown',
    blocker: 'unknown_page_state',
    stopReason: 'Could not classify the landing page safely.',
    handoff: 'Review screenshot and checkpoint JSON before taking any further action.',
    pageMarker: snippet,
  };
}

module.exports = {
  DEFAULT_ENV_FILE,
  DEFAULT_PROXY_PORT,
  DEFAULT_PORTAL_URL,
  DEFAULT_LISTINGS_URL,
  DEFAULT_PORTAL_EMAIL,
  loadEnvFile,
  normalizeProxyServer,
  extractProxyCountryHint,
  summarizeProxyEnv,
  redactUrl,
  buildRunId,
  textSnippet,
  looksLikePasswordPrompt,
  looksLikeEmailEntryPrompt,
  looksLikePasswordRejected,
  looksLikeCaptcha,
  detectPortalState,
};

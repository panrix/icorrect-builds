#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_ENV_FILE,
  DEFAULT_PORTAL_URL,
  DEFAULT_LISTINGS_URL,
  loadEnvFile,
  normalizeProxyServer,
  summarizeProxyEnv,
  redactUrl,
  buildRunId,
  detectPortalState,
} = require('../lib/dataimpulse-proxy-canary');
const { resolveChromiumBinary } = require('../lib/vps-cdp-harness');
const { acquireLock, releaseLock, buildLockRecord, defaultLockPath } = require('../lib/runtime-lock');

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

async function capturePageState(page) {
  const bodyText = await page.textContent('body').catch(() => '');
  const title = await page.title().catch(() => '');
  const loginFieldCount = await page
    .locator('input[type="email"], input[autocomplete="username"], input[name*="email" i], input[type="password"]')
    .count()
    .catch(() => 0);
  const emailCodeFieldCount = await page
    .locator('input[autocomplete="one-time-code"], input[name*="code" i], input[placeholder*="code" i]')
    .count()
    .catch(() => 0);
  const listingsMarkerCount = await page.getByText(/listings/i).count().catch(() => 0);
  return {
    url: page.url(),
    title,
    bodyText,
    loginFieldCount,
    emailCodeFieldCount,
    listingsMarkerCount,
  };
}

async function main() {
  const planOnly = hasFlag('--plan');
  loadEnvFile(DEFAULT_ENV_FILE);

  const proxySummary = summarizeProxyEnv(process.env);
  const portalUrl = argValue('--portal-url', DEFAULT_PORTAL_URL);
  const listingsUrl = argValue('--listings-url', DEFAULT_LISTINGS_URL);
  const headless = !hasFlag('--headful');
  const timeoutMs = Number(argValue('--timeout-ms', process.env.BM_PORTAL_TIMEOUT_MS || 90000));
  const lockPath = argValue('--lock', process.env.BM_LOCK_PATH || defaultLockPath());
  const baseDataDir = path.join(__dirname, '..', 'data');
  const profileDir = argValue('--profile-dir', path.join(baseDataDir, 'profiles', 'dataimpulse-portal-canary'));
  const runId = buildRunId();
  const screenshotDir = argValue(
    '--screenshot-dir',
    path.join(baseDataDir, 'screenshots', 'portal-canary', runId)
  );
  const runFile = argValue('--run-file', path.join(baseDataDir, 'runs', `${runId}.json`));
  const chromiumBin = resolveChromiumBinary();

  const plan = {
    ok: true,
    mode: planOnly ? 'plan' : 'execute',
    readOnly: true,
    mutatesPortal: false,
    provider: proxySummary.provider,
    proxy: {
      serverHost: proxySummary.serverHost,
      serverPort: proxySummary.serverPort,
      usernameCountryHint: proxySummary.usernameCountryHint,
    },
    envKeysPresent: proxySummary.envKeysPresent,
    portalUrl,
    listingsUrl,
    profileDir,
    screenshotDir,
    runFile,
    lockPath,
    headless,
    hardStops: [
      'missing PROXY_SERVER / PROXY_USER / PROXY_PASS',
      'missing Chromium binary',
      'login page appears and credentials are unavailable or not approved',
      'email-code prompt appears and no code is available',
      'any mutation-capable flow would require a click',
    ],
  };

  if (planOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (!chromiumBin) throw new Error('No Chromium/Chrome binary found');

  let playwright;
  try {
    playwright = require('playwright-core');
  } catch (error) {
    throw new Error(`playwright-core missing: ${error.message}`);
  }

  const lock = acquireLock(lockPath, buildLockRecord({ operation: 'dataimpulse-portal-canary' }));
  if (!lock.ok) {
    console.error(JSON.stringify({ ok: false, stage: 'lock', lock }, null, 2));
    process.exit(1);
  }

  let context = null;
  let exitCode = 1;
  try {
    ensureDir(profileDir);
    ensureDir(screenshotDir);
    ensureDir(path.dirname(runFile));

    const proxy = {
      server: normalizeProxyServer(process.env.PROXY_SERVER),
      username: process.env.PROXY_USER,
      password: process.env.PROXY_PASS,
    };

    const responseLog = [];
    const requestFailures = [];

    context = await playwright.chromium.launchPersistentContext(profileDir, {
      executablePath: chromiumBin,
      headless,
      proxy,
      viewport: { width: 1440, height: 900 },
      locale: 'en-GB',
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = context.pages()[0] || (await context.newPage());
    page.on('response', response => {
      try {
        const url = new URL(response.url());
        if (!/backmarket/i.test(url.hostname)) return;
        responseLog.push({
          host: url.hostname,
          path: url.pathname,
          status: response.status(),
          url: redactUrl(response.url()),
        });
      } catch (_) {}
    });
    page.on('requestfailed', request => {
      try {
        const url = new URL(request.url());
        if (!/backmarket/i.test(url.hostname)) return;
        requestFailures.push({
          host: url.hostname,
          path: url.pathname,
          errorText: request.failure() ? request.failure().errorText : 'unknown',
          url: redactUrl(request.url()),
        });
      } catch (_) {}
    });

    const gotoResponse = await page.goto(portalUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const landing = await capturePageState(page);
    const landingScreenshot = path.join(screenshotDir, '01-landing-or-login.png');
    await page.screenshot({ path: landingScreenshot, fullPage: true });

    let listings = null;
    let listingsScreenshot = null;
    let portalState = detectPortalState(landing);

    if (portalState.state === 'portal_reached' && !portalState.blocker) {
      await page.goto(listingsUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => null);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
      listings = await capturePageState(page);
      listingsScreenshot = path.join(screenshotDir, '02-listings-index.png');
      await page.screenshot({ path: listingsScreenshot, fullPage: true });
      const listingsState = detectPortalState(listings);
      if (listingsState.state !== 'unknown') portalState = listingsState;
    }

    const result = {
      ok: true,
      readOnly: true,
      canaryRan: true,
      runId,
      provider: proxySummary.provider,
      proxy: {
        serverHost: proxySummary.serverHost,
        serverPort: proxySummary.serverPort,
        usernameCountryHint: proxySummary.usernameCountryHint,
      },
      envKeysPresent: proxySummary.envKeysPresent,
      browser: {
        executablePath: chromiumBin,
        version: context.browser() ? context.browser().version() : null,
        headless,
      },
      initialNavigation: {
        requestedUrl: redactUrl(portalUrl),
        finalUrl: redactUrl(landing.url),
        mainResponseStatus: gotoResponse ? gotoResponse.status() : null,
        title: landing.title,
      },
      portalState,
      landing: {
        url: redactUrl(landing.url),
        title: landing.title,
        loginFieldCount: landing.loginFieldCount,
        emailCodeFieldCount: landing.emailCodeFieldCount,
        listingsMarkerCount: landing.listingsMarkerCount,
        screenshot: landingScreenshot,
      },
      listings: listings
        ? {
            url: redactUrl(listings.url),
            title: listings.title,
            loginFieldCount: listings.loginFieldCount,
            emailCodeFieldCount: listings.emailCodeFieldCount,
            listingsMarkerCount: listings.listingsMarkerCount,
            screenshot: listingsScreenshot,
          }
        : null,
      responses: responseLog.slice(-20),
      requestFailures: requestFailures.slice(-20),
      handoffRequired:
        portalState.blocker === 'login_required' || portalState.blocker === 'email_code_required',
    };

    fs.writeFileSync(runFile, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify(result, null, 2));
    exitCode = 0;
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          readOnly: true,
          canaryRan: false,
          error: error.message,
          provider: proxySummary.provider,
          proxy: {
            serverHost: proxySummary.serverHost,
            serverPort: proxySummary.serverPort,
            usernameCountryHint: proxySummary.usernameCountryHint,
          },
        },
        null,
        2
      )
    );
    exitCode = 1;
  } finally {
    if (context) await context.close().catch(() => {});
    releaseLock(lockPath, process.pid);
  }

  process.exit(exitCode);
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, canaryRan: false, error: error.message }, null, 2));
  process.exit(1);
});

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_ENV_FILE,
  DEFAULT_PORTAL_EMAIL,
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

async function firstVisible(locator) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return count > 0 ? locator.first() : null;
}

async function waitForSettledPage(page, quietMs = 2000) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(quietMs);
}

async function capturePageState(page) {
  const bodyText = await page.textContent('body').catch(() => '');
  const title = await page.title().catch(() => '');
  const emailFieldCount = await page
    .locator('input[type="email"], input[autocomplete="username"], input[name="email" i], input[name*="email" i]')
    .count()
    .catch(() => 0);
  const passwordFieldCount = await page.locator('input[type="password"]').count().catch(() => 0);
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
    emailFieldCount,
    passwordFieldCount,
    loginFieldCount,
    emailCodeFieldCount,
    listingsMarkerCount,
  };
}

function checkpointForReport(state, screenshot) {
  if (!state) return null;
  return {
    url: redactUrl(state.url),
    title: state.title,
    emailFieldCount: state.emailFieldCount,
    passwordFieldCount: state.passwordFieldCount,
    loginFieldCount: state.loginFieldCount,
    emailCodeFieldCount: state.emailCodeFieldCount,
    listingsMarkerCount: state.listingsMarkerCount,
    screenshot,
  };
}

async function submitEmailOnlyStep(page, email, timeoutMs) {
  const beforeUrl = page.url();
  const emailInput = await firstVisible(
    page.locator('input[type="email"], input[autocomplete="username"], input[name="email" i], input[name*="email" i]')
  );
  if (!emailInput) {
    return {
      attempted: true,
      submitted: false,
      email,
      reason: 'email_input_not_found',
      beforeUrl: redactUrl(beforeUrl),
      afterUrl: redactUrl(page.url()),
    };
  }

  await emailInput.fill('');
  await emailInput.fill(email);

  const form = page.locator('form').filter({ has: emailInput }).first();
  const submitButton =
    (await firstVisible(form.locator('button[type="submit"], input[type="submit"]'))) ||
    (await firstVisible(form.getByRole('button', { name: /next|continue|sign in|log in/i }))) ||
    (await firstVisible(page.getByRole('button', { name: /next|continue|sign in|log in/i })));

  if (submitButton) {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: Math.min(timeoutMs, 15000) }),
      submitButton.click(),
    ]);
  } else {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: Math.min(timeoutMs, 15000) }),
      emailInput.press('Enter'),
    ]);
  }

  await waitForSettledPage(page, 2500);

  return {
    attempted: true,
    submitted: true,
    email,
    reason: 'email_submitted',
    beforeUrl: redactUrl(beforeUrl),
    afterUrl: redactUrl(page.url()),
  };
}

async function main() {
  const planOnly = hasFlag('--plan');
  loadEnvFile(DEFAULT_ENV_FILE);

  const proxySummary = summarizeProxyEnv(process.env);
  const portalUrl = argValue('--portal-url', DEFAULT_PORTAL_URL);
  const listingsUrl = argValue('--listings-url', DEFAULT_LISTINGS_URL);
  const portalEmail = argValue('--portal-email', DEFAULT_PORTAL_EMAIL);
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
    portalEmail,
    profileDir,
    screenshotDir,
    runFile,
    lockPath,
    headless,
    hardStops: [
      'missing PROXY_SERVER / PROXY_USER / PROXY_PASS',
      'missing Chromium binary',
      'email-entry page appears and the requested seller email is unavailable or not approved',
      'password prompt appears after email submission',
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
    await waitForSettledPage(page, 3000);

    const initialState = await capturePageState(page);
    const initialScreenshot = path.join(screenshotDir, '01-initial-state.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });

    let listings = null;
    let listingsScreenshot = null;
    let emailSubmission = null;
    let postEmailState = null;
    let postEmailScreenshot = null;
    let portalState = detectPortalState(initialState);

    if (portalState.blocker === 'email_entry_required') {
      emailSubmission = await submitEmailOnlyStep(page, portalEmail, timeoutMs);
      postEmailState = await capturePageState(page);
      postEmailScreenshot = path.join(screenshotDir, '02-post-email-submit.png');
      await page.screenshot({ path: postEmailScreenshot, fullPage: true });
      portalState = detectPortalState(postEmailState);
    }

    if (portalState.state === 'portal_reached' && !portalState.blocker) {
      await page.goto(listingsUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => null);
      await waitForSettledPage(page, 2000);
      listings = await capturePageState(page);
      listingsScreenshot = path.join(screenshotDir, postEmailState ? '03-listings-index.png' : '02-listings-index.png');
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
        finalUrl: redactUrl(initialState.url),
        mainResponseStatus: gotoResponse ? gotoResponse.status() : null,
        title: initialState.title,
      },
      emailStep: {
        requestedEmail: portalEmail,
        attempted: Boolean(emailSubmission),
        submission: emailSubmission,
      },
      portalState,
      initialState: checkpointForReport(initialState, initialScreenshot),
      postEmailState: checkpointForReport(postEmailState, postEmailScreenshot),
      listings: listings
        ? checkpointForReport(listings, listingsScreenshot)
        : null,
      finalCheckpoint: checkpointForReport(listings || postEmailState || initialState, listingsScreenshot || postEmailScreenshot || initialScreenshot),
      responses: responseLog.slice(-20),
      requestFailures: requestFailures.slice(-20),
      handoffRequired:
        portalState.blocker === 'email_entry_required' ||
        portalState.blocker === 'password_required' ||
        portalState.blocker === 'login_required' ||
        portalState.blocker === 'email_code_required',
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

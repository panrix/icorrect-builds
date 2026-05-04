#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const tls = require('tls');
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
const { buildImapConfig } = require('../lib/mailbox-imap-contract');
const { pickFreshestLoginCode } = require('../lib/mailbox-code');

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

function formatImapSince(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

function escapeImapQuoted(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function formatIso(value) {
  return value instanceof Date ? value.toISOString() : value || null;
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
    .locator('input[autocomplete="one-time-code"], input[name*="code" i], input[placeholder*="code" i], input[inputmode="numeric"]')
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

async function maybePassChallenge(page, timeoutMs, screenshotDir) {
  const url = String(page.url() || '');
  const bodyText = await page.textContent('body').catch(() => '');
  const title = await page.title().catch(() => '');
  const looksLikeChallenge =
    /testchallengepage/i.test(url) ||
    /verify you are human|performing security verification|security verification/i.test(`${title}\n${bodyText}`);

  if (!looksLikeChallenge) {
    return { attempted: false, cleared: false, screenshot: null, reason: 'not_present' };
  }

  const screenshot = path.join(screenshotDir, '00-challenge-gate.png');
  await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});

  const selectors = [
    async () => page.getByRole('checkbox', { name: /verify you are human/i }).click({ timeout: 3000 }),
    async () => page.getByText(/verify you are human/i).click({ timeout: 3000 }),
  ];

  let clicked = false;
  for (const action of selectors) {
    try {
      await action();
      clicked = true;
      break;
    } catch (_) {}
  }

  if (!clicked) {
    for (const frame of page.frames()) {
      try {
        const checkbox = frame.getByRole('checkbox', { name: /verify you are human/i });
        if (await checkbox.count().catch(() => 0)) {
          await checkbox.first().click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch (_) {}

      try {
        const checkbox = frame.locator('input[type="checkbox"]');
        if (await checkbox.count().catch(() => 0)) {
          await checkbox.first().click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch (_) {}

      try {
        const label = frame.getByText(/verify you are human/i);
        if (await label.count().catch(() => 0)) {
          await label.first().click({ timeout: 3000 });
          clicked = true;
          break;
        }
      } catch (_) {}
    }
  }

  if (!clicked) {
    return { attempted: true, cleared: false, screenshot, reason: 'checkbox_not_clickable' };
  }

  await Promise.race([
    page.waitForURL(nextUrl => !/testchallengepage/i.test(nextUrl.toString()), {
      timeout: Math.min(timeoutMs, 25000),
    }),
    page.waitForTimeout(12000),
  ]).catch(() => {});
  await waitForSettledPage(page, 3500);

  const finalUrl = String(page.url() || '');
  const finalBody = await page.textContent('body').catch(() => '');
  const finalTitle = await page.title().catch(() => '');
  const stillBlocked =
    /testchallengepage/i.test(finalUrl) ||
    /verify you are human|performing security verification|security verification/i.test(`${finalTitle}\n${finalBody}`);

  return {
    attempted: true,
    cleared: !stillBlocked,
    screenshot,
    reason: stillBlocked ? 'challenge_persisted' : 'challenge_cleared',
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
    reason: 'email_submitted',
    beforeUrl: redactUrl(beforeUrl),
    afterUrl: redactUrl(page.url()),
  };
}

async function submitPasswordStep(page, password, timeoutMs) {
  const beforeUrl = page.url();
  const passwordInput = await firstVisible(page.locator('input[type="password"]'));
  if (!passwordInput) {
    return {
      attempted: true,
      submitted: false,
      reason: 'password_input_not_found',
      beforeUrl: redactUrl(beforeUrl),
      afterUrl: redactUrl(page.url()),
      submittedAt: null,
    };
  }

  await passwordInput.fill('');
  await passwordInput.fill(password);

  const form = page.locator('form').filter({ has: passwordInput }).first();
  const submitButton =
    (await firstVisible(form.locator('button[type="submit"], input[type="submit"]'))) ||
    (await firstVisible(form.getByRole('button', { name: /continue|sign in|log in|submit/i }))) ||
    (await firstVisible(page.getByRole('button', { name: /continue|sign in|log in|submit/i })));
  const submittedAt = new Date();

  if (submitButton) {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: Math.min(timeoutMs, 20000) }),
      submitButton.click(),
    ]);
  } else {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: Math.min(timeoutMs, 20000) }),
      passwordInput.press('Enter'),
    ]);
  }

  await waitForSettledPage(page, 3500);

  return {
    attempted: true,
    submitted: true,
    reason: 'password_submitted',
    beforeUrl: redactUrl(beforeUrl),
    afterUrl: redactUrl(page.url()),
    submittedAt: submittedAt.toISOString(),
  };
}

function parseHeaders(rawMessage) {
  const headerText = String(rawMessage || '').split(/\r?\n\r?\n/, 1)[0] || '';
  const lines = headerText.split(/\r?\n/);
  const folded = [];
  for (const line of lines) {
    if (/^\s/.test(line) && folded.length) {
      folded[folded.length - 1] += ` ${line.trim()}`;
    } else {
      folded.push(line);
    }
  }
  const headers = {};
  for (const line of folded) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[key] = value;
  }
  return headers;
}

function parseEmailAddress(value) {
  const match = String(value || '').match(/<([^>]+)>/);
  return (match ? match[1] : value || '').trim();
}

function extractTextFromRawMessage(rawMessage) {
  const parts = String(rawMessage || '').split(/\r?\n\r?\n/);
  parts.shift();
  return parts.join('\n\n');
}

class ImapSession {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.tagCounter = 0;
    this.closed = false;
    this.error = null;
    this.waiter = null;

    socket.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.flushWaiter();
    });
    socket.on('error', error => {
      this.error = error;
      this.flushWaiter();
    });
    socket.on('close', () => {
      this.closed = true;
      this.flushWaiter();
    });
  }

  flushWaiter() {
    if (this.waiter) {
      const resolve = this.waiter;
      this.waiter = null;
      resolve();
    }
  }

  waitForData() {
    if (this.error) return Promise.reject(this.error);
    if (this.buffer.length || this.closed) return Promise.resolve();
    return new Promise(resolve => {
      this.waiter = resolve;
    });
  }

  async readTagged(tag) {
    while (true) {
      if (this.error) throw this.error;
      const text = this.buffer.toString('latin1');
      const tagMatch = text.match(new RegExp(`(?:^|\\r?\\n)${tag} (?:OK|NO|BAD).*?(?:\\r?\\n)`, 'i'));
      if (tagMatch) {
        const start = tagMatch.index || 0;
        const end = start + tagMatch[0].length;
        const response = this.buffer.subarray(0, end);
        this.buffer = this.buffer.subarray(end);
        return response;
      }
      if (this.closed) throw new Error(`IMAP connection closed before ${tag} completed`);
      await this.waitForData();
    }
  }

  async readGreeting() {
    while (true) {
      const text = this.buffer.toString('latin1');
      const greetingMatch = text.match(/^.*?(?:\r?\n)/);
      if (greetingMatch) {
        const end = greetingMatch[0].length;
        const response = this.buffer.subarray(0, end);
        this.buffer = this.buffer.subarray(end);
        return response;
      }
      if (this.closed) throw new Error('IMAP connection closed before greeting');
      await this.waitForData();
    }
  }

  async command(command) {
    const tag = `A${String(++this.tagCounter).padStart(4, '0')}`;
    this.socket.write(`${tag} ${command}\r\n`);
    const responseBuffer = await this.readTagged(tag);
    const responseText = responseBuffer.toString('utf8');
    const finalLine = responseText
      .trim()
      .split(/\r?\n/)
      .pop();
    if (!new RegExp(`^${tag} OK\\b`, 'i').test(finalLine || '')) {
      throw new Error(`IMAP command failed: ${finalLine || command}`);
    }
    return responseBuffer;
  }
}

async function connectImap(env = process.env) {
  const configResult = buildImapConfig(env);
  if (!configResult.ok) {
    throw new Error(`Missing IMAP env: ${configResult.missing.join(', ')}`);
  }

  const socket = await new Promise((resolve, reject) => {
    const client = tls.connect(
      {
        host: configResult.config.server,
        port: configResult.config.port,
        servername: configResult.config.server,
        rejectUnauthorized: true,
      },
      () => resolve(client)
    );
    client.once('error', reject);
  });

  const session = new ImapSession(socket);
  await session.readGreeting();
  const user = escapeImapQuoted(env.JARVIS_EMAIL);
  const password = escapeImapQuoted(env.JARVIS_EMAIL_PW);
  const mailbox = escapeImapQuoted(env.BM_CODE_MAILBOX || 'INBOX');
  await session.command(`LOGIN "${user}" "${password}"`);
  await session.command(`EXAMINE "${mailbox}"`);
  return session;
}

function parseSearchIds(responseBuffer) {
  const text = responseBuffer.toString('utf8');
  const match = text.match(/\* SEARCH ?([0-9 ]*)\r?\n/i);
  if (!match) return [];
  return match[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite);
}

function parseFetchedMessage(responseBuffer) {
  const text = responseBuffer.toString('utf8');
  const literalMatch = text.match(/\{(\d+)\}\r\n/);
  const headers = parseHeaders(text);
  const internalDateMatch = text.match(/INTERNALDATE "([^"]+)"/i);
  if (!literalMatch) {
    const receivedAt = headers.date || (internalDateMatch ? internalDateMatch[1] : null);
    return {
      messageId: headers['message-id'] || null,
      from: parseEmailAddress(headers.from),
      to: parseEmailAddress(headers.to),
      subject: headers.subject || null,
      date: receivedAt ? new Date(receivedAt).toISOString() : null,
      text: text,
    };
  }
  const start = literalMatch.index + literalMatch[0].length;
  const literalLength = Number(literalMatch[1]);
  const rawMessage = responseBuffer.subarray(start, start + literalLength).toString('utf8');
  const rawHeaders = parseHeaders(rawMessage);
  const receivedAt = rawHeaders.date || (internalDateMatch ? internalDateMatch[1] : null);
  return {
    messageId: rawHeaders['message-id'] || headers['message-id'] || null,
    from: parseEmailAddress(rawHeaders.from || headers.from),
    to: parseEmailAddress(rawHeaders.to || headers.to),
    subject: rawHeaders.subject || headers.subject || null,
    date: receivedAt ? new Date(receivedAt).toISOString() : null,
    text: extractTextFromRawMessage(rawMessage),
  };
}

function looksLikeBackMarketCodeMessage(message, recipient) {
  const from = String(message.from || '').toLowerCase();
  const to = String(message.to || '').toLowerCase();
  const body = `${message.subject || ''}\n${message.text || ''}`.toLowerCase();
  if (recipient && to && to !== recipient) return false;
  if (!from.includes('backmarket')) return false;
  if (!/\b\d{6}\b/.test(body)) return false;
  return /code|verification|verify|security|sign in|login|log in|one-time/.test(body);
}

async function fetchLatestBackMarketCode({ env = process.env, after, recipient = DEFAULT_PORTAL_EMAIL }) {
  const sinceDate = new Date(Math.max(Date.now() - 12 * 60 * 60 * 1000, new Date(after || Date.now()).getTime() - 10 * 60 * 1000));
  const searchSince = formatImapSince(sinceDate);
  const searchCriteria = `TO "${escapeImapQuoted(recipient)}" FROM "backmarket" SINCE ${searchSince}`;
  const session = await connectImap(env);
  try {
    const searchResponse = await session.command(`SEARCH ${searchCriteria}`);
    const ids = parseSearchIds(searchResponse).slice(-5).reverse();
    const messages = [];
    for (const id of ids) {
      const fetchResponse = await session.command(`FETCH ${id} (INTERNALDATE BODY.PEEK[]<0.4096>)`);
      const message = parseFetchedMessage(fetchResponse);
      if (looksLikeBackMarketCodeMessage(message, String(recipient || '').toLowerCase())) {
        messages.push(message);
      }
    }

    const picked =
      pickFreshestLoginCode(messages, { after, recipient, subjectFilter: 'code' }) ||
      pickFreshestLoginCode(messages, { after, recipient, subjectFilter: '' }) ||
      null;

    return {
      attempted: true,
      searchCriteria: {
        to: recipient,
        fromContains: 'backmarket',
        since: sinceDate.toISOString(),
        maxFetched: 5,
      },
      matchedMessageCount: messages.length,
      codeFound: Boolean(picked && picked.code),
      code: picked ? picked.code : null,
      receivedAt: picked ? picked.receivedAt : null,
      subject: picked ? picked.subject : null,
      from: picked ? picked.from : null,
    };
  } finally {
    await session.command('LOGOUT').catch(() => {});
    session.socket.end();
  }
}

async function enterEmailCode(page, code) {
  const beforeUrl = page.url();
  const fields = page.locator(
    'input[autocomplete="one-time-code"], input[name*="code" i], input[placeholder*="code" i], input[inputmode="numeric"]'
  );
  const count = await fields.count().catch(() => 0);
  if (!count) {
    return { entered: false, reason: 'email_code_inputs_not_found' };
  }

  const visible = [];
  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    if (await field.isVisible().catch(() => false)) visible.push(field);
  }
  const targets = visible.length ? visible : [fields.first()];

  if (targets.length === 1) {
    await targets[0].fill('');
    await targets[0].fill(code);
  } else {
    const digits = String(code).split('');
    for (let index = 0; index < Math.min(targets.length, digits.length); index += 1) {
      await targets[index].fill('');
      await targets[index].fill(digits[index]);
    }
  }

  const autoSubmitted = await page
    .waitForURL(url => url.toString() !== beforeUrl, { timeout: 2500 })
    .then(() => true)
    .catch(() => false);
  if (autoSubmitted) {
    await waitForSettledPage(page, 5000);
    return { entered: true, reason: 'email_code_auto_submitted' };
  }

  const submitButton =
    (await firstVisible(page.getByRole('button', { name: /continue|verify|submit|sign in|log in/i }))) ||
    (await firstVisible(page.locator('button[type="submit"], input[type="submit"]')));

  if (submitButton) {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: 30000 }),
      submitButton.click(),
    ]);
  } else {
    await Promise.allSettled([
      page.waitForURL(url => url.toString() !== beforeUrl, { timeout: 30000 }),
      targets[Math.min(targets.length, String(code).length) - 1].press('Enter'),
    ]);
  }

  await waitForSettledPage(page, 5000);
  return { entered: true, reason: 'email_code_submitted' };
}

function buildMarkdownReport(result) {
  const lines = [
    '# Summary for Ricky',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Outcome',
    '',
    `- mailbox retrieval attempted: ${result.mailboxRetrievalAttempted ? 'yes' : 'no'}`,
    `- code found: ${result.codeFound ? 'yes' : 'no'}`,
    `- code entered: ${result.codeEntered ? 'yes' : 'no'}`,
    `- dashboard reached: ${result.dashboardReached ? 'yes' : 'no'}`,
    `- blocker: ${result.blocker || 'none'}`,
    '',
    '## Checkpoints',
    '',
    `- run id: \`${result.runId}\``,
    `- checkpoint json: \`${result.runFile}\``,
    `- initial screenshot: \`${result.initialScreenshot || 'not captured'}\``,
    `- challenge screenshot: \`${result.challengeScreenshot || 'not captured'}\``,
    `- post-email screenshot: \`${result.postEmailScreenshot || 'not captured'}\``,
    `- post-password screenshot: \`${result.postPasswordScreenshot || 'not captured'}\``,
    `- email-code screenshot: \`${result.codePromptScreenshot || 'not captured'}\``,
    `- post-code/dashboard screenshot: \`${result.dashboardScreenshot || 'not captured'}\``,
    '',
    '## Notes',
    '',
    `- final redacted url: \`${result.finalUrl || 'n/a'}\``,
    `- final state: \`${result.finalState || 'unknown'}\``,
    `- mailbox message matched: ${result.codeFound ? 'yes' : 'no'}`,
    `- mailbox metadata timestamp present: ${result.mailboxReceivedAt ? 'yes' : 'no'}`,
    '',
    '## Safety Confirmation',
    '',
    '- auth only',
    '- mailbox access stayed read-only',
    '- no portal mutation',
    '- no listing detail opens',
    '- no Save clicks',
    '- no inventory, price, publication, or SKU changes',
    '- no customer messages, returns, refunds, or warranty actions',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

async function main() {
  loadEnvFile(DEFAULT_ENV_FILE);

  const proxySummary = summarizeProxyEnv(process.env);
  const portalUrl = argValue('--portal-url', DEFAULT_PORTAL_URL);
  const listingsUrl = argValue('--listings-url', DEFAULT_LISTINGS_URL);
  const portalEmail = argValue('--portal-email', process.env.BM_PORTAL_EMAIL || DEFAULT_PORTAL_EMAIL);
  const timeoutMs = Number(argValue('--timeout-ms', process.env.BM_PORTAL_TIMEOUT_MS || 120000));
  const headless = !hasFlag('--headful');
  const lockPath = argValue('--lock', process.env.BM_LOCK_PATH || defaultLockPath());
  const baseDataDir = path.join(__dirname, '..', 'data');
  const profileDir = argValue('--profile-dir', path.join(baseDataDir, 'profiles', 'dataimpulse-portal-canary'));
  const runId = buildRunId();
  const screenshotDir = argValue(
    '--screenshot-dir',
    path.join(baseDataDir, 'screenshots', 'mailbox-code-login', runId)
  );
  const runFile = argValue('--run-file', path.join(baseDataDir, 'runs', `${runId}.json`));
  const reportFile = argValue(
    '--report-file',
    path.join(__dirname, '..', 'REPORT-DATAIMPULSE-MAILBOX-CODE-LOGIN-2026-04-26.md')
  );
  const chromiumBin = resolveChromiumBinary();

  if (!chromiumBin) throw new Error('No Chromium/Chrome binary found');
  if (!process.env.BM_PORTAL_PASSWORD) throw new Error('BM_PORTAL_PASSWORD missing');

  let playwright;
  try {
    playwright = require('playwright-core');
  } catch (error) {
    throw new Error(`playwright-core missing: ${error.message}`);
  }

  const lock = acquireLock(lockPath, buildLockRecord({ operation: 'dataimpulse-mailbox-code-login' }));
  if (!lock.ok) {
    throw new Error(`Runtime lock unavailable: ${lockPath}`);
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
    await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await waitForSettledPage(page, 3000);
    const challengeAttempt = await maybePassChallenge(page, timeoutMs, screenshotDir);

    const initialState = await capturePageState(page);
    const initialScreenshot = path.join(screenshotDir, '01-initial-state.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });

    let portalState = detectPortalState(initialState);
    let emailSubmission = null;
    let postEmailState = null;
    let postEmailScreenshot = null;
    let passwordSubmission = null;
    let postPasswordState = null;
    let postPasswordScreenshot = null;
    let codePromptScreenshot = null;
    let mailboxResult = {
      attempted: false,
      codeFound: false,
      code: null,
      receivedAt: null,
      subject: null,
      from: null,
      matchedMessageCount: 0,
      searchCriteria: null,
    };
    let codeEntry = { entered: false, reason: 'not_attempted' };
    let finalState = initialState;
    let finalScreenshot = initialScreenshot;

    if (portalState.blocker === 'email_entry_required') {
      emailSubmission = await submitEmailOnlyStep(page, portalEmail, timeoutMs);
      postEmailState = await capturePageState(page);
      postEmailScreenshot = path.join(screenshotDir, '02-post-email-submit.png');
      await page.screenshot({ path: postEmailScreenshot, fullPage: true });
      portalState = detectPortalState(postEmailState);
      finalState = postEmailState;
      finalScreenshot = postEmailScreenshot;
    }

    if (portalState.blocker === 'password_required') {
      passwordSubmission = await submitPasswordStep(page, process.env.BM_PORTAL_PASSWORD, timeoutMs);
      postPasswordState = await capturePageState(page);
      postPasswordScreenshot = path.join(
        screenshotDir,
        postEmailState ? '03-post-password-submit.png' : '02-post-password-submit.png'
      );
      await page.screenshot({ path: postPasswordScreenshot, fullPage: true });
      portalState = detectPortalState(postPasswordState);
      finalState = postPasswordState;
      finalScreenshot = postPasswordScreenshot;
    }

    if (portalState.blocker === 'email_code_required') {
      codePromptScreenshot = path.join(
        screenshotDir,
        postPasswordState ? '04-email-code-prompt.png' : postEmailState ? '03-email-code-prompt.png' : '02-email-code-prompt.png'
      );
      await page.screenshot({ path: codePromptScreenshot, fullPage: true });
      mailboxResult = await fetchLatestBackMarketCode({
        env: process.env,
        after: passwordSubmission && passwordSubmission.submittedAt ? new Date(new Date(passwordSubmission.submittedAt).getTime() - 120000).toISOString() : new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        recipient: portalEmail,
      });

      if (mailboxResult.codeFound && mailboxResult.code) {
        codeEntry = await enterEmailCode(page, mailboxResult.code);
        finalState = await capturePageState(page);
        finalScreenshot = path.join(screenshotDir, '05-post-code-dashboard.png');
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        portalState = detectPortalState(finalState);
      }
    }

    if (
      portalState.state === 'logged_in' &&
      !/dashboard|listings|bo-seller|bo_merchant/i.test(page.url())
    ) {
      await page.goto(listingsUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => null);
      await waitForSettledPage(page, 2500);
      finalState = await capturePageState(page);
      finalScreenshot = path.join(screenshotDir, '06-listings-landing.png');
      await page.screenshot({ path: finalScreenshot, fullPage: true });
      portalState = detectPortalState(finalState);
    }

    const result = {
      ok: portalState.state === 'logged_in',
      readOnly: true,
      authOnly: true,
      runId,
      runFile,
      portalEmail,
      provider: proxySummary.provider,
      mailboxRetrievalAttempted: Boolean(mailboxResult.attempted),
      codeFound: Boolean(mailboxResult.codeFound),
      codeEntered: Boolean(codeEntry.entered),
      dashboardReached: portalState.state === 'logged_in',
      blocker: portalState.state === 'logged_in' ? null : portalState.blocker || 'unknown',
      finalState: portalState.state,
      finalUrl: redactUrl((finalState || initialState).url),
      mailboxReceivedAt: formatIso(mailboxResult.receivedAt),
      challengeAttempt,
      initialState: checkpointForReport(initialState, initialScreenshot),
      postEmailState: checkpointForReport(postEmailState, postEmailScreenshot),
      postPasswordState: checkpointForReport(postPasswordState, postPasswordScreenshot),
      finalCheckpoint: checkpointForReport(finalState, finalScreenshot),
      mailbox: {
        attempted: Boolean(mailboxResult.attempted),
        codeFound: Boolean(mailboxResult.codeFound),
        matchedMessageCount: mailboxResult.matchedMessageCount,
        searchCriteria: mailboxResult.searchCriteria,
        receivedAt: formatIso(mailboxResult.receivedAt),
        subjectPresent: Boolean(mailboxResult.subject),
        fromPresent: Boolean(mailboxResult.from),
      },
      codeEntry,
      screenshots: {
        challengeScreenshot: challengeAttempt.screenshot,
        initialScreenshot,
        postEmailScreenshot,
        postPasswordScreenshot,
        codePromptScreenshot,
        dashboardScreenshot: finalScreenshot,
      },
      safety: {
        portalMutation: false,
        listingDetailOpened: false,
        saveClicked: false,
        customerActions: false,
        returnsRefundsWarrantyActions: false,
      },
    };

    fs.writeFileSync(runFile, `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(reportFile, buildMarkdownReport({
      ...result,
      reportFile,
      challengeScreenshot: challengeAttempt.screenshot,
      initialScreenshot,
      postEmailScreenshot,
      postPasswordScreenshot,
      codePromptScreenshot,
      dashboardScreenshot: finalScreenshot,
    }));
    console.log(JSON.stringify(result, null, 2));
    exitCode = result.ok ? 0 : 1;
  } finally {
    if (context) await context.close().catch(() => {});
    releaseLock(lockPath, process.pid);
  }

  process.exit(exitCode);
}

main().catch(error => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        readOnly: true,
        authOnly: true,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});

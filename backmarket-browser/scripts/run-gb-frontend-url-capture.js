#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { validateFrontendUrlCaptureRecord } = require('../lib/frontend-url-capture-contract');

function argValue(name, fallback = '') {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function loadRows(inputPath) {
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  return Array.isArray(payload) ? payload : payload.candidates || payload.rows || [];
}

function recordsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.captures)) return payload.captures;
  return [];
}

function readCaptureFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return recordsFromPayload(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

function writeCaptureFile(filePath, records) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({
    generated_at: new Date().toISOString(),
    records,
  }, null, 2) + '\n');
}

function captureRecordKey(record = {}) {
  return [
    String(record.listing_id || ''),
    String(record.sku || ''),
    String(record.product_id || ''),
    String(record.frontend_url || ''),
  ].join('|');
}

function parseSkuSpec(sku) {
  const parts = String(sku || '').trim().split('.').filter(Boolean);
  if (parts.length < 5) return null;
  const tail = parts.slice(3);
  let gpu = '';
  if (/^\d+C$/i.test(tail[0] || '')) gpu = tail.shift();
  return {
    family: parts[0] || '',
    model: parts[1] || '',
    chip: parts[2] || '',
    gpu,
    ram: tail[0] || '',
    storage: tail[1] || '',
    color: tail[2] || '',
    grade: tail[3] || '',
  };
}

function skuTokenAliases(token) {
  const raw = String(token || '').trim();
  if (!raw) return [];
  const compact = raw.toLowerCase().replace(/\s+/g, '');
  const aliases = new Set([compact]);
  if (/^\d+gb$/i.test(raw)) aliases.add(raw.replace(/gb/i, ' GB').toLowerCase().replace(/\s+/g, ''));
  if (/^grey$/i.test(raw)) {
    aliases.add('gray');
    aliases.add('spacegray');
    aliases.add('spacegrey');
  }
  if (/^\d+C$/i.test(raw)) aliases.add(`${raw.replace(/c/i, '')}core`);
  if (/^\d+C$/i.test(raw)) aliases.add(`${raw.replace(/c/i, '')}-core`);
  if (/^silver$/i.test(raw)) aliases.add('silver');
  if (/^starlight$/i.test(raw)) aliases.add('starlight');
  return Array.from(aliases).filter(Boolean);
}

function textHasToken(text, token) {
  const haystack = String(text || '').toLowerCase().replace(/\s+/g, '');
  return skuTokenAliases(token).some(alias => haystack.includes(alias));
}

function verifySkuAgainstSnapshot(sku, snapshot = {}, rowText = '') {
  const spec = parseSkuSpec(sku);
  if (!spec) {
    return { status: 'captured_unchecked', mismatches: [], checked: [] };
  }

  const publicText = [
    snapshot.spec_snapshot?.page_title,
    snapshot.spec_snapshot?.h1,
    snapshot.spec_snapshot?.visible_text,
  ].filter(Boolean).join(' ');
  const portalText = String(rowText || '');
  const portalTextWithoutSku = portalText.replace(String(sku || ''), '');
  const combinedText = `${portalTextWithoutSku}\n${publicText}`;
  const checks = [
    ['chip', spec.chip],
    ['gpu', spec.gpu],
    ['ram', spec.ram],
    ['storage', spec.storage],
    ['color', spec.color],
    ['grade', spec.grade],
  ].filter(([, value]) => value);

  const mismatches = [];
  const checked = [];
  for (const [field, expected] of checks) {
    const source = field === 'grade' ? portalText : combinedText;
    const ok = textHasToken(source, expected);
    checked.push({ field, expected, ok });
    if (!ok) mismatches.push({ field, expected });
  }

  if (mismatches.length) return { status: 'captured_spec_mismatch', mismatches, checked };
  return { status: 'captured_spec_match', mismatches: [], checked };
}

const DEFAULT_PORTAL_BASE = 'https://www.backmarket.co.uk/bo-seller/';
const DEFAULT_ACTIVE_LISTINGS_URL = 'https://www.backmarket.co.uk/bo-seller/listings/active?orderBy=-quantity&pageSize=10';

function normalizePortalBase(value = DEFAULT_PORTAL_BASE) {
  const raw = String(value || DEFAULT_PORTAL_BASE).trim();
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function sellerDetailUrl(listingId, portalBase = DEFAULT_PORTAL_BASE) {
  return new URL(`listings/${encodeURIComponent(listingId)}`, normalizePortalBase(portalBase)).toString();
}

function normalizeActiveListingsUrl(value = DEFAULT_ACTIVE_LISTINGS_URL) {
  const raw = String(value || DEFAULT_ACTIVE_LISTINGS_URL).trim();
  return raw || DEFAULT_ACTIVE_LISTINGS_URL;
}

async function pageState(page) {
  return page.evaluate(() => {
    const body = document.body ? document.body.innerText : '';
    return {
      url: window.location.href,
      title: document.title || '',
      text: body.slice(0, 4000),
    };
  });
}

function classifyBlockedState(state) {
  const haystack = `${state.url}\n${state.title}\n${state.text}`.toLowerCase();
  if (haystack.includes('cloudflare') || haystack.includes('checking your browser') || haystack.includes('just a moment')) {
    return 'cloudflare_or_human_check';
  }
  if (haystack.includes('sign in') || haystack.includes('log in') || haystack.includes('email') && haystack.includes('password')) {
    return 'login_required';
  }
  if (haystack.includes('verification code') || haystack.includes('2fa') || haystack.includes('two-factor')) {
    return 'email_code_required';
  }
  if (!haystack.includes('listing') && !haystack.includes('sku')) {
    return 'unexpected_page';
  }
  return '';
}

async function findGbFrontendHref(page) {
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const scored = anchors.map(anchor => {
      const href = anchor.href || '';
      if (!/backmarket\.co\.uk\/en-gb\/p\//i.test(href)) return null;
      const text = [
        anchor.innerText,
        anchor.getAttribute('aria-label'),
        anchor.getAttribute('title'),
        anchor.getAttribute('href'),
      ].filter(Boolean).join(' ');
      let score = 0;
      score += 100;
      if (/\bGB\b|United Kingdom|UK|en-gb/i.test(text)) score += 25;
      if (/dashboard|seller|bo-seller/i.test(href)) score -= 100;
      return { href, text: text.slice(0, 200), score };
    }).filter(entry => entry && entry.href && entry.score > 0);
    scored.sort((a, b) => b.score - a.score);
    return scored[0] || null;
  });
}

async function fillSkuFilter(page, sku) {
  const normalizedSku = String(sku || '').trim();
  if (!normalizedSku) return false;

  const selectors = [
    '#sku',
    'input[name="sku"]',
    'input[id="sku"]',
    'input[placeholder="SKU"]',
    'input[aria-label="SKU"]',
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector);
    if (await locator.count().catch(() => 0)) {
      await locator.first().fill(normalizedSku);
      return true;
    }
  }

  return page.evaluate(value => {
    const normalize = text => String(text || '').trim().toLowerCase();
    const inputs = Array.from(document.querySelectorAll('input'));
    const skuInput = inputs.find(input => {
      const attrs = [
        input.id,
        input.name,
        input.getAttribute('aria-label'),
        input.getAttribute('placeholder'),
        input.closest('label')?.innerText,
      ].map(normalize);
      return attrs.some(attr => attr === 'sku' || attr.includes('sku'));
    });
    if (!skuInput) return false;
    skuInput.focus();
    skuInput.value = value;
    skuInput.dispatchEvent(new Event('input', { bubbles: true }));
    skuInput.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, normalizedSku);
}

async function clickApplyFilters(page) {
  const roleButton = page.getByRole('button', { name: 'Apply filters', exact: true });
  if (await roleButton.count().catch(() => 0)) {
    await roleButton.first().click();
    return true;
  }

  try {
    return await page.evaluate(() => {
      const normalize = text => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const controls = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
      const button = controls.find(control => {
        const label = control.tagName === 'INPUT'
          ? control.getAttribute('value')
          : control.innerText || control.textContent || control.getAttribute('aria-label');
        return normalize(label) === 'apply filters';
      });
      if (!button) return false;
      button.click();
      return true;
    });
  } catch (error) {
    if (/execution context was destroyed|navigation/i.test(String(error?.message || error))) return true;
    throw error;
  }
}

async function waitForSkuResult(page, sku, timeoutMs = 15000) {
  const normalizedSku = String(sku || '').trim();
  if (!normalizedSku) return;
  await page.waitForFunction(expectedSku => {
    const bodyText = document.body ? document.body.innerText : '';
    if (bodyText.includes(expectedSku)) return true;
    if (/no result|no listing|no listings|nothing found/i.test(bodyText)) return true;
    return false;
  }, normalizedSku, { timeout: timeoutMs }).catch(() => {});
}

async function extractListingRowSnapshot(page, candidate) {
  return page.evaluate(input => {
    const expectedSku = String(input.sku || '').trim();
    const expectedListingId = String(input.listing_id || '').trim();
    const expectedProductId = String(input.product_id || '').trim();
    const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();
    const includesExactSku = text => expectedSku && normalizeText(text).includes(expectedSku);
    const isProductHref = href => /backmarket\.co\.uk\/en-gb\/p\//i.test(String(href || ''));

    const findContainer = seed => {
      let node = seed;
      let best = null;
      for (let depth = 0; node && depth < 10; depth += 1, node = node.parentElement) {
        const text = normalizeText(node.innerText || node.textContent || '');
        const links = Array.from(node.querySelectorAll('a[href]')).filter(anchor => isProductHref(anchor.href));
        if (!links.length) continue;
        if (text.length > 12000) break;
        const score =
          (expectedListingId && text.includes(expectedListingId) ? 60 : 0) +
          (expectedProductId && links.some(anchor => anchor.href.includes(expectedProductId)) ? 50 : 0) +
          (/\bSKU\b/i.test(text) ? 20 : 0) +
          Math.max(0, 20 - depth) -
          Math.floor(text.length / 2000);
        const entry = { node, text, links, score };
        if (!best || entry.score > best.score || (entry.score === best.score && entry.text.length < best.text.length)) {
          best = entry;
        }
      }
      return best;
    };

    const skuSeeds = Array.from(document.querySelectorAll('body *'))
      .filter(element => includesExactSku(element.innerText || element.textContent || ''))
      .slice(0, 100);

    const candidates = skuSeeds.map(findContainer).filter(Boolean);

    if (!candidates.length && expectedSku && includesExactSku(document.body?.innerText || '')) {
      const productLinks = Array.from(document.querySelectorAll('a[href]')).filter(anchor => isProductHref(anchor.href));
      if (productLinks.length === 1) {
        candidates.push({
          node: document.body,
          text: normalizeText(document.body.innerText || ''),
          links: productLinks,
          score: 1,
        });
      }
    }

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.text.length - b.text.length;
    });

    const unique = [];
    const seen = new Set();
    for (const entry of candidates) {
      const signature = entry.links.map(anchor => anchor.href).sort().join('|');
      if (seen.has(signature)) continue;
      seen.add(signature);
      unique.push(entry);
    }

    if (!unique.length) {
      return {
        ok: false,
        reason: expectedSku ? 'sku_row_not_found' : 'sku_required',
        page_text: normalizeText(document.body?.innerText || '').slice(0, 1200),
      };
    }

    const strong = unique.filter(entry => {
      if (!expectedProductId) return true;
      return entry.links.some(anchor => anchor.href.includes(expectedProductId)) || entry.text.includes(expectedProductId);
    });
    const pool = strong.length ? strong : unique;

    if (pool.length > 1) {
      const hrefSets = new Set(pool.map(entry => entry.links.map(anchor => anchor.href).sort().join('|')));
      if (hrefSets.size > 1) {
        return {
          ok: false,
          reason: 'ambiguous_sku_results',
          matches: pool.slice(0, 5).map(entry => ({
            text: entry.text.slice(0, 800),
            hrefs: entry.links.map(anchor => anchor.href),
          })),
        };
      }
    }

    const selected = pool[0];
    const gbLinks = selected.links
      .map(anchor => ({
        href: anchor.href,
        text: normalizeText([
          anchor.innerText,
          anchor.getAttribute('aria-label'),
          anchor.getAttribute('title'),
          anchor.getAttribute('href'),
        ].filter(Boolean).join(' ')),
      }))
      .filter(link => link.href);

    gbLinks.sort((a, b) => {
      const score = link => {
        let value = 0;
        if (/\bGB\b|United Kingdom|UK|en-gb/i.test(link.text)) value += 10;
        if (expectedProductId && link.href.includes(expectedProductId)) value += 20;
        return value;
      };
      return score(b) - score(a);
    });

    return {
      ok: true,
      seller_portal_url: window.location.href,
      frontend_href: gbLinks[0]?.href || '',
      row_text: selected.text.slice(0, 2000),
      match_count: unique.length,
      link_count: gbLinks.length,
      gb_links: gbLinks.slice(0, 5),
    };
  }, {
    sku: candidate.sku,
    listing_id: candidate.listing_id,
    product_id: candidate.product_id,
  });
}

async function capturePublicSnapshot(context, href) {
  const publicPage = await context.newPage();
  try {
    await publicPage.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await publicPage.waitForTimeout(2500);
    return await publicPage.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      return {
        frontend_url: window.location.href,
        spec_snapshot: {
          page_title: document.title || '',
          h1,
          visible_text: text.slice(0, 1200),
        },
      };
    });
  } finally {
    await publicPage.close().catch(() => {});
  }
}

async function captureCandidate(context, candidate, options = {}) {
  if (!candidate.sku) {
    return { ok: false, skipped: true, reason: 'sku_required_for_active_listings_capture', candidate };
  }

  const page = await context.newPage();
  try {
    const sourceUrl = normalizeActiveListingsUrl(options.activeListingsUrl);
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const state = await pageState(page);
    const blocker = classifyBlockedState(state);
    if (blocker) {
      return { ok: false, blocked: true, reason: blocker, candidate, current_url: state.url };
    }

    const filterFilled = await fillSkuFilter(page, candidate.sku);
    if (!filterFilled) {
      return { ok: false, reason: 'sku_filter_not_found', candidate, seller_portal_url: state.url };
    }

    const filterApplied = await clickApplyFilters(page);
    if (!filterApplied) {
      return { ok: false, reason: 'apply_filters_not_found', candidate, seller_portal_url: state.url };
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await waitForSkuResult(page, candidate.sku);

    const rowSnapshot = await extractListingRowSnapshot(page, candidate);
    if (!rowSnapshot.ok) {
      return { ok: false, reason: rowSnapshot.reason, candidate, seller_portal_url: rowSnapshot.seller_portal_url || page.url(), details: rowSnapshot };
    }

    if (!rowSnapshot.frontend_href) {
      return { ok: false, reason: 'missing_gb_flag', candidate, seller_portal_url: rowSnapshot.seller_portal_url || page.url(), details: rowSnapshot };
    }

    const snapshot = await capturePublicSnapshot(context, rowSnapshot.frontend_href);
    const specVerification = verifySkuAgainstSnapshot(candidate.sku, snapshot, rowSnapshot.row_text);
    const record = {
      listing_id: String(candidate.listing_id),
      sku: String(candidate.sku || ''),
      product_id: String(candidate.product_id || ''),
      seller_portal_url: rowSnapshot.seller_portal_url || state.url,
      frontend_url: snapshot.frontend_url,
      captured_at: new Date().toISOString(),
      spec_snapshot: {
        ...snapshot.spec_snapshot,
        portal_row_text: rowSnapshot.row_text || '',
        sku_spec_check: JSON.stringify(specVerification.checked || []),
        sku_spec_mismatches: JSON.stringify(specVerification.mismatches || []),
      },
      verification_status: specVerification.status,
      related_items: candidate.related_items || [],
    };

    const validation = validateFrontendUrlCaptureRecord(record);
    return validation.ok
      ? { ok: true, record }
      : { ok: false, reason: 'capture_record_invalid', errors: validation.errors, record };
  } finally {
    await page.close().catch(() => {});
  }
}

async function waitForAuthClear(page, { timeoutMs = 300000, pollMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastState = await pageState(page);
  let lastBlocker = classifyBlockedState(lastState);
  while (Date.now() < deadline) {
    if (!lastBlocker) return { ok: true, state: lastState };
    await page.waitForTimeout(pollMs);
    lastState = await pageState(page);
    lastBlocker = classifyBlockedState(lastState);
  }
  return { ok: false, reason: lastBlocker || 'auth_not_cleared', state: lastState };
}

async function captureCandidateWithAuthWait(context, candidate, options = {}) {
  const result = await captureCandidate(context, candidate, options);
  if (!result.blocked || !options.waitAuth) return result;

  const page = await context.newPage();
  try {
    await page.goto(result.current_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const clear = await waitForAuthClear(page, {
      timeoutMs: options.waitAuthMs,
      pollMs: options.waitAuthPollMs,
    });
    if (!clear.ok) {
      return {
        ...result,
        wait_auth_attempted: true,
        wait_auth_result: clear,
      };
    }
  } finally {
    await page.close().catch(() => {});
  }

  return {
    ...(await captureCandidate(context, candidate, options)),
    wait_auth_attempted: true,
    wait_auth_result: { ok: true },
  };
}

async function main() {
  const inputPath = argValue('--input', path.join(__dirname, '..', 'data', 'exports', 'gb-frontend-url-capture-input.json'));
  const outPath = argValue('--out', path.join(__dirname, '..', 'data', 'exports', 'gb-frontend-url-captures.json'));
  const cdpHttp = argValue('--cdp-http', process.env.BU_CDP_HTTP || 'http://127.0.0.1:9333');
  const portalBase = normalizePortalBase(argValue('--portal-base', process.env.BM_SELLER_PORTAL_BASE || DEFAULT_PORTAL_BASE));
  const limit = Number(argValue('--limit', '0'));
  const planOnly = process.argv.includes('--plan');
  const waitAuth = process.argv.includes('--wait-auth');
  const waitAuthMs = Number(argValue('--wait-auth-ms', process.env.BM_WAIT_AUTH_MS || '300000'));

  const candidates = loadRows(inputPath);
  const runnable = candidates.filter(candidate => candidate.sku);
  const plan = {
    ok: true,
    mode: planOnly ? 'plan' : 'capture',
    readOnly: true,
    mutations: false,
    cdpHttp,
    portalBase,
    activeListingsUrl: normalizeActiveListingsUrl(argValue('--active-listings-url', process.env.BM_ACTIVE_LISTINGS_URL || DEFAULT_ACTIVE_LISTINGS_URL)),
    inputPath,
    outPath,
    candidateCount: candidates.length,
    directListingCandidateCount: candidates.filter(candidate => candidate.listing_id).length,
    skuOnlyCandidateCount: candidates.filter(candidate => !candidate.listing_id).length,
    limit,
    waitAuth,
    waitAuthMs,
  };

  if (planOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const browser = await chromium.connectOverCDP(cdpHttp);
  const context = browser.contexts()[0] || await browser.newContext();
  const existing = readCaptureFile(outPath);
  const seen = new Set(existing.map(captureRecordKey));
  const results = [];
  const toRun = limit > 0 ? runnable.slice(0, limit) : runnable;

  for (const candidate of toRun) {
    const result = await captureCandidateWithAuthWait(context, candidate, {
      portalBase,
      activeListingsUrl: plan.activeListingsUrl,
      waitAuth,
      waitAuthMs,
      waitAuthPollMs: 2000,
    });
    results.push(result);
    if (result.ok) {
      const key = captureRecordKey(result.record);
      if (!seen.has(key)) {
        existing.push(result.record);
        seen.add(key);
        writeCaptureFile(outPath, existing);
      }
    }
    if (result.blocked) break;
  }

  await browser.close().catch(() => {});
  const summary = {
    ...plan,
    captured: results.filter(result => result.ok).length,
    blocked: results.find(result => result.blocked) || null,
    skipped: candidates.length - runnable.length,
    results,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.blocked ? 2 : 0);
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});

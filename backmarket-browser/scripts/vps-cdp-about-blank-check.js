#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { acquireLock, releaseLock, buildLockRecord, defaultLockPath } = require('../lib/runtime-lock');
const { resolveHarnessBin } = require('../lib/harness-path');
const {
  DEFAULT_CDP_HTTP,
  DEFAULT_PROFILE_DIR,
  normalizeCdpHttp,
  fetchCdpWebSocketUrl,
  resolveChromiumBinary,
  buildChromiumArgs,
  buildHarnessProbeInput,
  assertNeutralPageInfo,
} = require('../lib/vps-cdp-harness');

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const found = process.argv.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCdp(cdpHttp, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      return await fetchCdpWebSocketUrl(cdpHttp);
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }
  throw lastError || new Error('Timed out waiting for CDP');
}

async function main() {
  const planOnly = process.argv.includes('--plan');
  const startChromium = process.argv.includes('--start-chromium');
  const cdpHttp = normalizeCdpHttp(argValue('--cdp-http', process.env.BU_CDP_HTTP || DEFAULT_CDP_HTTP));
  const cdpPort = Number(new URL(cdpHttp).port || 9222);
  const profileDir = argValue('--profile-dir', process.env.BM_CHROMIUM_PROFILE_DIR || DEFAULT_PROFILE_DIR);
  const lockPath = argValue('--lock', process.env.BM_LOCK_PATH || defaultLockPath());
  const harnessBin = argValue('--harness-bin', resolveHarnessBin());
  const waitMs = Number(argValue('--wait-ms', process.env.BM_CDP_WAIT_MS || 10000));

  const plan = {
    ok: true,
    mode: planOnly ? 'plan' : 'execute-neutral-about-blank',
    readOnly: true,
    livePortalAccess: false,
    opensBackMarket: false,
    mutations: false,
    cdpHttp,
    cdpPort,
    profileDir,
    lockPath,
    harnessBin,
    startChromium,
    probe: 'browser-harness ensure_real_tab(); page_info(); expected URL about:blank',
    hardStops: [
      'runtime lock exists',
      'browser-harness binary missing',
      'CDP endpoint not localhost',
      'CDP websocket unavailable',
      'browser-harness output does not confirm about:blank',
      'any Back Market URL/text appears in neutral probe output',
    ],
  };

  if (planOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  const lock = acquireLock(lockPath, buildLockRecord({ operation: 'vps-cdp-about-blank-check' }));
  if (!lock.ok) {
    console.error(JSON.stringify({ ok: false, stage: 'lock', lock }, null, 2));
    process.exit(1);
  }

  let child = null;
  let exitCode = 1;
  try {
    if (!fs.existsSync(harnessBin)) throw new Error(`browser-harness missing: ${harnessBin}`);

    let ws = process.env.BU_CDP_WS || null;
    if (!ws && startChromium) {
      const chromiumBin = resolveChromiumBinary();
      if (!chromiumBin) throw new Error('No Chromium/Chrome binary found');
      fs.mkdirSync(profileDir, { recursive: true });
      const args = buildChromiumArgs({ cdpPort, profileDir, headless: true });
      const logPath = path.join(__dirname, '..', 'data', 'runs', `chromium-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
      const out = fs.openSync(logPath, 'a');
      child = spawn(chromiumBin, args, { stdio: ['ignore', out, out], detached: false });
    }

    if (!ws) ws = await waitForCdp(cdpHttp, waitMs);

    const probe = spawnSync(harnessBin, [], {
      input: buildHarnessProbeInput(),
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, BU_CDP_WS: ws },
    });

    const combined = `${probe.stdout || ''}\n${probe.stderr || ''}`;
    const neutral = assertNeutralPageInfo(combined);
    const result = {
      ok: probe.status === 0 && neutral.ok,
      readOnly: true,
      livePortalAccess: false,
      openedBackMarket: false,
      cdpHttp,
      cdpWebSocketDiscovered: Boolean(ws),
      harnessStatus: probe.status,
      neutral,
      stdoutPreview: (probe.stdout || '').slice(0, 2000),
      stderrPreview: (probe.stderr || '').slice(0, 2000),
    };
    console.log(JSON.stringify(result, null, 2));
    exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, readOnly: true, livePortalAccess: false, openedBackMarket: false, error: error.message }, null, 2));
    exitCode = 1;
  } finally {
    if (child && !child.killed) child.kill('SIGTERM');
    releaseLock(lockPath, process.pid);
  }
  process.exit(exitCode);
}

main();

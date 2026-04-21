#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = fs.promises;
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { execFile, spawn } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

const sharedDir = path.resolve(__dirname, "..");
const agentsDir = path.resolve(sharedDir, "..");
const stateDir = path.join(sharedDir, "state");
const logsDir = path.join(sharedDir, "logs");
const recordsDir = path.join(sharedDir, "records");
const incidentsDir = path.join(recordsDir, "incidents");
const bridgeLockedFlag = path.join(stateDir, "bridge-locked.flag");
const bridgeActivityPath = path.join(stateDir, "bridge-activity.json");
const infraSnapshotPath = path.join(stateDir, "infra-snapshot.json");
const bridgeTickLockPath = path.join(stateDir, "bridge-tick.lock");
const handoffEventsPath = path.join(stateDir, "handoff-events.jsonl");
const skillInvocationsPath = path.join(stateDir, "skill-invocations.jsonl");
const silentModeQueuePath = path.join(logsDir, "silent-mode-queue.jsonl");
const writeStatePath = path.join(sharedDir, "bin", "write-state");
const sweepRuntimePath = path.join(sharedDir, "bin", "sweep-runtime");
const queueValidatorPath = path.join(sharedDir, "monday", "queue-validator.js");
const telegramModulePath = pathToFileURL(path.join(agentsDir, "..", "alex-triage-rebuild", "lib", "telegram.js")).href;
const mondayModulePath = pathToFileURL(path.join(agentsDir, "..", "alex-triage-rebuild", "lib", "monday.js")).href;
const HANDOFF_CANCEL_RE = /^(no|wait|cancel|undo|don'?t)\b/i;
const LOCKED_REPLY = "Bridge locked. Contact owner on another channel.";
const DISK_FULL_REPLY = "Bridge paused: disk usage is above 95%. Clear space, then retry.";
const TZ_REQUIRED = "Asia/Singapore";
const MAX_TELEGRAM_TEXT = 3500;
const TICK_INTERVAL_MS = 60_000;
const AUTO_HANDOFF_IDLE_MS = 30 * 60 * 1000;
const AUTO_HANDOFF_WARN_MS = 60_000;
const STUCK_REPLY_MS = 5 * 60 * 1000;
const STUCK_HASH_POLL_MS = 30_000;

let queueValidator = null;
let bridgeStartedAt = Date.now();
let tickCount = 0;
let stopping = false;
let tickPromise = null;
let tickLockChild = null;
let tickInterval = null;
let pollingPromise = null;
let telegramClient = null;
let mondayClient = null;
let locked = false;
let activityState = {
  last_user_message_ts: null,
  last_window_silence_ms: null,
  bridge_uptime_seconds: 0
};
let state = {
  allowedUserId: null,
  agentName: null,
  tmuxSession: null,
  agentDir: null,
  workingStatePath: null,
  mainTarget: null,
  consecutiveFailCount: 0,
  silentMode: false,
  pendingRecoveryChoice: null,
  autoHandoffWarning: null,
  pendingWrites: new Set(),
  recentIncoming: [],
  recentHashMismatchTs: [],
  diskPause: false,
  longPollOffset: 0,
  activeRequests: new Map()
};

function trackWrite(promise) {
  state.pendingWrites.add(promise);
  promise.finally(() => state.pendingWrites.delete(promise));
  return promise;
}

function nowIso() {
  return new Date().toISOString();
}

function sgTimestampForFilename(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_REQUIRED,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}-${parts.minute}-${parts.second}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRequiredEnv() {
  const required = [
    "TELEGRAM_BOT_TOKEN",
    "ALLOWED_USER_ID",
    "KILL_HMAC",
    "TZ",
    "AGENT_NAME",
    "TMUX_SESSION"
  ];
  const missing = required.filter((name) => !String(process.env[name] || "").trim());
  if (missing.length > 0 || process.env.TZ !== TZ_REQUIRED) {
    console.error(`bridge boot refused: missing/invalid env (${missing.join(", ") || "TZ"})`);
    process.exit(1);
  }

  const allowedUserId = Number.parseInt(process.env.ALLOWED_USER_ID, 10);
  if (!Number.isInteger(allowedUserId)) {
    console.error("bridge boot refused: ALLOWED_USER_ID must be an integer");
    process.exit(1);
  }

  const argvAgent = process.argv.find((arg) => arg.startsWith("--agent="));
  if (argvAgent) {
    const argValue = argvAgent.slice("--agent=".length);
    if (argValue && argValue !== process.env.AGENT_NAME) {
      console.error("bridge boot refused: --agent does not match AGENT_NAME");
      process.exit(1);
    }
  }

  state.allowedUserId = allowedUserId;
  state.agentName = process.env.AGENT_NAME;
  state.tmuxSession = process.env.TMUX_SESSION;
  state.agentDir = path.join(agentsDir, state.agentName);
  state.workingStatePath = path.join(state.agentDir, "WORKING-STATE.md");
  state.mainTarget = `${state.tmuxSession}:main`;
}

async function ensureDirs() {
  await Promise.all([
    fsp.mkdir(stateDir, { recursive: true }),
    fsp.mkdir(logsDir, { recursive: true }),
    fsp.mkdir(recordsDir, { recursive: true }),
    fsp.mkdir(incidentsDir, { recursive: true })
  ]);
}

function sortObjectKeys(input) {
  if (Array.isArray(input)) {
    return input.map(sortObjectKeys);
  }
  if (!input || typeof input !== "object") {
    return input;
  }
  return Object.keys(input)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(input[key]);
      return acc;
    }, {});
}

function minimalYamlValue(raw) {
  const value = raw.trim();
  if (value === "" || value === "null" || value === "~") {
    return null;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return Number.parseFloat(value);
  }
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  return value;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) {
    return { frontmatter: null, body: text };
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: null, body: text };
  }
  const yamlBlock = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, "");
  const frontmatter = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) {
      continue;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Unsupported frontmatter line: ${line}`);
    }
    const key = line.slice(0, colonIndex).trim();
    const raw = line.slice(colonIndex + 1);
    frontmatter[key] = minimalYamlValue(raw);
  }
  return { frontmatter, body };
}

function computeVersionHash(frontmatter) {
  const copy = { ...frontmatter };
  delete copy._version_hash;
  const canonical = JSON.stringify(sortObjectKeys(copy));
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function appendJsonl(filePath, value) {
  const line = `${JSON.stringify(value)}\n`;
  await trackWrite(fsp.mkdir(path.dirname(filePath), { recursive: true }).then(() => fsp.appendFile(filePath, line, "utf8")));
}

async function rewriteJsonl(filePath, mapper) {
  const tempPath = `${filePath}.tmp-${crypto.randomUUID()}`;
  const contents = await fsp.readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  const lines = contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const updated = mapper(lines);
  const output = updated.map((entry) => JSON.stringify(entry)).join("\n");
  const writePromise = (async () => {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(tempPath, output ? `${output}\n` : "", "utf8");
    await fsp.rename(tempPath, filePath);
  })();
  try {
    await trackWrite(writePromise);
  } finally {
    await fsp.rm(tempPath, { force: true }).catch(() => {});
  }
}

async function writeIncident(kind, bodyLines, options = {}) {
  const tsLabel = options.tsLabel || sgTimestampForFilename();
  const incidentPath = path.join(incidentsDir, `${kind}-${tsLabel}.md`);
  if (options.skipIfExists) {
    try {
      await fsp.access(incidentPath);
      return incidentPath;
    } catch {
      // continue
    }
  }
  const body = Array.isArray(bodyLines) ? bodyLines.join("\n") : String(bodyLines);
  await trackWrite(
    fsp.writeFile(
      incidentPath,
      `# ${kind}\n\n- detected_at: ${nowIso()}\n- agent: ${state.agentName}\n\n${body}\n`,
      "utf8"
    )
  );
  return incidentPath;
}

async function writeStateAtomically(targetPath, value, options = {}) {
  const tempPath = path.join(os.tmpdir(), `bridge-state-${crypto.randomUUID()}.tmp`);
  const content = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
  await fsp.writeFile(tempPath, content, "utf8");
  try {
    const env = {
      ...process.env,
      WRITE_STATE_LOCK_TIMEOUT: String(options.lockTimeoutSeconds || 10)
    };
    await execFileAsync(writeStatePath, [targetPath, tempPath], {
      env,
      cwd: sharedDir,
      maxBuffer: 1024 * 1024
    });
  } finally {
    await fsp.rm(tempPath, { force: true }).catch(() => {});
  }
}

async function runCommand(command, args, options = {}) {
  const result = await execFileAsync(command, args, {
    cwd: options.cwd || sharedDir,
    env: options.env || process.env,
    maxBuffer: options.maxBuffer || 1024 * 1024,
    timeout: options.timeout || 0
  });
  return (result.stdout || "").trim();
}

function semverAtLeast(current, required) {
  const currentParts = current.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const requiredParts = required.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(currentParts.length, requiredParts.length);
  for (let index = 0; index < length; index += 1) {
    const currentPart = currentParts[index] || 0;
    const requiredPart = requiredParts[index] || 0;
    if (currentPart > requiredPart) {
      return true;
    }
    if (currentPart < requiredPart) {
      return false;
    }
  }
  return true;
}

async function verifyTmuxVersion() {
  const raw = await runCommand("tmux", ["-V"]);
  const match = raw.match(/(\d+(?:\.\d+)+)/);
  const version = match ? match[1] : "0.0.0";
  if (!semverAtLeast(version, "3.3")) {
    console.error(`bridge boot refused: tmux ${version} < 3.3`);
    process.exit(2);
  }
  return raw;
}

async function loadBridgeModules() {
  const telegramModule = await import(telegramModulePath);
  const mondayModule = await import(mondayModulePath);
  const TelegramClient = telegramModule.TelegramClient;
  const MondayClient = mondayModule.MondayClient;
  telegramClient = new TelegramClient({
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: String(state.allowedUserId),
    baseUrl: "https://api.telegram.org",
    publicBaseUrl: "https://example.invalid"
  });
  if (process.env.MONDAY_TOKEN) {
    mondayClient = new MondayClient({
      baseUrl: "https://api.monday.com/v2",
      token: process.env.MONDAY_TOKEN,
      boardId: 0
    });
  }
}

async function loadExistingActivity() {
  const existing = await readJsonIfExists(bridgeActivityPath);
  if (existing && typeof existing === "object") {
    activityState = {
      ...activityState,
      ...existing
    };
  }
}

async function runStartupSweep() {
  try {
    await runCommand(sweepRuntimePath, [], {
      env: {
        ...process.env,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_RICKY_ID: String(state.allowedUserId)
      }
    });
  } catch (error) {
    console.error(`startup sweep failed: ${error.message}`);
  }
}

async function ensureTmuxSession() {
  const sessionExists = await runCommand("tmux", ["has-session", "-t", state.tmuxSession]).then(
    () => true,
    () => false
  );
  if (!sessionExists) {
    await runCommand("tmux", ["new-session", "-d", "-s", state.tmuxSession, "-n", "main", "-c", state.agentDir]);
  }

  await runCommand("tmux", ["rename-window", "-t", `${state.tmuxSession}:0`, "main"]).catch(() => {});
  const command = await runCommand("tmux", ["display-message", "-p", "-t", `${state.tmuxSession}:0`, "#{pane_current_command}"]).catch(
    () => ""
  );
  if (command !== "claude") {
    await runCommand("tmux", ["send-keys", "-t", state.mainTarget, "claude", "Enter"]);
    await sleep(1200);
  }
}

async function lockBridge(reason, detail) {
  locked = true;
  await trackWrite(fsp.writeFile(bridgeLockedFlag, `${nowIso()} ${reason}\n`, "utf8"));
  console.log(`bridge locked: ${reason}`);
  if (detail) {
    console.log(detail);
  }
}

async function maybeEnableStartupLock() {
  if (process.env.BRIDGE_LOCKED === "1") {
    await lockBridge("env", "BRIDGE_LOCKED=1");
  }
  try {
    await fsp.access(bridgeLockedFlag);
    locked = true;
  } catch {
    // no-op
  }
}

async function getDiskPct() {
  const output = await runCommand("df", ["-P", sharedDir]);
  const lines = output.split(/\r?\n/);
  const last = lines[lines.length - 1] || "";
  const fields = last.trim().split(/\s+/);
  const raw = fields[4] || "0%";
  return Number.parseInt(raw.replace("%", ""), 10) || 0;
}

async function getFreeKb() {
  const output = await runCommand("free", ["-k"]);
  const match = output.match(/^Mem:\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/m);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function trimTelegramText(text) {
  const clean = String(text || "").replace(/\u0000/g, "").trim();
  if (clean.length <= MAX_TELEGRAM_TEXT) {
    return clean;
  }
  return `${clean.slice(0, MAX_TELEGRAM_TEXT - 16)}\n\n[truncated]`;
}

async function readSilentModeEntries() {
  const contents = await fsp.readFile(silentModeQueuePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  return contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function queueOutboundMessage(recipient, text) {
  const entry = {
    id: crypto.randomUUID(),
    ts: nowIso(),
    recipient: String(recipient),
    text,
    status: "queued"
  };
  await appendJsonl(silentModeQueuePath, entry);
  return entry.id;
}

async function updateQueuedMessage(entryId, patch) {
  await rewriteJsonl(silentModeQueuePath, (entries) =>
    entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry))
  );
}

function jitteredDelayMs(baseSeconds) {
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(baseSeconds * jitter * 1000);
}

async function rawTelegramSend(chatId, text) {
  return telegramClient.sendMessage({
    chat_id: String(chatId),
    text: trimTelegramText(text),
    disable_web_page_preview: true
  });
}

async function sendTelegramBestEffort(chatId, text) {
  try {
    await rawTelegramSend(chatId, text);
  } catch {
    // best effort only
  }
}

async function enterSilentMode(error) {
  if (state.silentMode) {
    return;
  }
  state.silentMode = true;
  const tsLabel = sgTimestampForFilename();
  await writeIncident("telegram-unavailable", [`Bridge entered silent mode.`, ``, `Error: ${error.message || error}`], {
    tsLabel
  });
}

async function exitSilentMode() {
  if (!state.silentMode) {
    return;
  }
  state.silentMode = false;
  state.consecutiveFailCount = 0;
  const tsLabel = sgTimestampForFilename();
  await writeIncident("silent-mode-recovered", ["Bridge exited silent mode after a successful probe."], {
    tsLabel
  });
}

async function sendTelegram(chatId, text, options = {}) {
  const entryId = await queueOutboundMessage(chatId, text);
  const shouldAttempt = !state.silentMode || options.allowWhileSilent;
  if (!shouldAttempt) {
    return { queuedOnly: true };
  }

  const delays = [1, 2, 4, 8, 16, 32, 60];
  let lastError = null;
  for (let attempt = 0; attempt < delays.length; attempt += 1) {
    try {
      const response = await rawTelegramSend(chatId, text);
      await updateQueuedMessage(entryId, {
        status: "sent",
        sent_ts: nowIso()
      });
      state.consecutiveFailCount = 0;
      return response;
    } catch (error) {
      lastError = error;
      await updateQueuedMessage(entryId, {
        status: "failed",
        failed_ts: nowIso(),
        error: String(error.message || error)
      });
      state.consecutiveFailCount += 1;
      if (options.noRetry) {
        break;
      }
      if (state.consecutiveFailCount >= 10) {
        await enterSilentMode(error);
        break;
      }
      const delaySeconds = delays[attempt];
      console.error(`telegram send failed attempt ${attempt + 1}/${delays.length}: ${error.message || error}`);
      await sleep(jitteredDelayMs(delaySeconds));
    }
  }

  if (lastError) {
    if (state.consecutiveFailCount >= 10) {
      await enterSilentMode(lastError);
    }
    throw lastError;
  }
  return { queuedOnly: true };
}

function pushRecentIncoming(ts, text) {
  state.recentIncoming.push({
    ts,
    text
  });
  const cutoff = Date.now() - 15 * 60 * 1000;
  state.recentIncoming = state.recentIncoming.filter((entry) => Date.parse(entry.ts) >= cutoff);
}

async function persistActivity(lockTimeoutSeconds = 10) {
  await writeStateAtomically(bridgeActivityPath, activityState, {
    lockTimeoutSeconds
  });
}

async function recordHandoffEvent(event) {
  await appendJsonl(handoffEventsPath, {
    ts: nowIso(),
    ...event
  });
}

async function readLastHandoffEvents(limit) {
  const contents = await fsp.readFile(handoffEventsPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  const events = contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((entry) => entry.reason === "auto-idle" || entry.reason === "manual");
  return events.slice(-limit);
}

async function getWorkingState() {
  const text = await fsp.readFile(state.workingStatePath, "utf8");
  const parsed = parseFrontmatter(text);
  if (!parsed.frontmatter) {
    throw new Error("WORKING-STATE.md missing YAML frontmatter");
  }
  const actualHash = computeVersionHash(parsed.frontmatter);
  const expectedHash = String(parsed.frontmatter._version_hash || "");
  const hashOk =
    expectedHash.length === actualHash.length &&
    expectedHash.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(actualHash, "utf8"), Buffer.from(expectedHash, "utf8"));
  return {
    frontmatter: parsed.frontmatter,
    body: parsed.body,
    hashOk,
    actualHash,
    expectedHash
  };
}

async function inferSuspectedSkill(incidentTs) {
  const contents = await fsp.readFile(skillInvocationsPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  const tsMs = Date.parse(incidentTs);
  const matches = contents
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((entry) => {
      const start = Date.parse(entry.start_ts || "");
      const end = entry.end_ts ? Date.parse(entry.end_ts) : Number.POSITIVE_INFINITY;
      return Number.isFinite(start) && start <= tsMs && tsMs <= end;
    });
  if (matches.length !== 1) {
    return "unknown (see skill-invocations.jsonl for window)";
  }
  return matches[0].skill || matches[0].skill_name || matches[0].name || "unknown (see skill-invocations.jsonl for window)";
}

async function reportHashMismatch(details) {
  const detectedAt = nowIso();
  state.recentHashMismatchTs.push(Date.parse(detectedAt));
  state.recentHashMismatchTs = state.recentHashMismatchTs.filter((value) => value >= Date.now() - 10 * 60 * 1000);
  const suspectedSkill = await inferSuspectedSkill(detectedAt);
  const tsLabel = sgTimestampForFilename();
  await writeIncident("working-state-hash-mismatch", [
    `Detected at: ${detectedAt}`,
    `Suspected skill: ${suspectedSkill}`,
    `Expected hash: ${details.expectedHash}`,
    `Actual hash: ${details.actualHash}`,
    `Current task: ${details.frontmatter.current_task ?? "null"}`
  ], { tsLabel });
  await sendTelegram(state.allowedUserId, `Alert: WORKING-STATE hash mismatch. Suspected skill: ${suspectedSkill}`).catch(() => {});
}

async function ensureDiskGate(messageChatId) {
  const diskPct = await getDiskPct();
  if (state.diskPause) {
    if (diskPct <= 90) {
      state.diskPause = false;
    } else {
      if (messageChatId) {
        await sendTelegram(messageChatId, DISK_FULL_REPLY).catch(() => {});
      }
      return false;
    }
  }

  if (diskPct >= 95) {
    state.diskPause = true;
    await writeIncident("disk-full", [
      `Disk usage reached ${diskPct}%.`,
      `New incoming Telegram messages are paused until usage falls to 90% or lower.`
    ]);
    if (messageChatId) {
      await sendTelegram(messageChatId, DISK_FULL_REPLY).catch(() => {});
    }
    await sendTelegram(state.allowedUserId, `Disk >=95% — new-data writes paused, recovery writes permitted. Run cleanup.`).catch(() => {});
    return false;
  }

  return true;
}

async function tmuxTargetExists(target) {
  return runCommand("tmux", ["list-windows", "-t", state.tmuxSession, "-F", "#{window_name}"])
    .then((stdout) => stdout.split(/\r?\n/).includes(target.split(":")[1]))
    .catch(() => false);
}

async function tmuxCapture(target) {
  return runCommand("tmux", ["capture-pane", "-p", "-t", target, "-S", "-200"]);
}

async function tmuxSilenceMs(windowIndex) {
  const raw = await runCommand("tmux", [
    "display-message",
    "-p",
    "-t",
    `${state.tmuxSession}:${windowIndex}`,
    "#{window_silence_ms}"
  ]);
  return Number.parseInt(raw, 10);
}

async function sendTextToTmux(target, text) {
  const bufferName = `bridge-${crypto.randomUUID()}`;
  await execFileAsync("tmux", ["set-buffer", "-b", bufferName, "--", text], {
    cwd: sharedDir
  });
  await runCommand("tmux", ["paste-buffer", "-d", "-b", bufferName, "-t", target]);
  await runCommand("tmux", ["send-keys", "-t", target, "Enter"]);
}

function extractTmuxDelta(beforeText, afterText) {
  if (!beforeText) {
    return afterText.trim();
  }
  if (afterText.startsWith(beforeText)) {
    return afterText.slice(beforeText.length).trim();
  }
  const beforeLines = beforeText.split(/\r?\n/);
  const afterLines = afterText.split(/\r?\n/);
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) {
    prefix += 1;
  }
  return afterLines.slice(prefix).join("\n").trim();
}

function normaliseBridgeReply(text, inputText) {
  let reply = String(text || "").trim();
  if (!reply) {
    return "";
  }
  reply = reply.replace(new RegExp(`^${inputText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "");
  const lines = reply
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.trim() !== "");
  const clean = lines.slice(-60).join("\n").trim();
  return trimTelegramText(clean);
}

async function startStuckWatcher(requestId, target, baselineHash) {
  const startedAt = Date.now();
  let lastHash = baselineHash;
  while (!stopping && state.activeRequests.has(requestId)) {
    await sleep(STUCK_HASH_POLL_MS);
    if (!state.activeRequests.has(requestId)) {
      return;
    }
    if (Date.now() - startedAt < STUCK_REPLY_MS) {
      continue;
    }
    const pane = await tmuxCapture(target).catch(() => "");
    const hash = crypto.createHash("sha256").update(pane, "utf8").digest("hex");
    if (hash === lastHash) {
      const tsLabel = sgTimestampForFilename();
      await writeIncident("cli-stuck", [
        `Target: ${target}`,
        `Request id: ${requestId}`,
        `No pane hash change for at least 5 minutes after send-keys.`
      ], {
        tsLabel
      });
      await sendTelegram(state.allowedUserId, `Alert: Claude CLI may be stuck in ${target}. Reply "kill" only if you want manual intervention.`).catch(
        () => {}
      );
      state.activeRequests.delete(requestId);
      return;
    }
    lastHash = hash;
  }
}

async function relayToTmuxAndReply(text, options = {}) {
  const target = options.target || state.mainTarget;
  const exists = await tmuxTargetExists(target);
  if (!exists) {
    throw new Error(`tmux target not found: ${target}`);
  }

  const beforePane = await tmuxCapture(target);
  const baselineHash = crypto.createHash("sha256").update(beforePane, "utf8").digest("hex");
  const requestId = crypto.randomUUID();
  state.activeRequests.set(requestId, {
    startedAt: nowIso(),
    target,
    text
  });
  void startStuckWatcher(requestId, target, baselineHash);

  await sendTextToTmux(target, text);

  let lastSeen = beforePane;
  let changedAt = null;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    await sleep(2000);
    const afterPane = await tmuxCapture(target);
    if (afterPane !== lastSeen) {
      lastSeen = afterPane;
      changedAt = Date.now();
    }
    const silence = await tmuxSilenceMs("main").catch(() => 0);
    if (changedAt && silence >= 2000) {
      break;
    }
  }

  state.activeRequests.delete(requestId);
  const diff = extractTmuxDelta(beforePane, lastSeen);
  const reply = normaliseBridgeReply(diff, text) || "Message forwarded.";
  if (!options.suppressReply) {
    await sendTelegram(options.chatId || state.allowedUserId, reply);
  }
  return reply;
}

async function maybeRecoverSilentMode(chatId) {
  if (!state.silentMode || state.pendingRecoveryChoice) {
    return;
  }
  const entries = await readSilentModeEntries();
  const pending = entries.filter((entry) => !["sent", "archived"].includes(entry.status));
  if (pending.length === 0) {
    await exitSilentMode();
    return;
  }
  const startedAt = pending[0]?.ts ? new Date(pending[0].ts) : new Date();
  const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60_000));
  const prompt = `Silent-mode backlog: ${pending.length} messages captured during ${durationMinutes}m. Reply: full / summary / archive.`;
  await sendTelegram(chatId, prompt, { allowWhileSilent: true });
  await exitSilentMode();
  state.pendingRecoveryChoice = {
    chatId,
    requestedAt: nowIso()
  };
}

async function handleRecoveryChoice(text, chatId) {
  if (!state.pendingRecoveryChoice) {
    return false;
  }
  const choice = String(text || "").trim().toLowerCase();
  if (!["full", "summary", "archive"].includes(choice)) {
    return false;
  }

  const entries = await readSilentModeEntries();
  const pending = entries.filter((entry) => !["sent", "archived"].includes(entry.status));
  if (choice === "full") {
    for (let index = 0; index < pending.length; index += 1) {
      const entry = pending[index];
      const prefix = `[silent-mode backlog ${index + 1}/${pending.length}] `;
      await sendTelegram(chatId, `${prefix}${entry.text}`);
      await updateQueuedMessage(entry.id, {
        status: "sent",
        recovery_mode: "full",
        recovered_ts: nowIso()
      });
    }
  } else if (choice === "summary") {
    const first = pending[0]?.text || "(none)";
    const last = pending[pending.length - 1]?.text || "(none)";
    await sendTelegram(chatId, `Silent backlog summary: count=${pending.length}\nfirst=${trimTelegramText(first)}\nlast=${trimTelegramText(last)}`);
    for (const entry of pending) {
      await updateQueuedMessage(entry.id, {
        status: "sent",
        recovery_mode: "summary",
        recovered_ts: nowIso()
      });
    }
  } else {
    const archivePath = path.join(logsDir, `silent-mode-archive-${sgTimestampForFilename()}.log`);
    const output = pending.map((entry) => `[${entry.ts}] ${entry.text}`).join("\n\n");
    await trackWrite(fsp.writeFile(archivePath, `${output}\n`, "utf8"));
    for (const entry of pending) {
      await updateQueuedMessage(entry.id, {
        status: "archived",
        recovery_mode: "archive",
        recovered_ts: nowIso()
      });
    }
    await sendTelegram(chatId, `Silent-mode backlog archived to ${archivePath}.`);
  }

  state.pendingRecoveryChoice = null;
  return true;
}

function timingSafeEqualHex(a, b) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyKillPassphrase(passphrase) {
  const envValue = String(process.env.KILL_HMAC || "").trim();
  if (!envValue) {
    return false;
  }

  if (envValue.includes(":")) {
    const parts = envValue.split(":");
    if (parts.length === 3 && parts[0] === "hmac-sha256") {
      const [, secret, expectedHex] = parts;
      const candidate = crypto.createHmac("sha256", secret).update(passphrase).digest("hex");
      return /^[0-9a-f]{64}$/i.test(expectedHex) && timingSafeEqualHex(candidate, expectedHex.toLowerCase());
    }
  }

  if (/^[0-9a-f]{64}$/i.test(envValue)) {
    const candidate = crypto.createHmac("sha256", state.agentName).update(passphrase).digest("hex");
    return timingSafeEqualHex(candidate, envValue.toLowerCase());
  }

  const expected = crypto.createHmac("sha256", envValue).update(envValue).digest("hex");
  const candidate = crypto.createHmac("sha256", envValue).update(passphrase).digest("hex");
  return timingSafeEqualHex(candidate, expected);
}

function isKillCommand(text) {
  return /^\/kill(?:\s+.+)?$/i.test(String(text || "").trim());
}

async function handleKillCommand(message) {
  const text = String(message.text || "").trim();
  const passphrase = text.replace(/^\/kill\s*/i, "").trim();
  if (!passphrase || !verifyKillPassphrase(passphrase)) {
    await sendTelegram(message.chat.id, "Kill command rejected.");
    return true;
  }

  await lockBridge("telegram-kill", `from ${message.from?.id ? "REDACTED" : "unknown"}`);
  const tsLabel = sgTimestampForFilename();
  await writeIncident("kill-activated", [
    `Kill-switch activated via Telegram.`,
    `Requester: REDACTED`
  ], { tsLabel });
  await sendTelegram(message.chat.id, "Bridge locked. Unlock requires SSH.");
  return true;
}

async function handleIncomingMessage(message) {
  if (!message || !message.chat || !message.from) {
    return;
  }

  const fromId = Number.parseInt(message.from.id, 10);
  const chatId = String(message.chat.id);
  const text = String(message.text || "").trim();
  const ts = new Date((message.date || Math.floor(Date.now() / 1000)) * 1000).toISOString();

  if (isKillCommand(text)) {
    await handleKillCommand(message);
    return;
  }

  if (fromId !== state.allowedUserId) {
    const tsLabel = sgTimestampForFilename();
    await writeIncident("bridge-unauth", [
      `Unauthorized Telegram message dropped.`,
      `Requester: REDACTED`,
      `Text: ${text ? trimTelegramText(text) : "(empty)"}`
    ], { tsLabel });
    await sendTelegram(state.allowedUserId, `Alert: unauthorized Telegram sender hit ${state.agentName}. Requester: REDACTED.`).catch(() => {});
    return;
  }

  pushRecentIncoming(ts, text);
  activityState.last_user_message_ts = ts;
  await persistActivity(5).catch(async (error) => {
    await writeIncident("bridge-activity-corrupt", [`Failed to update bridge-activity.json: ${error.message}`]);
  });

  if (state.autoHandoffWarning && Date.now() < state.autoHandoffWarning.expiresAt) {
    state.autoHandoffWarning.cancelled = true;
    await sendTelegram(chatId, "Auto-handoff cancelled.").catch(() => {});
  }

  if (await handleRecoveryChoice(text, chatId)) {
    return;
  }

  await maybeRecoverSilentMode(chatId).catch(() => {});

  if (!(await ensureDiskGate(chatId))) {
    return;
  }

  if (locked) {
    const tsLabel = sgTimestampForFilename();
    await writeIncident("bridge-locked-message", [
      `Locked bridge refused an inbound Telegram message.`,
      `Requester: allowed user`
    ], { tsLabel });
    await sendTelegram(chatId, LOCKED_REPLY).catch(() => {});
    return;
  }

  if (text === "/session-handoff") {
    const workingState = await getWorkingState().catch(() => ({ frontmatter: {} }));
    await relayToTmuxAndReply(text, {
      chatId
    });
    await recordHandoffEvent({
      reason: "manual",
      cancelled: false,
      current_task: workingState.frontmatter.current_task ?? null
    });
    return;
  }

  await relayToTmuxAndReply(text, { chatId });
}

async function pollTelegram() {
  while (!stopping) {
    try {
      const response = await telegramClient.call("getUpdates", {
        offset: state.longPollOffset,
        timeout: 30,
        allowed_updates: ["message"]
      });
      const updates = response?.result || [];
      for (const update of updates) {
        state.longPollOffset = Number(update.update_id) + 1;
        if (update.message) {
          await handleIncomingMessage(update.message);
        }
      }
    } catch (error) {
      console.error(`telegram long-poll failed: ${error.message}`);
      await sleep(1000);
    }
  }
}

async function acquireTickLock() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "flock",
      ["-n", bridgeTickLockPath, "bash", "-lc", 'echo locked; trap "exit 0" TERM INT; while :; do sleep 1; done'],
      {
        cwd: sharedDir,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let resolved = false;
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.stdout.on("data", (chunk) => {
      if (!resolved && chunk.toString("utf8").includes("locked")) {
        resolved = true;
        resolve(child);
      }
    });
    child.on("exit", (code) => {
      if (resolved) {
        return;
      }
      if (code === 1) {
        resolve(null);
        return;
      }
      reject(new Error(stderr.trim() || `flock exited ${code}`));
    });
  });
}

async function releaseTickLock() {
  if (!tickLockChild) {
    return;
  }
  const child = tickLockChild;
  tickLockChild = null;
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(resolve, 1000);
  });
}

async function sampleWindowSilence() {
  const output = await runCommand("tmux", ["list-windows", "-t", state.tmuxSession, "-F", "#{window_index}"]);
  const indices = output.split(/\r?\n/).filter(Boolean);
  let minSilence = Number.POSITIVE_INFINITY;
  for (const index of indices) {
    const silence = await tmuxSilenceMs(index);
    if (Number.isFinite(silence)) {
      minSilence = Math.min(minSilence, silence);
    }
  }
  return Number.isFinite(minSilence) ? minSilence : 0;
}

async function scheduleAutoHandoff(workingState) {
  if (state.autoHandoffWarning && Date.now() < state.autoHandoffWarning.expiresAt) {
    return;
  }

  state.autoHandoffWarning = {
    createdAt: Date.now(),
    expiresAt: Date.now() + AUTO_HANDOFF_WARN_MS,
    cancelled: false,
    currentTask: workingState.frontmatter.current_task ?? null
  };
  await sendTelegram(state.allowedUserId, "30+ min idle mid-task — auto-handoff in 60s. Reply anything to cancel.").catch(() => {});

  setTimeout(async () => {
    const warning = state.autoHandoffWarning;
    if (!warning || warning.cancelled || stopping) {
      return;
    }
    try {
      await relayToTmuxAndReply("/session-handoff", {
        chatId: state.allowedUserId
      });
      await recordHandoffEvent({
        reason: "auto-idle",
        cancelled: false,
        current_task: warning.currentTask
      });
      console.log(
        `auto-handoff fired: ${JSON.stringify({
          last_user_message_ts: activityState.last_user_message_ts,
          last_window_silence_ms: activityState.last_window_silence_ms,
          current_task: warning.currentTask
        })}`
      );
    } catch (error) {
      await writeIncident("handoff-failure", [`Auto-idle handoff failed: ${error.message}`]);
    } finally {
      if (state.autoHandoffWarning === warning) {
        state.autoHandoffWarning = null;
      }
    }
  }, AUTO_HANDOFF_WARN_MS);
}

async function runPeriodicSweep() {
  const child = spawn(sweepRuntimePath, [], {
    cwd: sharedDir,
    env: {
      ...process.env,
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_RICKY_ID: String(state.allowedUserId)
    },
    stdio: "ignore",
    detached: false
  });
  child.unref();
}

async function refreshInfraSnapshot(tmuxVersion) {
  const [claudeVersion, dfPct, freeKb] = await Promise.all([
    runCommand("claude", ["--version"]).catch(() => "unknown"),
    getDiskPct(),
    getFreeKb()
  ]);
  await writeStateAtomically(
    infraSnapshotPath,
    {
      snapshot_ts: nowIso(),
      claude_version: claudeVersion,
      tmux_version: tmuxVersion,
      df_pct: dfPct,
      free_kb: freeKb,
      bridge_uptime_seconds: Math.floor((Date.now() - bridgeStartedAt) / 1000)
    },
    { lockTimeoutSeconds: 5 }
  );
}

async function workingStateRestoredToSameTask(eventTs, currentTask) {
  if (!currentTask) {
    return false;
  }
  const stat = await fsp.stat(state.workingStatePath).catch(() => null);
  if (!stat) {
    return false;
  }
  const eventMs = Date.parse(eventTs);
  if (stat.mtimeMs < eventMs || stat.mtimeMs > eventMs + 10 * 60 * 1000) {
    return false;
  }
  const workingState = await getWorkingState().catch(() => null);
  return Boolean(
    workingState &&
      workingState.frontmatter.status === "in-flight" &&
      workingState.frontmatter.current_task === currentTask
  );
}

async function recentHashMismatchWithin60s(eventTs) {
  const eventMs = Date.parse(eventTs);
  return state.recentHashMismatchTs.some((ts) => Math.abs(eventMs - ts) <= 60_000);
}

async function detectMisfires() {
  const events = await readLastHandoffEvents(5);
  for (const event of events) {
    const tsLabel = sgTimestampForFilename(new Date(event.ts));
    const misfirePath = path.join(incidentsDir, `handoff-misfire-${tsLabel}.md`);
    if (fs.existsSync(misfirePath)) {
      continue;
    }
    const eventMs = Date.parse(event.ts);
    const criterionA = state.recentIncoming.some((entry) => {
      const ts = Date.parse(entry.ts);
      return ts >= eventMs && ts <= eventMs + 2 * 60 * 1000 && HANDOFF_CANCEL_RE.test(entry.text || "");
    });
    const criterionB = await workingStateRestoredToSameTask(event.ts, event.current_task || null);
    const criterionC = await recentHashMismatchWithin60s(event.ts);
    if (!criterionA && !criterionB && !criterionC) {
      continue;
    }
    const reasons = [];
    if (criterionA) {
      reasons.push("Ricky sent a cancel-like reply within 2 minutes");
    }
    if (criterionB) {
      reasons.push("WORKING-STATE returned to in-flight with the same current_task within 10 minutes");
    }
    if (criterionC) {
      reasons.push("handoff fired within 60s of a WORKING-STATE hash mismatch");
    }
    await writeIncident(
      "handoff-misfire",
      [`Handoff event ts: ${event.ts}`, `Reasons:`, ...reasons.map((reason) => `- ${reason}`)],
      {
        tsLabel,
        skipIfExists: true
      }
    );
    await sendTelegram(state.allowedUserId, `Alert: handoff misfire detected (${reasons.join("; ")}).`).catch(() => {});
  }
}

async function pollMondayKillSwitch() {
  if (!mondayClient || !process.env.MONDAY_KILL_SWITCH_ITEM_ID || locked) {
    return;
  }
  const itemId = Number.parseInt(process.env.MONDAY_KILL_SWITCH_ITEM_ID, 10);
  if (!Number.isInteger(itemId)) {
    return;
  }
  const query = `
    query {
      items(ids: [${itemId}]) {
        id
        column_values {
          id
          text
          type
        }
      }
    }
  `;
  const payload = await mondayClient.graphql(query);
  const values = payload?.data?.items?.[0]?.column_values || [];
  const killColumn = values.find((column) => /kill[-_]?switch/i.test(column.id || ""));
  const text = String(killColumn?.text || "").trim();
  if (text && text.toUpperCase() !== "OK") {
    await lockBridge("monday-kill-switch", `value=${text}`);
  }
}

async function executeTick(tmuxVersion) {
  const lockChild = await acquireTickLock();
  if (!lockChild) {
    console.warn("tick skipped — previous still running");
    return;
  }
  tickLockChild = lockChild;

  let workingState = null;
  try {
    const minSilence = await sampleWindowSilence();
    activityState.last_window_silence_ms = minSilence;
    activityState.bridge_uptime_seconds = Math.floor((Date.now() - bridgeStartedAt) / 1000);
    await persistActivity(5).catch(async (error) => {
      await writeIncident("tick-write-state-blocked", [`bridge-activity.json update failed: ${error.message}`]);
    });

    let hashMismatch = false;
    try {
      workingState = await getWorkingState();
      if (!workingState.hashOk) {
        hashMismatch = true;
        await reportHashMismatch(workingState);
      }
    } catch (error) {
      hashMismatch = true;
      await writeIncident("working-state-hash-mismatch", [`Failed to read WORKING-STATE.md: ${error.message}`]);
    }

    const lastUserTsMs = activityState.last_user_message_ts ? Date.parse(activityState.last_user_message_ts) : null;
    const idleEnough =
      lastUserTsMs &&
      Date.now() - lastUserTsMs > AUTO_HANDOFF_IDLE_MS &&
      activityState.last_window_silence_ms > AUTO_HANDOFF_IDLE_MS &&
      activityState.bridge_uptime_seconds > 60;
    if (!hashMismatch && idleEnough && workingState?.frontmatter?.status === "in-flight") {
      await scheduleAutoHandoff(workingState);
    }

    tickCount += 1;
    if (tickCount % 5 === 0) {
      await runPeriodicSweep();
    }

    await refreshInfraSnapshot(tmuxVersion).catch(async (error) => {
      await writeIncident("tick-write-state-blocked", [`infra-snapshot.json update failed: ${error.message}`]);
    });
    await detectMisfires();
    await pollMondayKillSwitch();
  } finally {
    await releaseTickLock();
  }
}

function startTicks(tmuxVersion) {
  tickInterval = setInterval(() => {
    if (stopping) {
      return;
    }
    if (tickPromise) {
      return;
    }
    tickPromise = executeTick(tmuxVersion)
      .catch(async (error) => {
        console.error(`tick failure: ${error.stack || error.message}`);
        await writeIncident("crash", [`Tick failure: ${error.stack || error.message}`]).catch(() => {});
      })
      .finally(() => {
        tickPromise = null;
      });
  }, TICK_INTERVAL_MS);
}

async function flushPendingWrites() {
  if (state.pendingWrites.size === 0) {
    return;
  }
  await Promise.allSettled(Array.from(state.pendingWrites));
}

async function shutdownFromSigterm() {
  stopping = true;
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  const tickWait = tickPromise
    ? Promise.race([tickPromise.catch(() => {}), sleep(10_000)])
    : Promise.resolve();
  await tickWait;
  await flushPendingWrites();
  await releaseTickLock();
  process.exit(0);
}

async function crashAndExit(error) {
  try {
    await writeIncident("crash", [`${error.stack || error.message || error}`]);
    await sendTelegramBestEffort(state.allowedUserId || process.env.ALLOWED_USER_ID || "", `Bridge crash: ${error.message || error}`);
  } finally {
    process.exit(1);
  }
}

async function bootstrap() {
  parseRequiredEnv();
  await ensureDirs();
  const tmuxVersion = await verifyTmuxVersion();
  await maybeEnableStartupLock();
  await runStartupSweep();
  queueValidator = require(queueValidatorPath);
  if (!queueValidator || typeof queueValidator.validate !== "function") {
    throw new Error("queue-validator.js did not export validate()");
  }
  await loadBridgeModules();
  await loadExistingActivity();
  await ensureTmuxSession();
  await executeTick(tmuxVersion);
  startTicks(tmuxVersion);
  pollingPromise = pollTelegram();
}

process.on("SIGTERM", () => {
  void shutdownFromSigterm();
});

process.on("uncaughtException", (error) => {
  void crashAndExit(error);
});

process.on("unhandledRejection", (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  void crashAndExit(error);
});

void bootstrap();

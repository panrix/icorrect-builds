import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { requestJson } from "../lib/http.js";

const CUTOFF = 1735689600; // 2025-01-01T00:00:00Z
const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const PROGRESS_LOG = path.join(ROOT, "data", "intercom-cleanup-progress-2.log");
const SUMMARY_JSON = path.join(ROOT, "data", "intercom-cleanup-summary.json");
const RESUME_JSON = path.join(ROOT, "data", "intercom-cleanup-resume.json");
const PAGE_SIZE = 150;
const PAUSE_MS = 300;
const LOG_EVERY = 500;
const SAVE_EVERY_PAGES = 10;

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.mkdirSync(path.dirname(PROGRESS_LOG), { recursive: true });
  fs.appendFileSync(PROGRESS_LOG, line + "\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadResume() {
  if (!fs.existsSync(RESUME_JSON)) return null;
  try {
    return JSON.parse(fs.readFileSync(RESUME_JSON, "utf8"));
  } catch {
    return null;
  }
}

function saveResume(state) {
  fs.writeFileSync(RESUME_JSON, JSON.stringify(state, null, 2));
}

function saveSummary(summary) {
  fs.writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));
}

class CleanupClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.adminId = config.adminId;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Intercom-Version": "2.11"
    };
  }

  async listOpenPage(startingAfter = null) {
    const url = new URL(`${this.baseUrl}/conversations`);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", String(PAGE_SIZE));
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }
    return requestJson(url.toString(), { headers: this.headers(), timeoutMs: 120000 });
  }

  async closeConversation(conversationId) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ state: "closed", admin_id: this.adminId }),
      timeoutMs: 120000
    });
  }
}

async function main() {
  const startedAt = Date.now();
  const config = getConfig();
  const client = new CleanupClient(config.intercom);
  const prior = loadResume();

  const summary = prior?.summary || {
    totalConversationsChecked: 0,
    totalPagesFetched: 0,
    totalPre2025Found: 0,
    totalClosed: 0,
    total2025PlusSkipped: 0,
    timeTakenSeconds: 0,
    errors: []
  };

  let startingAfter = prior?.startingAfter || null;
  let closedSinceLastLog = 0;

  logLine(`Starting/restarting Intercom cleanup scan. cutoff=${CUTOFF} cursor=${startingAfter || "<start>"}`);

  while (true) {
    const page = await client.listOpenPage(startingAfter);
    const conversations = page.conversations || [];
    summary.totalPagesFetched += 1;
    summary.totalConversationsChecked += conversations.length;
    logLine(`Fetched open page ${summary.totalPagesFetched} with ${conversations.length} conversations (checked total ${summary.totalConversationsChecked})`);

    for (const conversation of conversations) {
      const createdAt = Number(conversation.created_at || conversation.createdAt || 0);
      if (!createdAt || createdAt >= CUTOFF) {
        summary.total2025PlusSkipped += 1;
        continue;
      }

      summary.totalPre2025Found += 1;
      try {
        await client.closeConversation(conversation.id);
        summary.totalClosed += 1;
        closedSinceLastLog += 1;
      } catch (error) {
        summary.errors.push({
          conversationId: conversation.id,
          step: "close",
          error: error instanceof Error ? error.message : String(error)
        });
        logLine(`Close failed for ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (closedSinceLastLog >= LOG_EVERY) {
        closedSinceLastLog = 0;
        summary.timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
        saveSummary(summary);
        saveResume({ startingAfter, summary, updatedAt: new Date().toISOString() });
        logLine(`Progress: checked=${summary.totalConversationsChecked}; pre2025=${summary.totalPre2025Found}; closed=${summary.totalClosed}; skipped2025plus=${summary.total2025PlusSkipped}; errors=${summary.errors.length}`);
      }

      await sleep(PAUSE_MS);
    }

    const next = page.pages?.next?.starting_after || null;
    summary.timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
    if (summary.totalPagesFetched % SAVE_EVERY_PAGES === 0 || !next) {
      saveSummary(summary);
      saveResume({ startingAfter: next, summary, updatedAt: new Date().toISOString() });
    }

    if (!next || conversations.length === 0) {
      break;
    }

    startingAfter = next;
    await sleep(PAUSE_MS);
  }

  summary.timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
  saveSummary(summary);
  saveResume({ startingAfter: null, summary, updatedAt: new Date().toISOString(), finished: true });
  logLine(`Finished Intercom cleanup scan. checked=${summary.totalConversationsChecked}; pre2025=${summary.totalPre2025Found}; closed=${summary.totalClosed}; skipped2025plus=${summary.total2025PlusSkipped}; errors=${summary.errors.length}; duration=${summary.timeTakenSeconds}s`);
}

main().catch((error) => {
  logLine(`Fatal error: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});

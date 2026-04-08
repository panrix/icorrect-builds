import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { requestJson } from "../lib/http.js";

const CUTOFF = 1735689600; // 2025-01-01T00:00:00Z
const TAG_NAME = "legacy_zendesk_closed_2024_backlog";
const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const PROGRESS_LOG = path.join(ROOT, "data", "intercom-cleanup-progress.log");
const SUMMARY_JSON = path.join(ROOT, "data", "intercom-cleanup-summary.json");
const PAGE_SIZE = 150;
const PAUSE_MS = 450;

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.mkdirSync(path.dirname(PROGRESS_LOG), { recursive: true });
  fs.appendFileSync(PROGRESS_LOG, line + "\n", "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CleanupClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.adminId = config.adminId;
    this.tagId = null;
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

  async listTags() {
    return requestJson(`${this.baseUrl}/tags`, { headers: this.headers(), timeoutMs: 120000 });
  }

  async createTag(name) {
    return requestJson(`${this.baseUrl}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ name }),
      timeoutMs: 120000
    });
  }

  async ensureTag(name) {
    if (this.tagId) return this.tagId;
    const payload = await this.listTags();
    const tags = payload.data || payload.tags || [];
    let tag = tags.find((entry) => String(entry.name || "").toLowerCase() === name.toLowerCase());
    if (!tag) {
      const created = await this.createTag(name);
      tag = created.data || created.tag || created;
      logLine(`Created Intercom tag ${name} (${tag?.id || "unknown id"})`);
    }
    if (!tag?.id) {
      throw new Error(`Unable to resolve tag id for ${name}`);
    }
    this.tagId = tag.id;
    return this.tagId;
  }

  async addTag(conversationId, tagId) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ id: tagId, admin_id: this.adminId }),
      timeoutMs: 120000
    });
  }

  async closeConversation(conversationId) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({
        state: "closed",
        admin_id: this.adminId
      }),
      timeoutMs: 120000
    });
  }
}

async function main() {
  const startedAt = Date.now();
  const config = getConfig();
  const client = new CleanupClient(config.intercom);
  const tagId = await client.ensureTag(TAG_NAME);
  const summary = {
    totalConversationsFound: 0,
    totalPre2025Found: 0,
    totalClosed: 0,
    totalTagged: 0,
    timeTakenSeconds: 0,
    errors: []
  };

  logLine(`Starting Intercom cleanup. Cutoff=${CUTOFF}, tag=${TAG_NAME} (${tagId})`);

  let startingAfter = null;
  let pageNumber = 0;
  let processedPre2025 = 0;

  while (true) {
    pageNumber += 1;
    const page = await client.listOpenPage(startingAfter);
    const conversations = page.conversations || [];
    summary.totalConversationsFound += conversations.length;
    logLine(`Fetched page ${pageNumber} with ${conversations.length} open conversations (running total ${summary.totalConversationsFound})`);

    for (const conversation of conversations) {
      const createdAt = Number(conversation.created_at || conversation.createdAt || 0);
      if (!createdAt || createdAt >= CUTOFF) {
        continue;
      }

      summary.totalPre2025Found += 1;
      processedPre2025 += 1;

      try {
        await client.addTag(conversation.id, tagId);
        summary.totalTagged += 1;
      } catch (error) {
        summary.errors.push({
          conversationId: conversation.id,
          step: "tag",
          error: error instanceof Error ? error.message : String(error)
        });
        logLine(`Tag failed for ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`);
      }

      await sleep(PAUSE_MS);

      try {
        await client.closeConversation(conversation.id);
        summary.totalClosed += 1;
      } catch (error) {
        summary.errors.push({
          conversationId: conversation.id,
          step: "close",
          error: error instanceof Error ? error.message : String(error)
        });
        logLine(`Close failed for ${conversation.id}: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (processedPre2025 % 100 === 0) {
        logLine(`Progress: processed ${processedPre2025} pre-2025 conversations; tagged=${summary.totalTagged}; closed=${summary.totalClosed}; errors=${summary.errors.length}`);
        summary.timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
        fs.writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));
      }

      await sleep(PAUSE_MS);
    }

    const next = page.pages?.next?.starting_after;
    if (!next) {
      break;
    }
    startingAfter = next;
  }

  summary.timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
  fs.writeFileSync(SUMMARY_JSON, JSON.stringify(summary, null, 2));
  logLine(`Finished Intercom cleanup. pre2025=${summary.totalPre2025Found} tagged=${summary.totalTagged} closed=${summary.totalClosed} errors=${summary.errors.length} duration=${summary.timeTakenSeconds}s`);
}

main().catch((error) => {
  logLine(`Fatal error: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
});

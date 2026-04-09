import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { applyDraftEdit, handleTelegramCallback, repostDueSnoozes } from "../lib/bot-actions.js";
import { getConfig } from "../lib/config.js";
import {
  getConversation,
  getDueSnoozes,
  openDb,
  updateConversationAfterTelegramPost
} from "../lib/db.js";
import { IntercomClient } from "../lib/intercom.js";
import { MondayClient } from "../lib/monday.js";
import { TelegramClient } from "../lib/telegram.js";

const config = getConfig();
const db = openDb();
const telegramClient = new TelegramClient(config.telegram);
const intercomClient = new IntercomClient(config.intercom);
const mondayClient = new MondayClient(config.monday);

async function pollLoop() {
  let offset = 0;
  while (true) {
    try {
      await processDueSnoozes();
      const payload = await telegramClient.getUpdates(offset);
      for (const update of payload.result || []) {
        offset = update.update_id + 1;
        if (update.callback_query) {
          await handleTelegramCallback(
            { db, telegramClient, intercomClient, mondayClient, config },
            update.callback_query
          );
        }
      }
    } catch (error) {
      console.error("Telegram polling error:", error);
      await sleep(3000);
    }
  }
}

async function processDueSnoozes() {
  const due = getDueSnoozes(db);
  if (!due.length) {
    return;
  }
  await repostDueSnoozes({ db, telegramClient, dueSnoozes: due });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(response, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }

  sendText(response, 200, fs.readFileSync(filePath, "utf8"), contentType);
}

function verifyRequest(urlObject) {
  const token = urlObject.searchParams.get("token");
  const conversationId =
    urlObject.searchParams.get("id") ||
    urlObject.pathname.split("/").filter(Boolean).at(-1);

  if (!conversationId) {
    return false;
  }

  if (telegramClient.verifyEditToken(token, conversationId)) {
    return true;
  }

  const initData = urlObject.searchParams.get("tgWebAppData");
  return verifyTelegramInitData(initData);
}

function verifyTelegramInitData(initData) {
  if (!initData) {
    return false;
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return false;
  }
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(config.telegram.token)
    .digest();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return expected === hash;
}

async function requestHandler(request, response) {
  const urlObject = new URL(request.url, `http://${request.headers.host}`);

  if (urlObject.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlObject.pathname === "/" || urlObject.pathname === "/edit" || urlObject.pathname === "/edit.html") {
    serveStatic(response, path.join(config.rootDir, "web", "edit.html"), "text/html; charset=utf-8");
    return;
  }

  if (urlObject.pathname === "/edit.js") {
    serveStatic(response, path.join(config.rootDir, "web", "edit.js"), "text/javascript; charset=utf-8");
    return;
  }

  if (urlObject.pathname === "/edit.css") {
    serveStatic(response, path.join(config.rootDir, "web", "edit.css"), "text/css; charset=utf-8");
    return;
  }

  if (urlObject.pathname.startsWith("/api/draft/")) {
    const conversationId = decodeURIComponent(urlObject.pathname.split("/").pop());
    if (!verifyRequest(urlObject)) {
      sendJson(response, 403, { error: "Invalid edit token" });
      return;
    }

    const conversation = getConversation(db, conversationId);
    if (!conversation) {
      sendJson(response, 404, { error: "Conversation not found" });
      return;
    }

    if (request.method === "GET") {
      sendJson(response, 200, {
        id: conversation.id,
        conversation_id: conversation.id,
        customer_name: conversation.customer_name,
        category: conversation.category,
        draft_text: conversation.draft_text,
        reason: ""
      });
      return;
    }

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const editedText = String(body.edited_text || "").trim();
      const reason = String(body.reason || "").trim();

      if (!editedText) {
        sendJson(response, 400, { error: "edited_text is required" });
        return;
      }

      await applyDraftEdit({ db, telegramClient }, { conversationId, editedText, reason });

      sendJson(response, 200, { ok: true });
      return;
    }
  }

  sendText(response, 404, "Not found");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = http.createServer((request, response) => {
  requestHandler(request, response).catch((error) => {
    console.error("HTTP handler error:", error);
    sendJson(response, 500, { error: "Internal server error" });
  });
});

server.listen(config.service.port, () => {
  console.log(`Telegram bot service listening on ${config.service.port}`);
});

if (!config.telegram.disablePolling) {
  pollLoop().catch((error) => {
    console.error("Polling loop crashed:", error);
    process.exitCode = 1;
  });
} else {
  console.log("Telegram polling disabled via TELEGRAM_DISABLE_POLLING=1");
}

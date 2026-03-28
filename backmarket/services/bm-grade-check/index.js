#!/usr/bin/env node
/**
 * bm-grade-check — SOP 03: Diagnostic Profitability Webhook Service
 *
 * Extracted from the icloud-checker monolith. Handles Monday webhook
 * when status4 changes to "Diagnostic Complete", predicts final grade,
 * matches the device to scraper sell-price data, and warns on low-profit repairs.
 *
 * Port: 8011 (127.0.0.1)
 * Nginx route: /webhook/bm/grade-check → 127.0.0.1:8011
 *
 * Policy:
 *   - Trigger only on Main Board status4 → "Diagnostic Complete"
 *   - Wait until both Top Case and Lid pre-grades exist
 *   - Use worst-of-two pre-grades
 *   - Treat a repair as profitable only when:
 *       margin >= 30% AND net profit >= £100
 *   - Alert on anything below that combined threshold
 */

const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const PORT = 8011;
const HOST = "127.0.0.1";

const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const BOARD_ID = "349212843";
const STATUS4_COLUMN = "status4";
const BM_BOARD_RELATION = "board_relation5";
const SLACK_CHANNEL = "C09VB5G7CTU";

const GRADE_CHECK_CONSTANTS = {
  TOP_CASE_GRADE_COLUMN: "status_2_mkmcj0tz",
  LID_GRADE_COLUMN: "status_2_mkmc4tew",
  LABOUR_RATE: 24,
  MARGIN_THRESHOLD: 0.3,
  NET_PROFIT_THRESHOLD: 100,
  SHIPPING_COST: 15,
  BM_COMMISSION: 0.1,
  SELL_PRICES_PATH: "/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json",
  PURCHASE_COST_COLUMN: "numeric",
  PARTS_COST_COLUMN: "lookup_mkx1xzd7",
  LABOUR_HOURS_COLUMN: "formula__1",
  LABOUR_COST_COLUMN: "formula_mkx1bjqr",
};

const GRADE_MAP = {
  Excellent: "Excellent",
  "Grade A": "Excellent",
  Good: "Good",
  "Grade B": "Good",
  Fair: "Fair",
  "Grade C": "Fair",
};

const GRADE_RANK = {
  Fair: 1,
  "Grade C": 1,
  Good: 2,
  "Grade B": 2,
  Excellent: 3,
  "Grade A": 3,
};

const A_NUMBER_TO_SCRAPER_MODEL = {
  A1932: 'Air 13" 2018/2019 Intel',
  A2179: 'Air 13" 2020 Intel i5 Grey',
  A2337: 'Air 13" 2020 M1',
  A2681: 'Air 13" 2022 M2',
  A3113: 'Air 13" 2024 M3',
  A3114: 'Air 13" 2025 M4',
  A2941: 'Air 15" 2023 M2',
  A2289: 'Pro 13" 2020 Intel',
  A2251: 'Pro 13" 2020 Intel',
  A2338: 'Pro 13" 2020 M1',
  A2442: 'Pro 14" 2021 M1 Pro',
  A2485: 'Pro 16" 2021 M1 Pro',
  A2779: 'Pro 14" 2023 M2 Pro',
  A2780: 'Pro 16" 2023 M2 Pro',
  A2918: 'Pro 14" 2023 M3 Pro',
  A2991: 'Pro 14" 2023 M3',
  A2992: 'Pro 16" 2023 M3 Pro',
};

const gradeCheckCache = new Map();
const GRADE_CHECK_DEDUP_MS = 10 * 60 * 1000;

function dedup(itemId) {
  const now = Date.now();
  for (const [key, ts] of gradeCheckCache) {
    if (now - ts > GRADE_CHECK_DEDUP_MS) {
      gradeCheckCache.delete(key);
    }
  }
  if (gradeCheckCache.has(itemId)) {
    return true;
  }
  gradeCheckCache.set(itemId, now);
  return false;
}

async function mondayQuery(query, label = "Monday query") {
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const payload = await resp.json();

  if (!resp.ok) {
    const message = payload?.errors?.map((entry) => entry.message).join("; ");
    throw new Error(
      `${label} failed with HTTP ${resp.status}${message ? `: ${message}` : ""}`
    );
  }

  if (payload?.errors?.length) {
    throw new Error(
      `${label} GraphQL error: ${payload.errors
        .map((entry) => entry.message)
        .join("; ")}`
    );
  }

  return payload;
}

async function slackPost(text) {
  if (SLACK_BOT_TOKEN) {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
    });
    return;
  }

  if (SLACK_WEBHOOK_URL) {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }
}

async function postMondayComment(itemId, body) {
  const escaped = body
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  await mondayQuery(
    `mutation { create_update( item_id: ${itemId}, body: "${escaped}" ) { id } }`,
    `create_update for item ${itemId}`
  );
}

function parseNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const normalized = String(value).replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
    return 0;
  }

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumMirrorValues(displayValue) {
  if (!displayValue) {
    return 0;
  }

  return String(displayValue)
    .split(",")
    .map((entry) => parseNumber(entry))
    .reduce((total, value) => total + value, 0);
}

function matchModelToScraper(deviceUuid, deviceName, sellPriceData) {
  if (deviceUuid) {
    for (const [key, model] of Object.entries(sellPriceData.models || {})) {
      if (model.uuid === deviceUuid) {
        return { key, method: "uuid" };
      }
      if (model.colour) {
        for (const colourData of Object.values(model.colour)) {
          if (colourData.productId === deviceUuid) {
            return { key, method: "uuid-colour" };
          }
        }
      }
    }
  }

  if (deviceName) {
    const aMatch = deviceName.match(/A\d{4}/);
    if (aMatch) {
      const scraperKey = A_NUMBER_TO_SCRAPER_MODEL[aMatch[0]];
      if (scraperKey && sellPriceData.models?.[scraperKey]) {
        return { key: scraperKey, method: "a-number", aNumber: aMatch[0] };
      }
    }
  }

  return null;
}

app.post("/webhook/bm/grade-check", async (req, res) => {
  const body = req.body;

  if (body.challenge) {
    console.log("[grade-check] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  res.status(200).send("OK");

  try {
    const event = body.event;
    console.log(
      `[grade-check] Received webhook: boardId=${event?.boardId}, columnId=${event?.columnId}, pulseId=${event?.pulseId}, pulseName=${event?.pulseName}, value=${JSON.stringify(event?.value)}`
    );

    if (!event) {
      console.log("[grade-check] No event in body, skipping");
      return;
    }
    if (String(event.boardId) !== BOARD_ID) {
      console.log(
        `[grade-check] Wrong board: ${event.boardId} !== ${BOARD_ID}, skipping`
      );
      return;
    }
    if (event.columnId !== STATUS4_COLUMN) {
      console.log(
        `[grade-check] Wrong column: ${event.columnId} !== ${STATUS4_COLUMN}, skipping`
      );
      return;
    }

    let statusValue = {};
    try {
      statusValue =
        typeof event.value === "string"
          ? JSON.parse(event.value)
          : event.value || {};
    } catch {}

    const statusLabel = statusValue?.label?.text || statusValue?.label || "";
    const statusIndex = statusValue?.index;
    const isDiagnosticComplete =
      statusLabel.toLowerCase().includes("diagnostic complete") ||
      event.textBody?.toLowerCase().includes("diagnostic complete");

    if (!isDiagnosticComplete) {
      console.log(
        `[grade-check] status4 changed but not to "Diagnostic Complete" (label="${statusLabel}", index=${statusIndex}), skipping`
      );
      return;
    }

    const itemId = String(event.pulseId);
    const itemName = event.pulseName || "Unknown";
    console.log(`[grade-check] Diagnostic Complete on ${itemName} (${itemId})`);

    if (dedup(itemId)) {
      console.log(`[grade-check] ${itemName}: dedup hit, skipping`);
      return;
    }

    const columnsToFetch = [
      GRADE_CHECK_CONSTANTS.TOP_CASE_GRADE_COLUMN,
      GRADE_CHECK_CONSTANTS.LID_GRADE_COLUMN,
      GRADE_CHECK_CONSTANTS.PURCHASE_COST_COLUMN,
      GRADE_CHECK_CONSTANTS.PARTS_COST_COLUMN,
      GRADE_CHECK_CONSTANTS.LABOUR_HOURS_COLUMN,
      GRADE_CHECK_CONSTANTS.LABOUR_COST_COLUMN,
      BM_BOARD_RELATION,
    ];

    const itemData = await mondayQuery(`{
      items(ids: [${itemId}]) {
        name
        column_values(ids: ${JSON.stringify(columnsToFetch)}) {
          id
          text
          value
          ... on BoardRelationValue { linked_item_ids }
          ... on MirrorValue { display_value }
          ... on FormulaValue { display_value }
          ... on StatusValue { text }
        }
      }
    }`, `fetch grade-check source data for item ${itemId}`);

    const item = itemData?.data?.items?.[0];
    if (!item) {
      console.log(`[grade-check] Item ${itemId} not found`);
      return;
    }

    const getColText = (colId) => {
      const col = item.column_values.find((entry) => entry.id === colId);
      return (col?.display_value ?? col?.text ?? "").toString().trim();
    };

    const linkCol = item.column_values.find(
      (entry) => entry.id === BM_BOARD_RELATION
    );
    const deviceItemId = linkCol?.linked_item_ids?.[0] || null;

    let deviceName = item.name;
    let deviceUuid = null;
    if (deviceItemId) {
      const deviceData = await mondayQuery(`{
        items(ids: [${deviceItemId}]) {
          name
          column_values(ids: ["lookup", "text_mm1dt53s"]) {
            id text
            ... on MirrorValue { display_value }
          }
        }
      }`, `fetch linked BM Device item ${deviceItemId}`);
      const device = deviceData?.data?.items?.[0];
      if (device) {
        const lookupCol = device.column_values?.find((c) => c.id === "lookup");
        const uuidCol = device.column_values?.find((c) => c.id === "text_mm1dt53s");
        deviceName = lookupCol?.display_value || device.name || item.name;
        deviceUuid = (uuidCol?.text || "").trim() || null;
        console.log(
          `[grade-check] ${item.name}: BM Device="${device.name}", deviceName="${deviceName}", uuid="${deviceUuid || "none"}"`
        );
      }
    } else {
      console.log(
        `[grade-check] ${item.name}: no linked BM Device, using item name fallback`
      );
    }

    const topCaseGrade = getColText(GRADE_CHECK_CONSTANTS.TOP_CASE_GRADE_COLUMN);
    const lidGrade = getColText(GRADE_CHECK_CONSTANTS.LID_GRADE_COLUMN);
    console.log(
      `[grade-check] ${item.name}: Top Case="${topCaseGrade}", Lid="${lidGrade}"`
    );

    if (!topCaseGrade || !lidGrade) {
      console.log(`[grade-check] ${item.name}: waiting for both grades`);
      gradeCheckCache.delete(itemId);
      return;
    }

    const topRank = GRADE_RANK[topCaseGrade] || 0;
    const lidRank = GRADE_RANK[lidGrade] || 0;
    const predictedGrade = topRank <= lidRank ? topCaseGrade : lidGrade;
    const predictedGradeKey = GRADE_MAP[predictedGrade] || predictedGrade;
    console.log(
      `[grade-check] ${item.name}: Predicted grade=${predictedGradeKey}`
    );

    let sellPriceData;
    try {
      sellPriceData = JSON.parse(
        fs.readFileSync(GRADE_CHECK_CONSTANTS.SELL_PRICES_PATH, "utf8")
      );
    } catch (err) {
      console.error(
        `[grade-check] Could not load sell prices: ${err.message}`
      );
      await slackPost(
        `⚠️ Grade check for ${item.name}: sell price data unavailable. Cannot predict profitability.`
      );
      return;
    }

    const modelMatch = matchModelToScraper(deviceUuid, deviceName, sellPriceData);
    if (!modelMatch) {
      console.log(
        `[grade-check] ${item.name}: no scraper match for device="${deviceName}"`
      );
      await slackPost(
        `⚠️ Grade check for ${item.name}: no sell price data found for device "${deviceName}". Predicted grade: ${predictedGradeKey}.`
      );
      return;
    }

    const modelKey = modelMatch.key;
    console.log(
      `[grade-check] ${item.name}: matched to scraper "${modelKey}" via ${modelMatch.method}${modelMatch.aNumber ? ` (${modelMatch.aNumber})` : ""}`
    );

    const gradeData = sellPriceData.models?.[modelKey]?.grades?.[predictedGradeKey];
    const predictedSellPrice = gradeData?.price;
    if (!predictedSellPrice) {
      console.log(
        `[grade-check] ${item.name}: no sell price for ${modelKey} / ${predictedGradeKey}`
      );
      await slackPost(
        `⚠️ Grade check for ${item.name}: no sell price data for ${modelKey} Grade ${predictedGradeKey}.`
      );
      return;
    }

    const purchaseCost = parseNumber(
      getColText(GRADE_CHECK_CONSTANTS.PURCHASE_COST_COLUMN)
    );
    const partsCost = sumMirrorValues(
      getColText(GRADE_CHECK_CONSTANTS.PARTS_COST_COLUMN)
    );
    const labourHours = parseNumber(
      getColText(GRADE_CHECK_CONSTANTS.LABOUR_HOURS_COLUMN)
    );
    const labourCost = parseNumber(
      getColText(GRADE_CHECK_CONSTANTS.LABOUR_COST_COLUMN)
    );
    const effectiveLabourCost =
      labourCost || labourHours * GRADE_CHECK_CONSTANTS.LABOUR_RATE;
    const costUnknown = !purchaseCost && !partsCost && !effectiveLabourCost;

    const totalCost =
      purchaseCost +
      partsCost +
      effectiveLabourCost +
      GRADE_CHECK_CONSTANTS.SHIPPING_COST;
    const netRevenue =
      predictedSellPrice * (1 - GRADE_CHECK_CONSTANTS.BM_COMMISSION);
    const netProfit = netRevenue - totalCost;
    const margin = netRevenue > 0 ? netProfit / netRevenue : 0;
    const marginPercent = Math.round(margin * 100);
    const isProfitable =
      margin >= GRADE_CHECK_CONSTANTS.MARGIN_THRESHOLD &&
      netProfit >= GRADE_CHECK_CONSTANTS.NET_PROFIT_THRESHOLD;

    console.log(
      `[grade-check] ${item.name}: Sell £${predictedSellPrice}, Cost £${Math.round(totalCost)}, Net £${Math.round(netProfit)}, Margin ${marginPercent}% — ${isProfitable ? "PROFITABLE" : "UNPROFITABLE"}`
    );

    if (isProfitable) {
      return;
    }

    const partsAndLabour = Math.round(
      partsCost + effectiveLabourCost
    );
    const costNote = costUnknown ? "\n⚠️ Cost data unknown: using £0." : "";
    const alertMsg = `⚠️ Profitability warning: ${item.name}\n\nPredicted grade: ${predictedGradeKey} (Top Case: ${topCaseGrade}, Lid: ${lidGrade})\nEst. sell price: £${predictedSellPrice} | Est. net: £${Math.round(netProfit)} | Margin: ${marginPercent}%\n\nThreshold: ≥30% margin AND ≥£100 net\n\nParts + labour = £${partsAndLabour}. Consider before starting repair.${costNote}`;

    await slackPost(alertMsg);

    try {
      await postMondayComment(
        itemId,
        `⚠️ Profitability prediction\nGrade: ${predictedGradeKey} (TC: ${topCaseGrade}, Lid: ${lidGrade})\nEst. sell: £${predictedSellPrice} | Net: £${Math.round(netProfit)} | Margin: ${marginPercent}%\n🔴 Below threshold`
      );
    } catch (err) {
      console.error(`[grade-check] Monday comment failed: ${err.message}`);
    }
  } catch (err) {
    console.error("[grade-check] Error:", err);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`bm-grade-check listening on http://${HOST}:${PORT}`);
});

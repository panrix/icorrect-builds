#!/usr/bin/env node

const fs = require("fs");

const SOLD_LOOKUP_PATH = "/home/ricky/builds/backmarket/data/sold-prices-latest.json";
const SCRAPER_PATH = "/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json";
const TRADEIN_SNAPSHOT_PATH = "/tmp/bm_tradein_live.json";
const BUYBACK_ORDERS_URL = "https://www.backmarket.co.uk/ws/buyback/v1/orders";
const RECENT_BID_CUTOFF = "2026-04-17";
const ENV_PATH = "/home/ricky/config/api-keys/.env";

const SKU_TO_MODEL = {
  "MBA13.2020.M1": "A2337",
  "MBA13.2022.M2": "A2681",
  "MBA13.2024.M3": "A2681",
  "MBA15.2023.M2": "A2941",
  "MBP13.2020.M1": "A2338",
  "MBP13.2022.M2": "A2338",
  "MBP14.2021.M1PRO": "A2442",
  "MBP14.2021.M1MAX": "A2442",
  "MBP14.2023.M2PRO": "A2779",
  "MBP14.2023.M2MAX": "A2779",
  "MBP14.2023.M3": "A2992",
  "MBP14.2023.M3PRO": "A2992",
  "MBP14.2023.M3MAX": "A2992",
  "MBP14.2024.M4": "A2918",
  "MBP14.2024.M4PRO": "A2918",
  "MBP14.2024.M4MAX": "A2918",
  "MBP16.2021.M1PRO": "A2485",
  "MBP16.2021.M1MAX": "A2485",
  "MBP16.2023.M2PRO": "A2918",
  "MBP16.2023.M2MAX": "A2918",
  "MBP16.2023.M3PRO": "A2780",
  "MBP16.2023.M3MAX": "A2991",
  "MBP16.2024.M4PRO": "A2780",
  "MBP16.2024.M4MAX": "A2991",
};

const SKU_TO_SCRAPER_MODEL = {
  "MBA13.2020": 'Air 13" 2020 M1',
  "MBA13.2022": 'Air 13" 2022 M2',
  "MBA13.2024": 'Air 13" 2024 M3',
  "MBA13.2025": 'Air 13" 2025 M4',
  "MBA15.2023": 'Air 15" 2023 M2',
  "MBP13.2020": 'Pro 13" 2020 M1',
  "MBP13.2022": 'Pro 13" 2022 M2',
  "MBP14.2021.M1PRO": 'Pro 14" 2021 M1 Pro',
  "MBP14.2021.M1MAX": 'Pro 14" 2021 M1 Max',
  "MBP14.2023.M2PRO": 'Pro 14" 2023 M2 Pro',
  "MBP14.2023.M3": 'Pro 14" 2023 M3',
  "MBP14.2023.M3PRO": 'Pro 14" 2023 M3 Pro',
  "MBP16.2021.M1PRO": 'Pro 16" 2021 M1 Pro',
  "MBP16.2021.M1MAX": 'Pro 16" 2021 M1 Max',
  "MBP16.2023.M2PRO": 'Pro 16" 2023 M2 Pro',
  "MBP16.2023.M3PRO": 'Pro 16" 2023 M3 Pro',
};

const BM_GRADE_TO_SCRAPER = {
  STALLONE: "Fair",
  BRONZE: "Fair",
  SILVER: "Good",
  GOLD: "Good",
  PLATINUM: "Excellent",
  DIAMOND: "Excellent",
};

const AESTHETIC_TO_POLICY_GRADE = {
  NOT_FUNCTIONAL_CRACKED: "STALLONE",
  NONFUNC_CRACK: "STALLONE",
  NOT_FUNCTIONAL_USED: "BRONZE",
  NONFUNC_USED: "BRONZE",
  FUNCTIONAL_CRACKED: "SILVER",
  FUNC_CRACK: "SILVER",
  FUNCTIONAL_USED: "GOLD",
  FUNC_USED: "GOLD",
  FUNCTIONAL_GOOD: "PLATINUM",
  FUNC_GOOD: "PLATINUM",
  FUNCTIONAL_FLAWLESS: "DIAMOND",
  FUNC_EXCELLENT: "DIAMOND",
};

const GRADE_LABOUR_HOURS = {
  FUNC_CRACK: 2.0,
  FUNC_USED: 1.0,
  FUNC_GOOD: 1.0,
  FUNC_EXCELLENT: 1.0,
  NONFUNC_USED: 4.0,
  NONFUNC_CRACK: 1.5,
};

const DEFAULT_LABOUR_HOURS = 2.0;
const DEFAULT_SELL_PRICE = 500;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    const rawValue = line.slice(equalsIndex + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(ENV_PATH);

function round2(value) {
  return Math.round(value * 100) / 100;
}

function pad(value, width) {
  const text = String(value);
  if (text.length >= width) {
    return text;
  }
  return `${text}${" ".repeat(width - text.length)}`;
}

function getHeaders() {
  const auth = process.env.BM_AUTH || process.env.BACKMARKET_API_AUTH;
  if (!auth) {
    throw new Error("Missing BM_AUTH / BACKMARKET_API_AUTH");
  }
  return {
    Authorization: auth,
    "Accept-Language": "en-gb",
    "User-Agent":
      process.env.BM_UA || "BM-iCorrect-n8n;ricky@icorrect.co.uk",
    Accept: "application/json",
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function randomSample(values, count) {
  const pool = [...values];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

function extractModelFamily(sku) {
  if (!sku || sku === "None") {
    return "UNKNOWN";
  }
  const upper = sku.toUpperCase();
  for (const prefix of Object.keys(SKU_TO_MODEL)) {
    if (upper.startsWith(prefix.split(".")[0])) {
      const parts = upper.split(".");
      return parts[0];
    }
  }
  const parts = upper.split(".");
  if (["MBA13", "MBA15", "MBP13", "MBP14", "MBP16"].includes(parts[0])) {
    return parts[0];
  }
  return "UNKNOWN";
}

function extractAppleModel(sku) {
  if (!sku || sku === "None") {
    return null;
  }
  const upper = sku.toUpperCase();
  const prefixes = Object.keys(SKU_TO_MODEL).sort((left, right) => right.length - left.length);
  for (const prefix of prefixes) {
    if (upper.includes(prefix)) {
      return SKU_TO_MODEL[prefix];
    }
  }
  return null;
}

function getPolicyGrade(rawGrade) {
  const normalized = String(rawGrade || "").toUpperCase().replace(/\./g, "_");
  return AESTHETIC_TO_POLICY_GRADE[normalized] || normalized;
}

function skuGradeToLookupKey(value) {
  const normalized = String(value || "").toUpperCase().replace(/\./g, "_");
  if (normalized.includes("NONFUNC") || normalized.includes("NOT_FUNCTIONAL")) {
    if (normalized.includes("CRACK")) {
      return "NONFUNC_CRACK";
    }
    if (normalized.includes("USED")) {
      return "NONFUNC_USED";
    }
    return "NONFUNC_USED";
  }
  if (normalized.includes("CRACK")) {
    return "FUNC_CRACK";
  }
  return null;
}

function deriveGradeKeyFromSku(sku) {
  const parts = String(sku || "").split(".");
  if (parts.length < 2) {
    return null;
  }
  const tail = parts.slice(-2).join(".");
  return skuGradeToLookupKey(tail);
}

function getPartsCostFromSku(sku) {
  const gradeKey = deriveGradeKeyFromSku(sku);
  if (gradeKey === "NONFUNC_CRACK") {
    return 170;
  }
  if (gradeKey === "NONFUNC_USED") {
    return 50;
  }
  if (gradeKey === "FUNC_CRACK") {
    return 120;
  }
  return 100;
}

function getLabourHoursFromSku(sku) {
  const gradeKey = deriveGradeKeyFromSku(sku);
  return GRADE_LABOUR_HOURS[gradeKey] || DEFAULT_LABOUR_HOURS;
}

function calcProfit(buyPrice, sellPrice, partsCost, labourHours) {
  const bmBuyFee = buyPrice * 0.1;
  const bmSellFee = sellPrice * 0.1;
  const labour = labourHours * 24;
  const shipping = 15;
  const gross = sellPrice - buyPrice;
  const tax = gross > 0 ? gross * 0.1667 : 0;
  return (
    sellPrice -
    buyPrice -
    bmBuyFee -
    bmSellFee -
    partsCost -
    labour -
    shipping -
    tax
  );
}

function calcMargin(netProfit, sellPrice) {
  const netRevenue = sellPrice * 0.9;
  if (netRevenue <= 0) {
    return 0;
  }
  return netProfit / netRevenue;
}

function evaluateGate(policyGrade, buyPrice, sellPrice, sku) {
  const partsCost = getPartsCostFromSku(sku);
  const labourHours = getLabourHoursFromSku(sku);
  const netProfit = calcProfit(buyPrice, sellPrice, partsCost, labourHours);
  const margin = calcMargin(netProfit, sellPrice);

  let decision = "PASS";
  if (["GOLD", "PLATINUM", "DIAMOND"].includes(policyGrade)) {
    decision = `SKIP_GRADE_${policyGrade}`;
  } else if (policyGrade === "SILVER") {
    if (margin < 0.25) {
      decision = "SKIP_MARGIN";
    } else if (netProfit < 200) {
      decision = "SKIP_NET";
    } else {
      decision = "PASS_CAUTION";
    }
  } else if (policyGrade === "STALLONE" || policyGrade === "BRONZE") {
    if (margin < 0.15) {
      decision = "SKIP_MARGIN";
    } else if (netProfit < 150) {
      decision = "SKIP_NET";
    } else if (margin < 0.25 || netProfit < 200) {
      decision = "PASS_CAUTION";
    }
  } else {
    decision = "SKIP_UNKNOWN";
  }

  return {
    decision,
    netProfit: round2(netProfit),
    margin: round2(margin * 100),
    partsCost,
    labourHours,
  };
}

function resolveScraperSellPrice(scraperData, sku, grade) {
  const models = scraperData.models || {};
  const parts = String(sku || "").toUpperCase().split(".");
  if (parts.length < 3) {
    return null;
  }

  const candidates = [];
  if (parts.length >= 3) {
    candidates.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
  }
  if (parts.length >= 2) {
    candidates.push(`${parts[0]}.${parts[1]}`);
  }

  let scraperModel = null;
  for (const candidate of candidates) {
    if (SKU_TO_SCRAPER_MODEL[candidate]) {
      scraperModel = SKU_TO_SCRAPER_MODEL[candidate];
      break;
    }
  }

  if (!scraperModel || !models[scraperModel]) {
    return null;
  }

  const grades = models[scraperModel].grades || {};
  const scraperGrade = BM_GRADE_TO_SCRAPER[String(grade || "").toUpperCase()] || "Fair";
  for (const tryGrade of [scraperGrade, "Fair", "Good"]) {
    const entry = grades[tryGrade];
    if (entry && entry.price) {
      return Number(entry.price);
    }
  }
  for (const entry of Object.values(grades)) {
    if (entry && entry.price) {
      return Number(entry.price);
    }
  }
  return null;
}

function buildSoldLookupModelKey(sku) {
  const family = extractModelFamily(sku);
  const appleModel = extractAppleModel(sku);
  if (family === "UNKNOWN" || !appleModel) {
    return null;
  }
  let prefix = family;
  if (family.startsWith("MBA")) {
    prefix = "MBA";
  } else if (family === "MBP13") {
    prefix = "MBP";
  }
  return `${prefix}.${appleModel}`.toUpperCase();
}

function resolveSoldSellPrice(soldLookup, sku, grade) {
  if (!sku) {
    return null;
  }

  const bySkuEntry = soldLookup.by_sku?.[sku];
  if (bySkuEntry && Number(bySkuEntry.count) >= 2 && bySkuEntry.avg_price !== undefined) {
    return {
      price: Number(bySkuEntry.avg_price),
      source: `by_sku:${sku}`,
    };
  }

  const modelKey = buildSoldLookupModelKey(sku);
  if (!modelKey) {
    return null;
  }

  const gradeKey =
    BM_GRADE_TO_SCRAPER[String(grade || "").toUpperCase()] ||
    BM_GRADE_TO_SCRAPER[getPolicyGrade(grade)] ||
    null;

  const gradeEntry = gradeKey ? soldLookup.by_model?.[modelKey]?.[gradeKey] : null;
  if (gradeEntry && Number(gradeEntry.count) >= 3 && gradeEntry.avg_price !== undefined) {
    return {
      price: Number(gradeEntry.avg_price),
      source: `by_model:${modelKey}:${gradeKey}`,
    };
  }

  const fairEntry = soldLookup.by_model?.[modelKey]?.Fair;
  if (fairEntry && Number(fairEntry.count) >= 3 && fairEntry.avg_price !== undefined) {
    return {
      price: Number(fairEntry.avg_price),
      source: `by_model:${modelKey}:Fair`,
    };
  }

  return null;
}

async function fetchTradeInOrdersLive() {
  let url = `${BUYBACK_ORDERS_URL}?page_size=100`;
  const orders = [];

  while (url) {
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) {
      throw new Error(`GET ${url} failed with HTTP ${response.status}`);
    }
    const payload = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    orders.push(...results);
    url = payload?.next || null;
  }

  return orders;
}

async function loadTradeInOrders() {
  if (fs.existsSync(TRADEIN_SNAPSHOT_PATH)) {
    return {
      source: TRADEIN_SNAPSHOT_PATH,
      orders: readJson(TRADEIN_SNAPSHOT_PATH),
    };
  }

  return {
    source: "live BM buyback API",
    orders: await fetchTradeInOrdersLive(),
  };
}

function printSkuSamples(soldLookup) {
  const entries = randomSample(Object.entries(soldLookup.by_sku || {}), 5);
  console.log("Random SKU sample:");
  console.log(
    [
      pad("sku", 52),
      pad("grade", 10),
      pad("count", 7),
      pad("avg", 8),
      pad("min", 8),
      pad("max", 8),
      "last_sold_date",
    ].join(" | ")
  );
  for (const [sku, stats] of entries) {
    console.log(
      [
        pad(sku, 52),
        pad(stats.grade, 10),
        pad(stats.count, 7),
        pad(`£${stats.avg_price}`, 8),
        pad(`£${stats.min_price}`, 8),
        pad(`£${stats.max_price}`, 8),
        stats.last_sold_date,
      ].join(" | ")
    );
  }
  console.log("");
}

function printDecisionComparison(rows, tradeInSource) {
  console.log(`Recent trade-in bids source: ${tradeInSource}`);
  console.log(`Recent trade-in bids (creationDate >= ${RECENT_BID_CUTOFF}, status=TO_SEND): ${rows.length}`);
  console.log(
    [
      pad("date", 10),
      pad("order", 14),
      pad("grade", 9),
      pad("buy", 7),
      pad("scr", 7),
      pad("sold", 7),
      pad("scraper_gate", 14),
      pad("sold_gate", 14),
      "sku",
    ].join(" | ")
  );
  for (const row of rows) {
    console.log(
      [
        pad(row.creationDate.slice(0, 10), 10),
        pad(row.orderPublicId, 14),
        pad(row.grade, 9),
        pad(`£${row.buyPrice}`, 7),
        pad(`£${row.scraperPrice}`, 7),
        pad(`£${row.soldPrice}`, 7),
        pad(row.scraperGate.decision, 14),
        pad(row.soldGate.decision, 14),
        row.sku,
      ].join(" | ")
    );
  }
  console.log("");

  const diffs = rows.filter(
    (row) =>
      row.scraperGate.decision !== row.soldGate.decision ||
      row.scraperPrice !== row.soldPrice
  );
  console.log(`Decision diffs: ${diffs.length}`);
  for (const row of diffs) {
    console.log(
      `DIFF ${row.orderPublicId}: ${row.scraperGate.decision} @ £${row.scraperPrice} -> ${row.soldGate.decision} @ £${row.soldPrice} | ${row.sku}`
    );
  }
  console.log("");

  return diffs;
}

async function main() {
  const soldLookup = readJson(SOLD_LOOKUP_PATH);
  const scraperData = readJson(SCRAPER_PATH);

  const sanityIssues = Object.entries(soldLookup.by_sku || {}).filter(([, stats]) => {
    const price = Number(stats.avg_price);
    return !Number.isFinite(price) || price <= 0 || price >= 5000;
  });

  printSkuSamples(soldLookup);

  const { source: tradeInSource, orders } = await loadTradeInOrders();
  const recentRows = orders
    .filter((order) => String(order.creationDate || "").slice(0, 10) >= RECENT_BID_CUTOFF)
    .filter((order) => order.status === "TO_SEND")
    .map((order) => {
      const listing = order.listing || {};
      const sku = listing.sku || "";
      const grade = listing.grade || "";
      const buyPrice = Number(
        order.counterOfferPrice?.value ?? order.originalPrice?.value ?? 0
      );

      const scraperPrice = round2(
        resolveScraperSellPrice(scraperData, sku, grade) ?? DEFAULT_SELL_PRICE
      );
      const soldMatch = resolveSoldSellPrice(soldLookup, sku, grade);
      const soldPrice = round2(soldMatch?.price ?? scraperPrice);
      const policyGrade = getPolicyGrade(grade);

      return {
        creationDate: order.creationDate || "",
        orderPublicId: order.orderPublicId || "",
        sku,
        grade,
        policyGrade,
        buyPrice,
        scraperPrice,
        soldPrice,
        soldSource: soldMatch?.source || "scraper_fallback",
        scraperGate: evaluateGate(policyGrade, buyPrice, scraperPrice, sku),
        soldGate: evaluateGate(policyGrade, buyPrice, soldPrice, sku),
      };
    })
    .sort((left, right) => left.creationDate.localeCompare(right.creationDate));

  const diffs = printDecisionComparison(recentRows, tradeInSource);

  const pass =
    sanityIssues.length === 0 &&
    recentRows.length > 0 &&
    soldLookup.condition_code_map &&
    Object.keys(soldLookup.condition_code_map).length > 0;

  if (sanityIssues.length) {
    console.log("Sanity issues:");
    for (const [sku, stats] of sanityIssues.slice(0, 10)) {
      console.log(`  ${sku}: avg_price=${stats.avg_price}`);
    }
    console.log("");
  }

  console.log(
    `Summary: ${pass ? "PASS" : "FAIL"} | random_skus=${Math.min(5, Object.keys(soldLookup.by_sku || {}).length)} | recent_bids=${recentRows.length} | diffs=${diffs.length}`
  );
  if (!pass) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Summary: FAIL | ${error.message}`);
  process.exit(1);
});

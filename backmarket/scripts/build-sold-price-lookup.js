#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { normalizeHistoricalSku } = require("./lib/sku");

const OUTPUT_PATH = "/home/ricky/builds/backmarket/data/sold-prices-latest.json";
const ORDERS_URL = "https://www.backmarket.co.uk/ws/orders";
const DEFAULT_SINCE_DAYS = 90;
const PAGE_SIZE = 100;
const ENV_PATH = "/home/ricky/config/api-keys/.env";

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

function parseArgs(argv) {
  let sinceDays = DEFAULT_SINCE_DAYS;
  let live = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--live") {
      live = true;
      continue;
    }

    if (arg === "--dry-run") {
      live = false;
      continue;
    }

    if (arg === "--since") {
      const raw = argv[index + 1];
      if (!raw) {
        throw new Error("--since requires an integer day value");
      }
      const parsed = parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --since value: ${raw}`);
      }
      sinceDays = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { live, sinceDays };
}

function getAuthToken() {
  const token = process.env.BM_AUTH || process.env.BACKMARKET_API_AUTH;
  if (!token) {
    throw new Error(
      "Missing BM auth. Set BM_AUTH or BACKMARKET_API_AUTH in /home/ricky/config/api-keys/.env"
    );
  }
  return token;
}

function buildHeaders() {
  return {
    Authorization: getAuthToken(),
    "Accept-Language": "en-gb",
    "User-Agent":
      process.env.BM_UA || "BM-iCorrect-n8n;ricky@icorrect.co.uk",
    Accept: "application/json",
  };
}

function parseIsoDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function median(values) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function canonicalizeSuffixGrade(rawSuffix) {
  const suffix = String(rawSuffix || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!suffix) {
    return null;
  }
  if (suffix === "fair") {
    return "Fair";
  }
  if (suffix === "good") {
    return "Good";
  }
  if (
    suffix === "vgood" ||
    suffix === "verygood" ||
    suffix === "excellent" ||
    suffix === "premium"
  ) {
    return "Excellent";
  }
  return null;
}

function getSkuSuffix(sku) {
  const parts = normalizeHistoricalSku(sku).split(".");
  return parts.length ? parts[parts.length - 1] : "";
}

function getModelKey(sku) {
  const parts = normalizeHistoricalSku(sku).split(".");
  if (parts.length < 3) {
    return null;
  }
  return `${parts[0].toUpperCase()}.${parts[1].toUpperCase()}.${parts[2].toUpperCase()}`;
}

function createBucket() {
  return {
    prices: [],
    count: 0,
    sum: 0,
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    lastSoldDate: "",
  };
}

function updateBucket(bucket, price, isoDate) {
  bucket.prices.push(price);
  bucket.count += 1;
  bucket.sum += price;
  bucket.min = Math.min(bucket.min, price);
  bucket.max = Math.max(bucket.max, price);
  if (!bucket.lastSoldDate || isoDate > bucket.lastSoldDate) {
    bucket.lastSoldDate = isoDate;
  }
}

function summarizeBucket(bucket) {
  return {
    count: bucket.count,
    avg_price: round2(bucket.sum / bucket.count),
    median_price: round2(median(bucket.prices)),
    min_price: round2(bucket.min),
    max_price: round2(bucket.max),
    last_sold_date: bucket.lastSoldDate,
  };
}

function sortObject(input) {
  return Object.fromEntries(
    Object.entries(input).sort(([left], [right]) => left.localeCompare(right))
  );
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchCompletedOrders(sinceDays) {
  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  let url = `${ORDERS_URL}?state=9&page=1&page_size=${PAGE_SIZE}`;
  const orders = [];

  while (url) {
    const payload = await fetchJson(url);
    const results = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.results)
        ? payload.results
        : [];

    let hitCutoff = false;
    for (const order of results) {
      const createdAt = parseIsoDate(order?.date_creation);
      if (!createdAt) {
        continue;
      }
      if (createdAt < cutoff) {
        hitCutoff = true;
        break;
      }
      orders.push(order);
    }

    if (hitCutoff) {
      break;
    }

    url = payload?.next || null;
  }

  return orders;
}

function flattenOrders(orders, sinceDays) {
  const cutoff = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const lines = [];

  for (const order of orders) {
    const orderDate = parseIsoDate(order?.date_creation);
    if (!orderDate || orderDate < cutoff) {
      continue;
    }

    for (const line of order?.orderlines || []) {
      const sku = normalizeHistoricalSku(line?.listing || "");
      const price = parseFloat(line?.price);
      const condition = Number(line?.condition);
      if (!sku || !Number.isFinite(price) || !Number.isFinite(condition)) {
        continue;
      }

      lines.push({
        sku,
        price,
        condition,
        product: line?.product || "",
        product_id: line?.product_id || null,
        date: order.date_creation,
      });
    }
  }

  return lines;
}

function deriveConditionCodeMap(lines) {
  const suffixProfile = new Map();

  for (const line of lines) {
    const code = String(line.condition);
    const suffix = getSkuSuffix(line.sku);
    const canonicalGrade = canonicalizeSuffixGrade(suffix);
    if (!suffixProfile.has(code)) {
      suffixProfile.set(code, { suffixCounts: new Map(), grades: new Set() });
    }
    const profile = suffixProfile.get(code);
    profile.suffixCounts.set(suffix, (profile.suffixCounts.get(suffix) || 0) + 1);
    if (canonicalGrade) {
      profile.grades.add(canonicalGrade);
    }
  }

  const derived = {};
  const printable = [];

  for (const [code, profile] of [...suffixProfile.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const observedGrades = [...profile.grades.values()];
    const suffixCounts = [...profile.suffixCounts.entries()].sort((a, b) => b[1] - a[1]);
    printable.push({
      code,
      grades: observedGrades,
      suffixes: suffixCounts,
    });

    if (observedGrades.length !== 1) {
      const detail = suffixCounts.map(([suffix, count]) => `${suffix}:${count}`).join(", ");
      throw new Error(
        `Condition code ${code} does not converge to a single grade group. Observed: ${detail}`
      );
    }

    derived[code] = observedGrades[0];
  }

  return { conditionCodeMap: derived, printableProfile: printable };
}

function aggregate(lines, conditionCodeMap) {
  const bySkuBuckets = new Map();
  const byModelBuckets = new Map();

  for (const line of lines) {
    const grade = conditionCodeMap[String(line.condition)];
    if (!grade) {
      throw new Error(`No derived grade for condition code ${line.condition}`);
    }

    const skuKey = line.sku;
    if (!bySkuBuckets.has(skuKey)) {
      bySkuBuckets.set(skuKey, {
        grade,
        bucket: createBucket(),
      });
    }
    updateBucket(bySkuBuckets.get(skuKey).bucket, line.price, line.date);

    const modelKey = getModelKey(line.sku);
    if (!modelKey) {
      continue;
    }
    if (!byModelBuckets.has(modelKey)) {
      byModelBuckets.set(modelKey, new Map());
    }
    const modelGrades = byModelBuckets.get(modelKey);
    if (!modelGrades.has(grade)) {
      modelGrades.set(grade, createBucket());
    }
    updateBucket(modelGrades.get(grade), line.price, line.date);
  }

  const bySku = {};
  for (const [sku, entry] of [...bySkuBuckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    bySku[sku] = {
      grade: entry.grade,
      ...summarizeBucket(entry.bucket),
    };
  }

  const byModel = {};
  for (const [modelKey, gradeMap] of [...byModelBuckets.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    byModel[modelKey] = {};
    for (const [grade, bucket] of [...gradeMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      byModel[modelKey][grade] = summarizeBucket(bucket);
    }
  }

  return { bySku, byModel };
}

function printSummary(output, profile, live) {
  console.log(
    `[sold-lookup] ${live ? "live" : "dry-run"} | orders=${output.order_count} lines=${output.line_count} lookback=${output.lookback_days}d`
  );
  console.log("[sold-lookup] Derived condition code map:");
  for (const entry of profile) {
    const suffixes = entry.suffixes.map(([suffix, count]) => `${suffix}:${count}`).join(", ");
    console.log(
      `  ${entry.code} -> ${entry.grades[0]} (${suffixes})`
    );
  }
  console.log(
    `[sold-lookup] Aggregated ${Object.keys(output.by_sku).length} SKUs and ${Object.keys(output.by_model).length} model-grade groups`
  );
}

async function main() {
  const { live, sinceDays } = parseArgs(process.argv.slice(2));
  const orders = await fetchCompletedOrders(sinceDays);
  const lines = flattenOrders(orders, sinceDays);
  const { conditionCodeMap, printableProfile } = deriveConditionCodeMap(lines);
  const { bySku, byModel } = aggregate(lines, conditionCodeMap);

  const output = {
    generated_at: new Date().toISOString(),
    lookback_days: sinceDays,
    order_count: orders.length,
    line_count: lines.length,
    condition_code_map: sortObject(conditionCodeMap),
    by_sku: bySku,
    by_model: byModel,
  };

  printSummary(output, printableProfile, live);

  if (!live) {
    console.log(`[sold-lookup] Dry run only. Output not written to ${OUTPUT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`[sold-lookup] Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(`[sold-lookup] ERROR: ${error.message}`);
  process.exit(1);
});

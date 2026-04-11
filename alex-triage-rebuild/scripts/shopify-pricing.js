import fs from "node:fs";
import { getConfig } from "../lib/config.js";
import { writeJson } from "../lib/db.js";

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildPriceIndex(products) {
  const index = {};

  for (const product of products) {
    const baseTitle = product.title || "Untitled";
    for (const variant of product.variants || []) {
      const title = [baseTitle, variant.title && variant.title !== "Default Title" ? variant.title : null]
        .filter(Boolean)
        .join(" ");
      const label = title.replace(/\s+/g, " ").trim();
      index[normalizeName(label)] = {
        label: `£${Math.round(Number(variant.price || 0))} (${label})`,
        key: label,
        price: Math.round(Number(variant.price || 0)),
        inc_vat: true,
        product_id: product.id,
        variant_id: variant.id
      };
    }
  }

  return index;
}

async function fetchProducts(config) {
  const allProducts = [];
  let nextUrl = `https://${config.shopify.store}/admin/api/${config.shopify.apiVersion}/products.json?status=active&limit=250`;

  do {
    const response = await fetch(nextUrl, {
      headers: {
        "X-Shopify-Access-Token": config.shopify.token,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify products fetch failed: HTTP ${response.status}`);
    }

    const payload = await response.json();
    const products = payload.products || [];
    allProducts.push(...products);

    const linkHeader = response.headers.get("link") || "";
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextMatch) {
      nextUrl = nextMatch[1];
    } else {
      nextUrl = null;
    }
  } while (nextUrl);

  return allProducts;
}

export async function syncPricing() {
  const config = getConfig();
  const products = await fetchProducts(config);
  const index = buildPriceIndex(products);
  writeJson(config.pricingPath, index);
  return index;
}

export function loadPricingIndex(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function deviceCategory(key) {
  const k = key.toLowerCase();
  if (k.includes("macbook") || k.includes("mac mini") || k.includes("imac") || k.includes("mac pro")) return "mac";
  if (k.startsWith("ipad")) return "ipad";
  if (k.includes("watch")) return "watch";
  return "iphone";
}

export function findPrice(index, deviceModel, repairType) {
  if (!deviceModel) {
    return null;
  }

  // Exact match
  if (repairType) {
    const key = normalizeName(`${deviceModel} ${repairType}`);
    if (index[key]) return index[key];
  }

  const query = normalizeName(repairType ? `${deviceModel} ${repairType}` : deviceModel);
  const queryWords = query.split(" ").filter(Boolean);

  const repairKeywords = new Set([
    "diagnostic", "repair", "genuine", "lcd", "screen", "glass", "display",
    "original", "battery", "replacement", "premium", "aftermarket",
    "charging", "port", "camera", "speaker", "loudspeaker", "earpiece",
    "microphone", "button", "housing", "rear", "liquid", "retina",
    "xdr", "damage", "board", "level", "fan", "keyboard",
    "trackpad", "crown", "side", "mute", "heart", "rate",
    "monitor", "front", "lens", "express"
  ]);

  const deviceWords = queryWords.filter((w) => !repairKeywords.has(w));
  if (!deviceWords.length) return null;

  const queryCategory = deviceCategory(deviceWords.join(" "));

  // Find which query word is the model identifier (e.g., "13" in "iPhone 13", "16" in "MacBook Pro 16")
  // For iPhone/iPad: it's the first standalone digit after "iphone" or "ipad"
  // For MacBook: it's the first standalone digit after "pro" or "air" or just after the device name
  let modelDigit = null;
  for (let i = 0; i < deviceWords.length; i++) {
    if (/^\d+$/.test(deviceWords[i])) {
      modelDigit = deviceWords[i];
      break;
    }
  }

  const candidates = [];

  for (const [key, entry] of Object.entries(index)) {
    if (deviceCategory(key) !== queryCategory) continue;

    const keyWords = key.split(" ").filter(Boolean);

    // Score device overlap
    const devMatches = keyWords.filter((kw) => deviceWords.includes(kw.toLowerCase())).length;
    const devScore = deviceWords.length ? devMatches / deviceWords.length : 0;
    if (devScore < 0.5) continue;

    // Version conflict: only applies to iPhone model numbers and iPad generations
    // NOT to MacBook years, model numbers, or other identifiers
    // For iPhone: "iPhone 13" should not match "iPhone 11" — these are different devices
    // For MacBook: "MacBook Pro 16" IS the size identifier and should match all MacBook Pro 16 variants
    if (queryCategory === "iphone" && modelDigit) {
      // Extract the iPhone model digit from key (the digit right after "iphone")
      let keyModelDigit = null;
      for (let i = 0; i < keyWords.length; i++) {
        if (keyWords[i].toLowerCase() === "iphone") {
          for (let j = i + 1; j < keyWords.length; j++) {
            if (/^\d+$/.test(keyWords[j])) {
              keyModelDigit = keyWords[j];
              break;
            }
          }
          break;
        }
      }
      if (keyModelDigit && keyModelDigit !== modelDigit) continue;
    }

    if (queryCategory === "ipad" && modelDigit) {
      // For iPad, find the first digit after "ipad" in the key
      let keyModelDigit = null;
      for (let i = 0; i < keyWords.length; i++) {
        if (keyWords[i].toLowerCase() === "ipad") {
          for (let j = i + 1; j < keyWords.length; j++) {
            if (/^\d+$/.test(keyWords[j]) && keyWords[j] !== "2018" && keyWords[j] !== "2019" && keyWords[j] !== "2020" && keyWords[j] !== "2021" && keyWords[j] !== "2022" && keyWords[j] !== "2023" && keyWords[j] !== "2024" && keyWords[j] !== "2025") {
              keyModelDigit = keyWords[j];
              break;
            }
          }
          break;
        }
      }
      if (keyModelDigit && keyModelDigit !== modelDigit) continue;
    }

    // Score repair match
    const repairWords = queryWords.filter((w) => repairKeywords.has(w));
    if (repairWords.length > 0) {
      const repMatches = keyWords.filter((kw) => repairWords.includes(kw.toLowerCase())).length;
      const repScore = repMatches / repairWords.length;
      const totalScore = devScore * 0.6 + repScore * 0.4;
      candidates.push({ entry, score: totalScore });
    } else {
      candidates.push({ entry, score: devScore });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].entry;
}

async function main() {
  const index = await syncPricing();
  console.log(`Synced ${Object.keys(index).length} pricing entries`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

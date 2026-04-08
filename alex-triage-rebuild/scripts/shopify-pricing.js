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
  const url = `https://${config.shopify.store}/admin/api/${config.shopify.apiVersion}/products.json?status=active&limit=250`;
  const response = await fetch(url, {
    headers: {
      "X-Shopify-Access-Token": config.shopify.token,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Shopify products fetch failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.products || [];
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

export function findPrice(index, deviceModel, repairType) {
  if (!deviceModel || !repairType) {
    return null;
  }

  const key = normalizeName(`${deviceModel} ${repairType}`);
  return index[key] || null;
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


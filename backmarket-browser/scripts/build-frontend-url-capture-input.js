#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  rowsFromQueuePayload,
  buildCaptureCandidates,
} = require('../lib/capture-candidates');
const { buildFrontendUrlCapturePlan } = require('../lib/frontend-url-capture-contract');

function argValue(name, fallback = '') {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const defaultQueuePath = path.join(__dirname, '..', '..', 'backmarket', 'reports', 'current-queue-qc-sku-map-2026-04-26-024008.json');
const defaultRegistryPath = path.join(__dirname, '..', '..', 'backmarket', 'data', 'listings-registry.json');
const inputPath = argValue('--queue', defaultQueuePath);
const registryPath = argValue('--registry', defaultRegistryPath);
const outPath = argValue('--out', path.join(__dirname, '..', 'data', 'exports', 'gb-frontend-url-capture-input.json'));
const includeCaution = process.argv.includes('--include-caution');

function loadRegistrySlots(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const registry = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Object.values(registry.slots || registry || {});
}

function enrichFromRegistry(candidates, registrySlots) {
  const bySku = new Map();
  for (const slot of registrySlots) {
    const sku = String(slot?.sku || '').trim().toLowerCase();
    if (!sku) continue;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push(slot);
  }

  return candidates.map(candidate => {
    const matches = bySku.get(String(candidate.sku || '').trim().toLowerCase()) || [];
    if (matches.length !== 1) {
      return {
        ...candidate,
        registry_match_count: matches.length,
        registry_enriched: false,
      };
    }
    const slot = matches[0];
    const registryProductId = String(slot.product_id || '').trim();
    const existingProductId = String(candidate.product_id || '').trim();
    return {
      ...candidate,
      listing_id: String(slot.listing_id || candidate.listing_id || '').trim(),
      product_id: registryProductId || existingProductId,
      product_id_before_registry: existingProductId && registryProductId && existingProductId !== registryProductId
        ? existingProductId
        : undefined,
      registry_enriched: true,
      registry_trust_class: String(slot.trust_class || '').trim(),
    };
  });
}

function mergeDuplicateCaptureTargets(candidates) {
  const byTarget = new Map();
  for (const candidate of candidates) {
    const key = candidate.listing_id
      ? `listing:${candidate.listing_id}`
      : `sku:${candidate.sku}`;
    const ref = {
      main_item_id: candidate.main_item_id,
      bm_device_id: candidate.bm_device_id,
      item_name: candidate.item_name,
    };
    if (!byTarget.has(key)) {
      byTarget.set(key, {
        ...candidate,
        capture_target_key: key,
        related_items: [ref],
      });
      continue;
    }
    const existing = byTarget.get(key);
    existing.related_items.push(ref);
    existing.duplicate_capture_target = true;
  }
  return Array.from(byTarget.values());
}

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const initial = buildCaptureCandidates(rowsFromQueuePayload(payload), { includeCaution });
const enrichedCandidates = enrichFromRegistry(initial.candidates, loadRegistrySlots(registryPath));
const candidates = mergeDuplicateCaptureTargets(enrichedCandidates);
const rejected = initial.rejected;
const plans = candidates.map(buildFrontendUrlCapturePlan);
const ok = plans.every(plan => plan.ok);

const output = {
  ok,
  generated_at: new Date().toISOString(),
  source_queue: inputPath,
  source_registry: registryPath,
  include_caution: includeCaution,
  count: candidates.length,
  source_count_before_target_merge: enrichedCandidates.length,
  candidates,
  rejected,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  ok,
  out: outPath,
  count: candidates.length,
  rejected: rejected.length,
}, null, 2));
process.exit(ok ? 0 : 1);

#!/usr/bin/env node
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const fs = require('fs');
const path = require('path');
const { BM_API_HEADERS, fetchAllListings } = require('./lib/bm-api');
const { createLogger } = require('./lib/logger');

const BM_BASE = 'https://www.backmarket.co.uk';
const BM_CATALOG_PATH = '/home/ricky/builds/backmarket/data/bm-catalog.json';
const REGISTRY_PATH = '/home/ricky/builds/backmarket/data/listings-registry.json';
const CORRECTIONS_PATH = '/home/ricky/builds/backmarket/data/catalog-corrections.json';
const DUPLICATES_PATH = '/home/ricky/builds/backmarket/data/listings-registry-duplicates.json';
const GRADES = ['FAIR', 'GOOD', 'VERY_GOOD'];
const BATCH_SIZE_DEFAULT = 50;
const CREATE_DELAY_MS = 5000;
const POLL_DELAY_MS = 3000;
const POLL_ATTEMPTS = 15;
const BATCH_PAUSE_MS = 15000;

const log = createLogger('build-listings-registry.log');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const gradeIdx = args.indexOf('--grade');
const gradeFilter = gradeIdx !== -1 ? args[gradeIdx + 1] : null;
const modelFamilyIdx = args.indexOf('--model-family');
const modelFamilyFilter = modelFamilyIdx !== -1 ? args[modelFamilyIdx + 1] : null;
const batchSizeIdx = args.indexOf('--batch-size');
const batchSize = batchSizeIdx !== -1 ? Math.max(1, parseInt(args[batchSizeIdx + 1], 10) || BATCH_SIZE_DEFAULT) : BATCH_SIZE_DEFAULT;
const skipExisting = args.includes('--skip-existing');

if (gradeFilter && !GRADES.includes(gradeFilter)) {
  console.error(`Invalid --grade ${gradeFilter}. Use one of: ${GRADES.join(', ')}`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bmApiFetch(urlPath, opts = {}) {
  const url = urlPath.startsWith('http') ? urlPath : `${BM_BASE}${urlPath}`;
  const headers = { ...BM_API_HEADERS, ...(opts.headers || {}) };
  const fetchOpts = { ...opts, headers };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const resp = await fetch(url, fetchOpts);
    if (resp.ok) return resp.json();
    const text = await resp.text();
    if (resp.status === 429 || text.startsWith('<!') || text.startsWith('<html')) {
      console.warn(`[BM] Rate limited on ${urlPath}, attempt ${attempt}/3, waiting 30s...`);
      await sleep(30000);
      continue;
    }
    throw new Error(`BM API ${resp.status} ${urlPath}: ${text.slice(0, 300)}`);
  }
  throw new Error(`BM API failed after 3 retries: ${urlPath}`);
}

function normalizeColour(colour) {
  const value = (colour || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!value) return '';
  if (['space gray', 'space grey', 'grey', 'gray'].includes(value)) return 'Space Gray';
  if (value === 'silver') return 'Silver';
  if (value === 'gold') return 'Gold';
  if (value === 'midnight') return 'Midnight';
  if (value === 'starlight') return 'Starlight';
  if (value === 'black') return 'Black';
  if (value === 'space black') return 'Space Black';
  return colour.trim();
}

function normalizeStorage(ssd) {
  const value = (ssd || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!value) return '';
  if (value === '1000GB') return '1TB';
  if (value === '2000GB') return '2TB';
  if (value === '4000GB') return '4TB';
  return value;
}

function normalizeRam(ram) {
  return (ram || '').trim().toUpperCase().replace(/\s+/g, '');
}

function simplifyChip(cpuGpu = '') {
  const source = cpuGpu.toUpperCase();
  if (source.includes('M4 MAX')) return 'M4MAX';
  if (source.includes('M4 PRO')) return 'M4PRO';
  if (source.includes('M4')) return 'M4';
  if (source.includes('M3 MAX')) return 'M3MAX';
  if (source.includes('M3 PRO')) return 'M3PRO';
  if (source.includes('M3')) return 'M3';
  if (source.includes('M2 MAX')) return 'M2MAX';
  if (source.includes('M2 PRO')) return 'M2PRO';
  if (source.includes('M2')) return 'M2';
  if (source.includes('M1 MAX')) return 'M1MAX';
  if (source.includes('M1 PRO')) return 'M1PRO';
  if (source.includes('M1')) return 'M1';
  if (source.includes('CORE I9')) return 'I9';
  if (source.includes('CORE I7')) return 'I7';
  if (source.includes('CORE I5')) return 'I5';
  if (source.includes('CORE I3')) return 'I3';
  if (source.includes('INTEL')) return 'INTEL';
  return '';
}

function deriveGpuPart(modelFamily, cpuGpu = '') {
  const source = cpuGpu.toLowerCase();
  const gpuMatch = source.match(/(\d+)-core gpu/);
  if (!gpuMatch) return '';
  if (/MacBook Air 13-inch \(2020\)|MacBook Air 13-inch \(2022\)/.test(modelFamily || '')) {
    return `${gpuMatch[1]}C`;
  }
  return '';
}

function deriveType(modelFamily = '') {
  if (modelFamily.includes('MacBook Air')) return 'MBA';
  if (modelFamily.includes('MacBook Pro')) return 'MBP';
  return 'MAC';
}

function deriveModelCode(title = '', modelFamily = '') {
  const text = `${title} ${modelFamily}`;
  const match = text.match(/\bA\d{4}\b/);
  if (match) return match[0];

  const table = {
    'MacBook Air 13-inch (2020)': 'A2337',
    'MacBook Air 13-inch (2022)': 'A2681',
    'MacBook Air 15-inch (2023)': 'A2941',
    'MacBook Air 13-inch (2024)': 'A3113',
    'MacBook Air 13-inch (2025)': 'A3240',
    'MacBook Air Retina 13-inch (2020)': 'A2179',
    'MacBook Pro 13-inch (2020)': 'A2338',
    'MacBook Pro 13-inch (2022)': 'A2338',
    'MacBook Pro Retina 13-inch (2020)': 'A2251',
    'MacBook Pro 14-inch (2021)': 'A2442',
    'MacBook Pro 16-inch (2021)': 'A2485',
    'MacBook Pro 14-inch (2023)': 'A2918',
    'MacBook Pro 16-inch (2023)': 'A2991',
  };
  return table[modelFamily] || '';
}

function constructSkuFromCatalog(variant, grade) {
  const type = deriveType(variant.model_family);
  const model = deriveModelCode(variant.title, variant.model_family);
  if (!model) {
    throw new Error(`No safe 2020+ model code mapping for family "${variant.model_family}"`);
  }
  const chip = simplifyChip(variant.cpu_gpu);
  const gpuPart = deriveGpuPart(variant.model_family, variant.cpu_gpu);
  const ram = normalizeRam(variant.ram);
  const storage = normalizeStorage(variant.ssd);
  let colour = normalizeColour(variant.colour || 'Grey');
  colour = colour.replace('Space Gray', 'Grey').replace('Space Grey', 'Grey');
  const parts = [type, model, chip, gpuPart, ram, storage, colour, grade].filter(Boolean);
  return parts.join('.');
}

function constructSkuBaseFromCatalog(variant) {
  return constructSkuFromCatalog(variant, '__GRADE__').replace(/\.__GRADE__$/, '');
}

function parseTitleSpec(title = '') {
  const raw = title.trim();
  const parts = raw.split(' - ').map(part => part.trim());
  const modelMatch = raw.match(/^(MacBook (?:Air|Pro)(?: Retina)? \d+-inch \(\d{4}\))/i);
  const ramPart = parts.find(part => /\b\d+\s*GB\b.*\b(RAM|Memory)\b/i.test(part)) || '';
  const ssdPart = parts.find(part => /\bSSD\s*\d+\s*GB\b/i.test(part)) || '';
  const ramMatch = ramPart.match(/(\d+)\s*GB/i);
  const ssdMatch = ssdPart.match(/(\d+)\s*GB/i);
  const cpuGpu = parts.slice(1).find(part => /(M\d|Core i\d|Intel)/i.test(part)) || '';

  return {
    model_family: modelMatch ? modelMatch[1] : '',
    ram: ramMatch ? `${ramMatch[1]}GB` : '',
    ssd: ssdMatch ? `${ssdMatch[1]}GB` : '',
    cpu_gpu: cpuGpu.trim(),
  };
}

function isMacFamily(modelFamily = '') {
  return modelFamily.startsWith('MacBook ');
}

function isInScopeModelFamily(modelFamily = '') {
  const yearMatch = modelFamily.match(/\((\d{4})\)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
  return year >= 2020;
}

function loadCatalog() {
  return JSON.parse(fs.readFileSync(BM_CATALOG_PATH, 'utf8'));
}

function confidenceRank(value = '') {
  if (value === 'exact_verified') return 3;
  if (value === 'historical_verified') return 2;
  if (value === 'market_only') return 1;
  return 0;
}

function evidenceScore(variant) {
  let score = 0;
  if (variant.title) score += 1;
  if (variant.model_family) score += 1;
  if (variant.ram) score += 1;
  if (variant.ssd) score += 1;
  if (variant.colour) score += 1;
  if (variant.cpu_gpu) score += 1;
  if (variant.backmarket_id) score += 1;
  if (variant.available !== undefined) score += 1;
  if (variant.grade_prices && Object.keys(variant.grade_prices).length > 0) score += 1;
  return score;
}

function compareCanonicalCandidates(a, b) {
  return (
    confidenceRank(b.resolution_confidence) - confidenceRank(a.resolution_confidence) ||
    evidenceScore(b) - evidenceScore(a) ||
    String(a.product_id).localeCompare(String(b.product_id))
  );
}

function filterVariants(catalog) {
  return Object.values(catalog.variants || {}).filter(variant => {
    if (variant.verification_status !== 'verified') return false;
    if (!isMacFamily(variant.model_family || '')) return false;
    if (!isInScopeModelFamily(variant.model_family || '')) return false;
    if (modelFamilyFilter && variant.model_family !== modelFamilyFilter) return false;
    return true;
  });
}

function canonicalizeVariants(variants) {
  const grouped = new Map();
  const blocked = [];
  const duplicateGroups = [];

  for (const variant of variants) {
    const colour = normalizeColour(variant.colour || '');
    if (!colour) {
      blocked.push({
        product_id: variant.product_id,
        model_family: variant.model_family,
        reason: 'missing_colour',
      });
      continue;
    }

    let baseSku;
    try {
      baseSku = constructSkuBaseFromCatalog({ ...variant, colour });
    } catch (error) {
      blocked.push({
        product_id: variant.product_id,
        model_family: variant.model_family,
        reason: error.message,
      });
      continue;
    }

    if (!grouped.has(baseSku)) grouped.set(baseSku, []);
    grouped.get(baseSku).push({ ...variant, colour });
  }

  const canonical = [];
  for (const [skuBase, group] of grouped.entries()) {
    group.sort(compareCanonicalCandidates);
    const selected = group[0];
    canonical.push(selected);
    if (group.length > 1) {
      duplicateGroups.push({
        sku_base: skuBase,
        selected_product_id: selected.product_id,
        selection_reason: {
          resolution_confidence: selected.resolution_confidence || '',
          evidence_score: evidenceScore(selected),
        },
        dropped_product_ids: group.slice(1).map(v => ({
          product_id: v.product_id,
          resolution_confidence: v.resolution_confidence || '',
          evidence_score: evidenceScore(v),
          title: v.title || '',
        })),
      });
    }
  }

  return { canonical, blocked, duplicateGroups };
}

function buildPlan(variants) {
  const slots = [];
  const blocked = [];
  const collisions = [];
  const seenSkus = new Set();

  for (const variant of variants) {
    const grades = gradeFilter ? [gradeFilter] : GRADES;
    for (const grade of grades) {
      try {
        const sku = constructSkuFromCatalog(variant, grade);
        if (seenSkus.has(sku)) {
          collisions.push({
            sku,
            product_id: variant.product_id,
            model_family: variant.model_family,
            grade,
            reason: 'sku_collision_after_canonicalization',
          });
          continue;
        }
        seenSkus.add(sku);
        slots.push({
          product_id: variant.product_id,
          model_family: variant.model_family,
          ram: variant.ram,
          ssd: variant.ssd,
          colour: variant.colour || '',
          cpu_gpu: variant.cpu_gpu || '',
          title: variant.title || '',
          backmarket_id: variant.backmarket_id || null,
          grade,
          sku,
          variant,
        });
      } catch (error) {
        blocked.push({
          product_id: variant.product_id,
          model_family: variant.model_family,
          grade,
          reason: error.message,
        });
      }
    }
  }
  return { slots, blocked, collisions };
}

function buildExistingMap(listings) {
  const byProductGrade = new Map();
  for (const listing of listings) {
    const key = `${listing.product_id}::${listing.grade}`;
    if (!byProductGrade.has(key)) byProductGrade.set(key, []);
    byProductGrade.get(key).push(listing);
  }
  return byProductGrade;
}

async function createDraftListing(productId, sku, grade) {
  const csvHeader = 'sku,product_id,quantity,warranty_delay,price,state,currency,grade';
  const csvRow = `${sku},${productId},0,12,9999,3,GBP,${grade}`;
  const body = {
    catalog: `${csvHeader}\r\n${csvRow}`,
    quotechar: '"',
    delimiter: ',',
    encoding: 'utf-8',
  };

  const result = await bmApiFetch('/ws/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const taskId = result.bodymessage || result.task_id || result.id;
  if (!taskId) throw new Error(`No task_id from create: ${JSON.stringify(result)}`);
  return taskId;
}

async function pollTask(taskId) {
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await sleep(POLL_DELAY_MS);
    const task = await bmApiFetch(`/ws/tasks/${taskId}`);
    if (task.action_status === 9) {
      const ps = task.result?.product_success || {};
      const pe = task.result?.product_errors || {};
      if (Object.keys(pe).length > 0) throw new Error(`Task errors: ${JSON.stringify(pe)}`);
      const firstKey = Object.keys(ps)[0];
      if (!firstKey) throw new Error(`Task complete but no product_success entry: ${JSON.stringify(task)}`);
      return ps[firstKey];
    }
    if (task.action_status > 9 || task.state === 'FAILURE' || task.status === 'FAILURE') {
      throw new Error(`Task failed: ${JSON.stringify(task)}`);
    }
  }
  throw new Error(`Timed out polling task ${taskId}`);
}

async function fetchListing(listingId) {
  return bmApiFetch(`/ws/listings/${listingId}`);
}

async function updateListing(listingId, body) {
  return bmApiFetch(`/ws/listings/${listingId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function compareListingToCatalog(variant, listing) {
  const actual = parseTitleSpec(listing.title || '');
  const expected = {
    model_family: variant.model_family || '',
    ram: normalizeRam(variant.ram),
    ssd: normalizeStorage(variant.ssd),
  };
  const actualNorm = {
    model_family: actual.model_family || '',
    ram: normalizeRam(actual.ram),
    ssd: normalizeStorage(actual.ssd),
  };

  const issues = [];
  if (listing.grade !== undefined && listing.grade !== variant._targetGrade) {
    issues.push(`grade=${listing.grade} expected=${variant._targetGrade}`);
  }
  if (expected.model_family && actualNorm.model_family && expected.model_family !== actualNorm.model_family) {
    issues.push(`model_family=${actualNorm.model_family} expected=${expected.model_family}`);
  }
  if (expected.ram && actualNorm.ram && expected.ram !== actualNorm.ram) {
    issues.push(`ram=${actualNorm.ram} expected=${expected.ram}`);
  }
  if (expected.ssd && actualNorm.ssd && expected.ssd !== actualNorm.ssd) {
    issues.push(`ssd=${actualNorm.ssd} expected=${expected.ssd}`);
  }

  return {
    verified: issues.length === 0,
    issues,
    actual,
  };
}

function ensureDataDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDataDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function loadExistingRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const catalog = loadCatalog();
  const variants = filterVariants(catalog);
  const activeGrades = gradeFilter ? [gradeFilter] : GRADES;
  const { canonical, blocked: blockedCanonical, duplicateGroups } = canonicalizeVariants(variants);
  const { slots: plan, blocked: blockedPlan, collisions } = buildPlan(canonical);
  const blocked = [
    ...blockedCanonical.flatMap(entry => activeGrades.map(grade => ({ ...entry, grade }))),
    ...blockedPlan,
  ];
  const existingRegistry = loadExistingRegistry();

  console.log(`Registry build mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Verified in-scope Mac variants: ${variants.length}`);
  console.log(`Canonical variants: ${canonical.length}`);
  console.log(`Duplicate groups collapsed: ${duplicateGroups.length}`);
  console.log(`Planned slots: ${plan.length}`);
  console.log(`Blocked slots: ${blocked.length}`);
  console.log(`Remaining SKU collisions: ${collisions.length}`);
  console.log(`Filters: grade=${gradeFilter || 'ALL'} family=${modelFamilyFilter || 'ALL'} batch=${batchSize} skip-existing=${skipExisting}`);

  if (isDryRun) {
    const preview = plan.slice(0, 10).map(slot => ({
      sku: slot.sku,
      grade: slot.grade,
      product_id: slot.product_id,
      model_family: slot.model_family,
      ram: slot.ram,
      ssd: slot.ssd,
      colour: slot.colour,
      action: 'would_check_existing_then_create_or_verify',
    }));
    console.log(JSON.stringify({
      input_variants: variants.length,
      canonical_variants: canonical.length,
      duplicate_groups_collapsed: duplicateGroups.length,
      total_slots: plan.length + blocked.length,
      verified: plan.length,
      blocked: blocked.length,
      failed: 0,
      remaining_sku_collisions: collisions.length,
      preview,
      blocked_preview: blocked.slice(0, 10),
      duplicate_preview: duplicateGroups.slice(0, 10),
      note: 'Dry-run does not call BM API, so existing-listing dedup is not resolved in this mode.',
    }, null, 2));
    return;
  }

  if (collisions.length > 0) {
    writeJson(DUPLICATES_PATH, {
      created_at: new Date().toISOString(),
      duplicate_groups: duplicateGroups,
      remaining_sku_collisions: collisions,
    });
    throw new Error(`Refusing live run: ${collisions.length} SKU collisions remain after canonicalization`);
  }

  const allListings = await fetchAllListings();
  const existingMap = buildExistingMap(allListings);
  console.log(`Fetched ${allListings.length} existing BM listings for dedup.`);

  const registry = {
    created_at: new Date().toISOString(),
    total_slots: 0,
    total_processed: 0,
    verified: 0,
    blocked: 0,
    failed: 0,
    slots: { ...(existingRegistry?.slots || {}) },
    blocked_slots: [...(existingRegistry?.blocked_slots || [])].filter(entry => entry.grade),
    failed_slots: [...(existingRegistry?.failed_slots || [])],
  };
  const corrections = {
    created_at: new Date().toISOString(),
    corrections: [],
  };
  const duplicatesReport = {
    created_at: new Date().toISOString(),
    duplicate_groups: duplicateGroups,
    remaining_sku_collisions: collisions,
  };

  const blockedKeys = new Set(registry.blocked_slots.map(entry => `${entry.product_id || ''}::${entry.grade || ''}::${entry.reason || ''}`));
  for (const blockedSlot of blocked) {
    const key = `${blockedSlot.product_id || ''}::${blockedSlot.grade || ''}::${blockedSlot.reason || ''}`;
    if (blockedKeys.has(key)) continue;
    blockedKeys.add(key);
    registry.blocked_slots.push(blockedSlot);
  }

  let processed = 0;
  for (let offset = 0; offset < plan.length; offset += batchSize) {
    const batch = plan.slice(offset, offset + batchSize);
    console.log(`Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(plan.length / batchSize)} (${batch.length} slots)`);

    for (const slot of batch) {
      processed++;
      const variant = { ...slot.variant, _targetGrade: slot.grade };
      const dedupKey = `${slot.product_id}::${slot.grade}`;
      const existingCandidates = existingMap.get(dedupKey) || [];
      const exactSkuCandidate = existingCandidates.find(item => item.sku === slot.sku);
      const chosenExisting = exactSkuCandidate || existingCandidates[0] || null;

      try {
        let listingRecord;
        let listingId;
        let created = false;

        if (chosenExisting) {
          if (skipExisting) {
            console.log(`[${processed}/${plan.length}] SKIP existing ${slot.sku} -> ${chosenExisting.listing_id || chosenExisting.id}`);
            continue;
          }
          listingId = chosenExisting.listing_id || chosenExisting.id;
          console.log(`[${processed}/${plan.length}] VERIFY existing ${slot.sku} -> ${listingId}`);
          listingRecord = await fetchListing(listingId);
        } else {
          console.log(`[${processed}/${plan.length}] CREATE ${slot.sku}`);
          const taskId = await createDraftListing(slot.product_id, slot.sku, slot.grade);
          const taskResult = await pollTask(taskId);
          listingId = taskResult.listing_id;
          created = true;
          if (!listingId) throw new Error(`No listing_id from task ${taskId}`);
          listingRecord = await fetchListing(listingId);
          await sleep(CREATE_DELAY_MS);
        }

        const comparison = compareListingToCatalog(variant, listingRecord);
        if ((listingRecord.sku || '') !== slot.sku) {
          await updateListing(listingId, { sku: slot.sku });
          listingRecord.sku = slot.sku;
        }
        const pubState = listingRecord.publication_state ?? listingRecord.pub_state;
        if (String(pubState) === '2') {
          await updateListing(listingId, { quantity: 0 });
        }

        if (!comparison.verified) {
          corrections.corrections.push({
            product_id: slot.product_id,
            catalog_says: {
              model_family: slot.model_family,
              ram: slot.ram,
              ssd: slot.ssd,
            },
            bm_title_says: {
              model_family: comparison.actual.model_family || '',
              ram: comparison.actual.ram || '',
              ssd: comparison.actual.ssd || '',
            },
            action: 'catalog entry is wrong — update to match BM title',
            title: listingRecord.title || '',
            listing_id: listingId,
            grade: slot.grade,
            issues: comparison.issues,
          });
        }

        registry.slots[slot.sku] = {
          listing_id: listingId,
          backmarket_id: listingRecord.backmarket_id || null,
          product_id: listingRecord.product_id || slot.product_id,
          requested_product_id: slot.product_id,
          sku: slot.sku,
          grade: slot.grade,
          model_family: slot.model_family,
          ram: slot.ram,
          ssd: slot.ssd,
          colour: slot.colour,
          title: listingRecord.title || '',
          verified_title: comparison.actual,
          verified: comparison.verified,
          issues: comparison.issues,
          created_now: created,
          created_at: new Date().toISOString(),
        };
      } catch (error) {
        const failedEntry = {
          sku: slot.sku,
          product_id: slot.product_id,
          grade: slot.grade,
          reason: error.message,
        };
        const exists = registry.failed_slots.some(entry =>
          entry.sku === failedEntry.sku &&
          entry.product_id === failedEntry.product_id &&
          entry.grade === failedEntry.grade &&
          entry.reason === failedEntry.reason
        );
        if (!exists) registry.failed_slots.push(failedEntry);
        log.error(`${slot.sku}: ${error.stack || error.message}`);
      }
    }

    writeJson(REGISTRY_PATH, registry);
    writeJson(CORRECTIONS_PATH, corrections);
    writeJson(DUPLICATES_PATH, duplicatesReport);

    if (offset + batchSize < plan.length) {
      console.log(`Batch complete. Pausing ${BATCH_PAUSE_MS / 1000}s before next batch...`);
      await sleep(BATCH_PAUSE_MS);
    }
  }

  writeJson(REGISTRY_PATH, registry);
  writeJson(CORRECTIONS_PATH, corrections);
  writeJson(DUPLICATES_PATH, duplicatesReport);

  registry.verified = Object.values(registry.slots).filter(entry => entry.verified).length;
  registry.blocked = registry.blocked_slots.length;
  registry.failed = registry.failed_slots.length;
  registry.total_slots = Object.keys(registry.slots).length;
  registry.total_processed = registry.total_slots + registry.blocked + registry.failed;

  writeJson(REGISTRY_PATH, registry);

  console.log(`Done. Verified ${registry.verified}/${plan.length}, blocked ${blocked.length}, failed ${registry.failed_slots.length - (existingRegistry?.failed_slots || []).length}.`);
  if (existingRegistry) {
    console.log(`Previous registry existed with ${Object.keys(existingRegistry.slots || {}).length} slots.`);
  }
}

main().catch(error => {
  console.error(`Fatal: ${error.message}`);
  log.error(error.stack || error.message);
  process.exit(1);
});

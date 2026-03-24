#!/usr/bin/env node
/**
 * Batch Apple Spec Checker for BM devices
 * Queries Monday for recent BM items, runs Apple spec lookup, compares, posts comments.
 *
 * Usage:
 *   node batch-spec-check.js                    # devices received in last 7 days
 *   node batch-spec-check.js --days 14          # devices received in last 14 days
 *   node batch-spec-check.js --dry-run          # check but don't post Monday comments
 */

// Load env vars
const fs = require("fs");
const envFile = fs.readFileSync("/home/ricky/config/api-keys/.env", "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const { getAppleSpecsWithRetry } = require("./src/apple-specs");

const MONDAY_APP_TOKEN = process.env.MONDAY_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const BOARD_ID = 349212843;
const BM_BOARD_ID = 3892194968;
const SERIAL_COLUMN = "text4";
const COLOUR_COLUMN = "status8";
const BM_BOARD_RELATION = "board_relation5";
const BM_RAM_COLUMN = "status__1";
const BM_SSD_COLUMN = "color2";
const BM_CPU_COLUMN = "status7__1";
const BM_GPU_COLUMN = "status8__1";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx >= 0 ? parseInt(args[daysIdx + 1]) || 7 : 7;

// --- Monday API ---
async function mondayQuery(query) {
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: MONDAY_APP_TOKEN },
    body: JSON.stringify({ query }),
  });
  return resp.json();
}

async function postMondayComment(itemId, body) {
  const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  await mondayQuery(`mutation { create_update( item_id: ${itemId}, body: "${escaped}" ) { id } }`);
}

// --- Colour normalization ---
function normalizeColour(colour) {
  if (!colour) return "";
  return colour.toLowerCase().replace(/\s+/g, "").replace(/gray/g, "grey");
}

// --- Spec comparison ---
function compareSpecs(appleSpecs, claimedSpecs) {
  if (!appleSpecs || !claimedSpecs) return [];
  const mismatches = [];
  const comparisons = [
    { field: "RAM", apple: appleSpecs.memory, claimed: claimedSpecs.ram },
    { field: "SSD", apple: appleSpecs.storage, claimed: claimedSpecs.ssd },
    { field: "CPU", apple: appleSpecs.cpu, claimed: claimedSpecs.cpu },
    { field: "GPU", apple: appleSpecs.gpu, claimed: claimedSpecs.gpu },
  ];
  for (const c of comparisons) {
    if (!c.apple || !c.claimed) continue;
    const a = c.apple.toLowerCase().replace(/\s/g, "");
    const b = c.claimed.toLowerCase().replace(/\s/g, "");
    if (a !== b && !a.includes(b) && !b.includes(a)) {
      mismatches.push(`⚠️ ${c.field}: Apple says ${c.apple}, BM says ${c.claimed}`);
    }
  }
  // Colour comparison with normalization
  if (appleSpecs.color && claimedSpecs.colour) {
    const ac = normalizeColour(appleSpecs.color);
    const cc = normalizeColour(claimedSpecs.colour);
    if (ac && cc && ac !== cc && !ac.includes(cc) && !cc.includes(ac)) {
      mismatches.push(`⚠️ Colour: Apple says ${appleSpecs.color}, BM says ${claimedSpecs.colour}`);
    }
  }
  return mismatches;
}

// --- Get BM claimed specs ---
async function getBmClaimedSpecs(mainItemId) {
  const linkQuery = `{ items(ids: [${mainItemId}]) { column_values(ids: ["${BM_BOARD_RELATION}"]) { id ... on BoardRelationValue { linked_item_ids } } } }`;
  const linkData = await mondayQuery(linkQuery);
  const linkCol = linkData?.data?.items?.[0]?.column_values?.[0];
  const bmItemId = linkCol?.linked_item_ids?.[0] || null;
  if (!bmItemId) return null;

  const specsQuery = `{ items(ids: [${bmItemId}]) { column_values(ids: ["${BM_RAM_COLUMN}", "${BM_SSD_COLUMN}", "${BM_CPU_COLUMN}", "${BM_GPU_COLUMN}"]) { id text } } }`;
  const specsData = await mondayQuery(specsQuery);
  const cols = specsData?.data?.items?.[0]?.column_values || [];

  // Get colour from main board
  const colourQuery = `{ items(ids: [${mainItemId}]) { column_values(ids: ["${COLOUR_COLUMN}"]) { id text } } }`;
  const colourData = await mondayQuery(colourQuery);
  const colourCol = colourData?.data?.items?.[0]?.column_values?.[0];

  return {
    ram: cols.find(c => c.id === BM_RAM_COLUMN)?.text?.trim() || "",
    ssd: cols.find(c => c.id === BM_SSD_COLUMN)?.text?.trim() || "",
    cpu: cols.find(c => c.id === BM_CPU_COLUMN)?.text?.trim() || "",
    gpu: cols.find(c => c.id === BM_GPU_COLUMN)?.text?.trim() || "",
    colour: colourCol?.text?.trim() || "",
  };
}

// --- Find BM items received in date range ---
async function findRecentBmItems(days) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  // Query active repair groups for BM items with serials
  const ACTIVE_GROUPS = [
    "new_group70029",       // Today's Repairs
    "new_group81510__1",    // Safan (Short Deadline)
    "new_group99626",       // Andres
    "new_group97788__1",    // Mykhailo
    "group_mktmskq5",       // Roni
    "group_mkx5bd07",       // Adil
    "group_mkwkapa6",       // Quality Control
    "new_group88387__1",    // BMs Awaiting Sale
    "new_group77650__1",    // Outbound Shipping
    "new_group34603",       // Ferrari
    "group_mkrcpnpb",       // Awaiting Parts
    "new_group6580",        // Client Services - To Do
  ];

  const query = `{ boards(ids: [${BOARD_ID}]) { groups(ids: ${JSON.stringify(ACTIVE_GROUPS)}) { items_page(limit: 200) { items { id name column_values(ids: ["${SERIAL_COLUMN}", "${COLOUR_COLUMN}", "status", "creation_log4"]) { id text } } } } } }`;
  const data = await mondayQuery(query);
  const groups = data?.data?.boards?.[0]?.groups || [];
  const allItems = groups.flatMap(g => g.items_page?.items || []);

  // Filter: BM items with serials, created since date
  return allItems.filter(item => {
    const isBm = item.column_values?.find(c => c.id === "status")?.text === "BM";
    const serial = item.column_values?.find(c => c.id === SERIAL_COLUMN)?.text?.trim();
    const created = item.column_values?.find(c => c.id === "creation_log4")?.text || "";
    const createdDate = created.split(" ")[0]; // "2026-03-02 00:01:03 UTC" → "2026-03-02"
    return isBm && serial && serial.length >= 8 && createdDate >= sinceStr;
  }).map(item => ({
    id: item.id,
    name: item.name,
    serial: item.column_values.find(c => c.id === SERIAL_COLUMN).text.trim(),
    colour: item.column_values.find(c => c.id === COLOUR_COLUMN)?.text?.trim() || "",
  }));
}

// --- Main ---
async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  Apple Spec Checker — Batch Run");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN" : "LIVE (posting Monday comments)"}`);
  console.log(`  Range: last ${DAYS} days`);
  console.log("═══════════════════════════════════════\n");

  const items = await findRecentBmItems(DAYS);
  console.log(`Found ${items.length} BM items with serials\n`);

  if (items.length === 0) {
    console.log("Nothing to check.");
    return;
  }

  let checked = 0, skipped = 0, errors = 0;
  const realMismatches = [];

  for (const item of items) {
    const bmMatch = item.name.match(/BM\s*\d+/i);
    const label = bmMatch ? bmMatch[0] : item.name;
    process.stdout.write(`[${label}] ${item.serial.substring(0, 12)}... `);

    try {
      const specs = await getAppleSpecsWithRetry(item.serial, 2);

      if (!specs || specs.error) {
        if (specs?.unsupported) {
          console.log(`SKIP (${specs.error})`);
          skipped++;
        } else {
          console.log(`ERROR (${specs?.error || "unknown"})`);
          errors++;
        }
        continue;
      }

      // Build spec comment
      const specLines = [
        `📱 Apple Confirmed: ${specs.model || "Unknown"}`,
        specs.color ? `Colour: ${specs.color}` : null,
        specs.chip ? `Chip: ${specs.chip}` : null,
        specs.cpu ? `CPU: ${specs.cpu}` : null,
        specs.gpu ? `GPU: ${specs.gpu}` : null,
        specs.memory ? `RAM: ${specs.memory}` : null,
        specs.storage ? `Storage: ${specs.storage}` : null,
      ].filter(Boolean);

      // Compare against claimed
      const claimed = await getBmClaimedSpecs(item.id);
      const mismatches = compareSpecs(specs, claimed);

      if (mismatches.length > 0) {
        specLines.push("", "🔴 SPEC MISMATCH:", ...mismatches);
        realMismatches.push({ label, serial: item.serial, mismatches });
        console.log(`🔴 MISMATCH — ${specs.model}, ${specs.color}`);
        for (const m of mismatches) console.log(`    ${m}`);
      } else {
        specLines.push("", "✅ All specs match BM claimed values");
        console.log(`✅ OK — ${specs.model}, ${specs.memory || ""}, ${specs.storage || ""}, ${specs.color}`);
      }

      // Post comment to Monday
      const comment = specLines.join("\n");
      if (!DRY_RUN) {
        await postMondayComment(item.id, comment);
      }

      // Update colour on main board
      if (!DRY_RUN && specs.color) {
        const columnValues = JSON.stringify({ [COLOUR_COLUMN]: specs.color }).replace(/"/g, '\\"');
        await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${item.id}, column_values: "${columnValues}" ) { id } }`);
      }

      checked++;
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      errors++;
    }

    // Rate limit — Apple site needs breathing room
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  Checked: ${checked}`);
  console.log(`  Skipped: ${skipped} (unsupported)`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Real mismatches: ${realMismatches.length}`);
  if (realMismatches.length > 0) {
    console.log("\n  🔴 MISMATCHES:");
    for (const m of realMismatches) {
      console.log(`    ${m.label} (${m.serial}):`);
      for (const mm of m.mismatches) console.log(`      ${mm}`);
    }
  }
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});

import fs from "node:fs";
import { getConfig } from "../lib/config.js";
import { openDb, getUnprocessedEdits, markEditsProcessed } from "../lib/db.js";
import { DraftClient } from "../lib/draft.js";

function groupEdits(edits) {
  const groups = {
    tone: [],
    phrasing: [],
    factual: [],
    structural: []
  };

  for (const edit of edits) {
    const original = edit.original_draft || "";
    const edited = edit.edited_draft || "";
    const reason = (edit.reason || "").toLowerCase();
    const bucket =
      reason.includes("tone") || reason.includes("warm") || reason.includes("formal")
        ? "tone"
        : reason.includes("price") || reason.includes("hour") || reason.includes("turnaround")
          ? "factual"
          : Math.abs(original.length - edited.length) > 120
            ? "structural"
            : "phrasing";

    groups[bucket].push({
      id: edit.id,
      category: edit.category,
      reason: edit.reason,
      original_draft: original,
      edited_draft: edited
    });
  }

  return groups;
}

function appendLearnedRules(filePath, content, editCount) {
  const header = `## ${new Date().toISOString().slice(0, 10)} (from ${editCount} edits)\n\n`;
  const trimmed = content.trim();

  if (!fs.existsSync(filePath) || !fs.readFileSync(filePath, "utf8").trim()) {
    fs.writeFileSync(
      filePath,
      "# Learned Rules (auto-generated from reviewer feedback)\n\n" + header + trimmed + "\n",
      "utf8"
    );
    return;
  }

  const existing = fs.readFileSync(filePath, "utf8");
  if (existing.includes(header) && existing.includes(trimmed)) {
    return;
  }

  fs.appendFileSync(filePath, `\n${header}${trimmed}\n`, "utf8");
}

function buildFallbackRules(groupedEdits) {
  const lines = [];

  for (const [groupName, edits] of Object.entries(groupedEdits)) {
    for (const edit of edits.slice(0, 3)) {
      if (!edit.reason) {
        continue;
      }
      lines.push(
        `- ${capitalize(groupName)} adjustment: ${edit.reason}. Apply this pattern when handling similar ${edit.category || "customer service"} replies.`
      );
    }
  }

  return lines.length ? lines.join("\n") : "- Preserve reviewer edits as future drafting guidance when the same pattern appears again.";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function runLearning() {
  const config = getConfig();
  const db = openDb();
  const edits = getUnprocessedEdits(db);

  if (!edits.length) {
    db.close();
    return { processed: 0 };
  }

  const grouped = groupEdits(edits);
  const draftClient = new DraftClient(config.openrouter);
  let rules;
  try {
    rules = await draftClient.extractRules(grouped);
  } catch (error) {
    rules = buildFallbackRules(grouped);
  }

  appendLearnedRules(config.learnedRulesPath, rules, edits.length);
  markEditsProcessed(db, edits.map((edit) => edit.id));
  db.close();

  return {
    processed: edits.length,
    grouped
  };
}

async function main() {
  const result = await runLearning();
  console.log(`Processed ${result.processed} edits`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

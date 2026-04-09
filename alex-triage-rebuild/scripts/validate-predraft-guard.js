import { readRequiredDraftFiles } from "../lib/draft.js";

const REQUIRED_FILES = [
  "/home/ricky/.openclaw/agents/alex-cs/workspace/CLAUDE.md",
  "/home/ricky/.openclaw/agents/alex-cs/workspace/AGENTS.md"
];

function main() {
  const loaded = readRequiredDraftFiles(REQUIRED_FILES);
  const hasClaude = loaded.includes(REQUIRED_FILES[0]);
  const hasAgents = loaded.includes(REQUIRED_FILES[1]);
  console.log(JSON.stringify({
    enforcedFiles: REQUIRED_FILES,
    hasClaude,
    hasAgents,
    loadedLength: loaded.length,
    status: hasClaude && hasAgents ? 'PASS' : 'FAIL'
  }, null, 2));
}

main();

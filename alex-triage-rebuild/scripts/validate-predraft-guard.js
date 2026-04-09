import { readRequiredDraftFiles } from "../lib/draft.js";

function main() {
  const loaded = readRequiredDraftFiles();
  const hasSoul = loaded.includes('/home/ricky/.openclaw/agents/alex-cs/workspace/SOUL.md');
  const hasUser = loaded.includes('/home/ricky/.openclaw/agents/alex-cs/workspace/USER.md');
  console.log(JSON.stringify({
    hasSoul,
    hasUser,
    loadedLength: loaded.length,
    status: hasSoul && hasUser ? 'PASS' : 'FAIL'
  }, null, 2));
}

main();

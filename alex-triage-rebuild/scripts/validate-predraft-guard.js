import { readRequiredDraftFiles } from "../lib/draft.js";

const REQUIRED_FILES = [
  "/home/ricky/.openclaw/agents/alex-cs/workspace/docs/ferrari-guide.md",
  "/home/ricky/.openclaw/agents/alex-cs/workspace/docs/reply-templates.md"
];

function main() {
  const loaded = readRequiredDraftFiles(REQUIRED_FILES);
  const hasFerrariGuide = loaded.includes(REQUIRED_FILES[0]);
  const hasReplyTemplates = loaded.includes(REQUIRED_FILES[1]);
  console.log(JSON.stringify({
    enforcedFiles: REQUIRED_FILES,
    hasFerrariGuide,
    hasReplyTemplates,
    loadedLength: loaded.length,
    status: hasFerrariGuide && hasReplyTemplates ? 'PASS' : 'FAIL'
  }, null, 2));
}

main();

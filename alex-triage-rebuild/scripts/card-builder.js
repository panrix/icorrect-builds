import { buildCard, classifyConversation, computePriority, flattenMessages } from "../lib/triage.js";

export function buildConversationCard({ conversation, mondayMatch, mondayAlternatives = [], pastRepairs = [], price, workspaceId }) {
  const messages = flattenMessages(conversation);
  const category = classifyConversation(conversation, messages, mondayMatch);
  const priority = computePriority({
    category,
    mondayMatch,
    lastAdminMessage: [...messages].reverse().find((message) => message.author_type === "admin"),
    lastCustomerMessage: [...messages].reverse().find((message) => message.author_type === "user")
  });

  return {
    messages,
    category,
    priority,
    card: buildCard({
      conversation,
      messages,
      mondayMatch,
      mondayAlternatives,
      pastRepairs,
      category,
      priority,
      price,
      workspaceId
    })
  };
}

async function main() {
  throw new Error("This module is intended to be imported by inbox-triage.js");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}


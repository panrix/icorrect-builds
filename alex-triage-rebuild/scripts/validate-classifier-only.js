import { classifyConversation, computePriority } from "../lib/triage.js";
import { TelegramClient } from "../lib/telegram.js";

const telegram = new TelegramClient({
  token: "test-token",
  chatId: "-1003822970061",
  emailsThreadId: 774,
  baseUrl: "https://api.telegram.org",
  publicBaseUrl: "https://alex.icorrect.co.uk"
});

const cases = [
  {
    id: "active-repair",
    conversation: { source: { type: "email", author: { email: "liam@gmail.com" } } },
    messages: [{ author_type: "user", text: "Any update on my repair please?" }],
    mondayMatch: { confidence: 0.95, current_status: "Diagnostics", status: "Diagnostics" },
    pastRepairs: [],
    expected: "active_repair"
  },
  {
    id: "new-enquiry",
    conversation: { source: { type: "email", author: { email: "jane@gmail.com" } } },
    messages: [{ author_type: "user", text: "How much is an iPhone screen repair?" }],
    mondayMatch: null,
    pastRepairs: [],
    expected: "new_enquiry"
  },
  {
    id: "quote-followup",
    conversation: { source: { type: "email", author: { email: "mark@gmail.com" } } },
    messages: [{ author_type: "user", text: "That quote is too expensive. Can you do better?" }],
    mondayMatch: { confidence: 0.95, quote_amount: "299", current_status: "Quote Sent", status: "Quote Sent" },
    pastRepairs: [],
    expected: "quote_followup"
  },
  {
    id: "complaint-warranty",
    conversation: { source: { type: "email", author: { email: "sam@gmail.com" } } },
    messages: [{ author_type: "user", text: "I am unhappy and want a refund because it is still not working." }],
    mondayMatch: null,
    pastRepairs: [],
    expected: "complaint_warranty"
  },
  {
    id: "corporate-account",
    conversation: { source: { type: "email", author: { email: "it@company.com" } } },
    messages: [{ author_type: "user", text: "We need a quote for a staff device and company billing." }],
    mondayMatch: null,
    pastRepairs: [],
    expected: "corporate_account"
  },
  {
    id: "bm-email",
    conversation: { source: { type: "email", author: { email: "support@backmarket.com" } } },
    messages: [{ author_type: "user", text: "Back Market order issue" }],
    mondayMatch: null,
    pastRepairs: [],
    expected: "bm_email"
  }
];

const results = cases.map((test) => {
  const category = classifyConversation(test.conversation, test.messages, test.mondayMatch, test.pastRepairs);
  const priority = computePriority({
    category,
    mondayMatch: test.mondayMatch,
    lastAdminMessage: null,
    lastCustomerMessage: { created_at: Math.floor(Date.now() / 1000) }
  });
  return {
    id: test.id,
    category,
    priority,
    pass: category === test.expected
  };
});

const keyboards = {
  complaint_warranty: telegram.keyboard("c1", { tier: "red", category: "complaint_warranty" }),
  active_repair_green: telegram.keyboard("c2", { tier: "green", category: "active_repair" }),
  new_enquiry_yellow: telegram.keyboard("c3", { tier: "yellow", category: "new_enquiry" })
};

console.log(JSON.stringify({ results, keyboards }, null, 2));

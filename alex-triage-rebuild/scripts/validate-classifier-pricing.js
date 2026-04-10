import { detectDeviceFromMessages, extractDeviceForPricing, extractRepairType, classifyConversation } from "../lib/triage.js";
import { findPrice, loadPricingIndex } from "./shopify-pricing.js";

const pricingIndex = loadPricingIndex("/home/ricky/builds/alex-triage-rebuild/data/pricing.json");

const cases = [
  {
    id: "new-enquiry-screen",
    conversation: { source: { type: "email", author: { email: "jane@gmail.com" }, subject: "iPhone 11 LCD screen repair" } },
    messages: [
      { author_type: "user", text: "Hi, how much is an iPhone 11 LCD screen repair?" }
    ],
    mondayMatch: null,
    expectedCategory: "new_enquiry"
  },
  {
    id: "active-repair-chase",
    conversation: { source: { type: "email", author: { email: "liam@gmail.com" }, subject: "Update on repair" } },
    messages: [
      { author_type: "user", text: "Any update on my repair please?" }
    ],
    mondayMatch: { confidence: 0.95, current_status: "Diagnostics", status: "Diagnostics", device_model: "MacBook Pro 13", repair_type: "diagnostic" },
    expectedCategory: "active_repair"
  },
  {
    id: "quote-followup",
    conversation: { source: { type: "email", author: { email: "mark@gmail.com" }, subject: "Repair quote" } },
    messages: [
      { author_type: "user", text: "That quote is too expensive. Can you do better?" }
    ],
    mondayMatch: { confidence: 0.95, quote_amount: "299", current_status: "Quote Sent", status: "Quote Sent", device_model: "iPhone 11", repair_type: "lcd screen repair" },
    expectedCategory: "quote_followup"
  },
  {
    id: "corporate",
    conversation: { source: { type: "email", author: { email: "it@company.com" }, subject: "Staff iPhone repair" } },
    messages: [
      { author_type: "user", text: "We need a quote for a staff iPhone battery repair and company billing." }
    ],
    mondayMatch: null,
    expectedCategory: "corporate_account"
  },
  {
    id: "complaint",
    conversation: { source: { type: "email", author: { email: "sam@gmail.com" }, subject: "Complaint" } },
    messages: [
      { author_type: "user", text: "I am unhappy and want a refund because it is still not working." }
    ],
    mondayMatch: null,
    expectedCategory: "complaint_warranty"
  }
];

const results = cases.map((test) => {
  const detectedDevice = detectDeviceFromMessages(test.messages);
  const device = extractDeviceForPricing(test.conversation, test.messages, test.mondayMatch) || detectedDevice;
  const repairType = extractRepairType(test.conversation, test.messages, test.mondayMatch);
  const category = classifyConversation(test.conversation, test.messages, test.mondayMatch, []);
  const price = findPrice(pricingIndex, test.mondayMatch?.device_model || device, test.mondayMatch?.repair_type || repairType);
  return {
    id: test.id,
    detectedDevice,
    device,
    repairType,
    category,
    price: price?.label || null,
    passCategory: category === test.expectedCategory,
    matchedPricing: Boolean(price)
  };
});

console.log(JSON.stringify(results, null, 2));

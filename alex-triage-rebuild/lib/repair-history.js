import { SupabaseClient } from "./supabase.js";

export async function lookupRepairHistory({ config, email = null, phone = null, limit = 5 }) {
  const client = new SupabaseClient(config.supabase);
  return client.rpc("search_repair_history", {
    p_email: email,
    p_phone: phone,
    p_limit: limit
  });
}

export function formatPastRepairs(pastRepairs = []) {
  if (!pastRepairs.length) {
    return ["No previous repairs found. New customer."];
  }

  return pastRepairs.map((repair) => {
    const when = repair.completion_date || repair.intake_date || "Unknown date";
    const amount = repair.quote_amount ? ` (£${Number(repair.quote_amount).toFixed(0)})` : "";
    const warranty = repair.warranty_returns > 1 ? ` ⚠️ ${repair.warranty_returns} returns` : repair.was_warranty ? " ⚠️ warranty" : "";
    return `${when}: ${repair.device_model || "Unknown device"} — ${repair.repair_type || "Unknown repair"}${amount} ✅ ${repair.repair_status || "Unknown"}${warranty}`;
  });
}

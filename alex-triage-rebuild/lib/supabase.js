import { requestJson } from "./http.js";

function buildHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra
  };
}

export class SupabaseClient {
  constructor(config) {
    this.url = config.url.replace(/\/$/, "");
    this.serviceRoleKey = config.serviceRoleKey;
  }

  async upsertRepairHistory(rows, { onConflict = "monday_item_id" } = {}) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const query = new URLSearchParams({ on_conflict: onConflict });
    return requestJson(`${this.url}/rest/v1/repair_history?${query.toString()}`, {
      method: "POST",
      headers: buildHeaders(this.serviceRoleKey, {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      }),
      body: JSON.stringify(rows),
      timeoutMs: 120000
    });
  }

  async countRepairHistory() {
    const response = await fetch(`${this.url}/rest/v1/repair_history?select=count`, {
      method: "HEAD",
      headers: buildHeaders(this.serviceRoleKey, {
        Prefer: "count=exact"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to count repair_history rows: HTTP ${response.status} ${text.slice(0, 200)}`);
    }

    const range = response.headers.get("content-range") || "0-0/0";
    const total = Number(range.split("/")[1] || 0);
    return Number.isFinite(total) ? total : 0;
  }

  async rpc(functionName, params = {}) {
    return requestJson(`${this.url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: buildHeaders(this.serviceRoleKey, {
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(params),
      timeoutMs: 120000
    });
  }

  async queryRepairHistoryStats() {
    return this.rpc("run_repair_history_stats", {});
  }
}

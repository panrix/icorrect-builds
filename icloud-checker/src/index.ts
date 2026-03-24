interface Env {
  SICKW_API_KEY: string;
  MONDAY_API_TOKEN: string;
  MONDAY_SIGNING_SECRET: string;
  SLACK_WEBHOOK_URL: string;
}

const BOARD_ID = 349212843;
const SERIAL_COLUMN = "text4";
const STATUS_COLUMN = "status24";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json<Record<string, unknown>>();

      // Monday webhook challenge verification
      if ("challenge" in body) {
        return Response.json({ challenge: body.challenge });
      }

      const event = body.event as {
        type?: string;
        pulseId?: number;
        pulseName?: string;
        columnId?: string;
        value?: { value?: string };
        boardId?: number;
      } | undefined;

      if (!event?.pulseId) {
        return new Response("No event data", { status: 200 });
      }

      // Only process serial number column changes on our board
      if (event.columnId !== SERIAL_COLUMN || event.boardId !== BOARD_ID) {
        return new Response("Ignored", { status: 200 });
      }

      const itemId = event.pulseId;
      const itemName = event.pulseName || "Unknown";

      // Get serial number from the event or query Monday
      let serial = event.value?.value?.trim() || "";

      if (!serial) {
        // Fallback: query Monday for the serial
        serial = await getSerialFromMonday(itemId, env);
      }

      if (!serial) {
        console.log(`Item ${itemId}: empty serial, skipping`);
        return new Response("No serial", { status: 200 });
      }

      console.log(`Checking iCloud for item ${itemId} (${itemName}), serial: ${serial}`);

      // Call SickW API
      const sickwResult = await checkSickW(serial, env);

      if (!sickwResult.success) {
        await postMondayComment(
          itemId,
          `iCloud Check Failed for serial ${serial}: ${sickwResult.error}`,
          env
        );
        return new Response("SickW error", { status: 200 });
      }

      const icloudOn = sickwResult.icloudLock === "ON";
      const statusLabel = icloudOn ? "IC ON" : "IC OFF";

      // Update Monday status column
      await updateMondayStatus(itemId, statusLabel, env);

      // Post comment with results
      const icon = icloudOn ? "\u26a0\ufe0f" : "\u2705";
      const comment = [
        `${icon} iCloud Check: ${sickwResult.icloudLock}`,
        sickwResult.model ? `Model: ${sickwResult.model}` : null,
        `Serial: ${serial}`,
      ]
        .filter(Boolean)
        .join("\n");

      await postMondayComment(itemId, comment, env);

      // Slack alert if iCloud ON
      if (icloudOn) {
        await sendSlackAlert(itemName, serial, sickwResult.model, env);
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Worker error:", err);
      return new Response("Internal error", { status: 500 });
    }
  },
};

// --- SickW API ---

interface SickWResult {
  success: boolean;
  icloudLock?: string;
  model?: string;
  error?: string;
}

async function checkSickW(serial: string, env: Env): Promise<SickWResult> {
  const url = `https://sickw.com/api.php?imei=${encodeURIComponent(serial)}&service=30&format=json&key=${encodeURIComponent(env.SICKW_API_KEY)}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    return { success: false, error: `HTTP ${resp.status}` };
  }

  const data = await resp.json<{ status?: string; result?: string }>();

  if (data.status !== "success") {
    return { success: false, error: data.status || "Unknown SickW error" };
  }

  const html = data.result || "";

  // Parse iCloud Lock status
  const icloudMatch = html.match(/iCloud Lock:.*?(ON|OFF)/i);
  const icloudLock = icloudMatch ? icloudMatch[1].toUpperCase() : undefined;

  if (!icloudLock) {
    return { success: false, error: "Could not parse iCloud status from response" };
  }

  // Parse model
  const modelMatch = html.match(/Model:\s*([^<\n]+)/i);
  const model = modelMatch ? modelMatch[1].trim() : undefined;

  return { success: true, icloudLock, model };
}

// --- Monday.com API ---

async function mondayQuery(query: string, env: Env): Promise<Record<string, unknown>> {
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: env.MONDAY_API_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  return resp.json<Record<string, unknown>>();
}

async function getSerialFromMonday(itemId: number, env: Env): Promise<string> {
  const query = `{ items(ids: [${itemId}]) { column_values(ids: ["${SERIAL_COLUMN}"]) { text } } }`;
  const data = await mondayQuery(query, env);

  const items = (data.data as { items?: Array<{ column_values?: Array<{ text?: string }> }> })?.items;
  return items?.[0]?.column_values?.[0]?.text?.trim() || "";
}

async function updateMondayStatus(itemId: number, label: string, env: Env): Promise<void> {
  const columnValues = JSON.stringify({ [STATUS_COLUMN]: { label } }).replace(/"/g, '\\"');
  const query = `mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`;

  await mondayQuery(query, env);
}

async function postMondayComment(itemId: number, body: string, env: Env): Promise<void> {
  const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const query = `mutation { create_update( item_id: ${itemId}, body: "${escaped}" ) { id } }`;

  await mondayQuery(query, env);
}

// --- Slack ---

async function sendSlackAlert(
  itemName: string,
  serial: string,
  model: string | undefined,
  env: Env
): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;

  const text = [
    `\u26a0\ufe0f *iCloud Lock DETECTED*`,
    `*Item:* ${itemName}`,
    `*Serial:* ${serial}`,
    model ? `*Model:* ${model}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await fetch(env.SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

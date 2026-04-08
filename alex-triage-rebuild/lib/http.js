export async function requestJson(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 30000
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal
    });

    const text = await response.text();
    const json = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText} for ${url}: ${text.slice(0, 400)}`
      );
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}


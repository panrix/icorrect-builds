const { chromium } = require("playwright");
const path = require("path");
const fsEnv = require("fs");

function loadEnvFile(filePath) {
  try {
    const content = fsEnv.readFileSync(filePath, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {}
}
loadEnvFile("/home/ricky/config/api-keys/.env");

if (!process.env.PROXY_SERVER || !process.env.PROXY_USER || !process.env.PROXY_PASS) {
  throw new Error(
    "apple-specs.js: PROXY_SERVER / PROXY_USER / PROXY_PASS not set. Configure them in /home/ricky/config/api-keys/.env"
  );
}

const PROXY = {
  server: process.env.PROXY_SERVER,
  username: process.env.PROXY_USER,
  password: process.env.PROXY_PASS,
};

const ORDER_URL = "https://selfservicerepair.com/en-US/order";

/**
 * Look up MacBook specs from Apple Self Service Repair by serial number.
 * Uses Playwright to navigate the site and intercept API responses.
 * Returns: { model, color, cpu, gpu, memory, storage, partName } or { error }
 */
async function getAppleSpecs(serial) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      proxy: PROXY,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const page = await context.newPage();

    // Capture API responses
    let deviceData = null;
    let sparesData = null;

    page.on("response", async (response) => {
      const url = response.url();
      try {
        if (url.includes("GetDeviceIdRecaptcha")) {
          deviceData = await response.json();
        }
        if (url.includes("Spares/SearchByDevice")) {
          sparesData = await response.json();
        }
      } catch {}
    });

    // Step 1: Navigate (proxy can be slow — 60s timeout)
    await page.goto(ORDER_URL, { waitUntil: "load", timeout: 60000 });

    // Step 2: Wait for Angular to render the input
    const serialInput = page.locator("input").first();
    await serialInput.waitFor({ state: "visible", timeout: 30000 });
    await serialInput.fill(serial);
    await page.click('button:has-text("Search")');

    // Wait for either model text or API error response
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      if (deviceData) break;
      await page.waitForTimeout(1000);
    }

    if (deviceData?.error) {
      return { error: deviceData.error, unsupported: true };
    }

    // Wait for model text to render on page
    try {
      await page.waitForSelector("text=/Model:/", { timeout: 10000 });
    } catch {
      if (!deviceData) return { error: "Device lookup timed out" };
    }
    await page.waitForTimeout(2000);

    if (!deviceData) {
      return { error: "Device lookup API did not respond" };
    }

    if (deviceData.error) {
      return { error: deviceData.error, unsupported: true };
    }

    const result = {
      model: deviceData.deviceModel || "",
      modelId: deviceData.deviceModelId,
      color: deviceData.color || "",
      findMy: deviceData.findMy || false,
    };

    // Step 3: Select Logic Board repair type
    await page.click("text=Select repair type");
    await page.waitForTimeout(1000);
    await page.click("text=Logic Board").catch(() => {});
    await page.waitForTimeout(8000);

    if (!sparesData) {
      // Retry — sometimes the dropdown interaction is slow
      await page.waitForTimeout(5000);
    }

    // Parse specs from page text — most reliable method
    const bodyText = await page.textContent("body");

    // Format 1: Specs in part name — "Logic Board (M1, 8-Core CPU, 8-Core GPU, 8GB, 512GB)"
    const lbMatch = bodyText.match(/Logic Board\s*\(([^)]+)\)/i);
    if (lbMatch) {
      result.partName = `Logic Board (${lbMatch[1]})`;
      const desc = lbMatch[1];
      const chipMatch = desc.match(/^(M\d+(?:\s+Pro|\s+Max|\s+Ultra)?)/i);
      const cpuMatch = desc.match(/(\d+-Core)\s*CPU/i);
      const gpuMatch = desc.match(/(\d+-Core)\s*GPU/i);
      const gbValues = desc.match(/\d+\s*(?:GB|TB)/gi) || [];

      if (chipMatch) result.chip = chipMatch[1];
      if (cpuMatch) result.cpu = cpuMatch[1];
      if (gpuMatch) result.gpu = gpuMatch[1];
      if (gbValues.length >= 2) {
        result.memory = gbValues[gbValues.length - 2].replace(/\s/g, "");
        result.storage = gbValues[gbValues.length - 1].replace(/\s/g, "");
      } else if (gbValues.length === 1) {
        result.storage = gbValues[0].replace(/\s/g, "");
      }
    }

    // Format 2: Specs in dropdown selectors (newer Macs)
    if (!result.memory) {
      const cpuMatch = bodyText.match(/CPU[\s\S]{0,50}?(\d+-Core)/i);
      const gpuMatch = bodyText.match(/GPU[\s\S]{0,50}?(\d+-Core)/i);
      const memMatch = bodyText.match(/(?:Unified Memory|Memory)[\s\S]{0,50}?(\d+GB)/i);
      const storMatch = bodyText.match(/(?:SSD Storage|Storage)[\s\S]{0,50}?(\d+(?:GB|TB))/i);

      if (cpuMatch) result.cpu = cpuMatch[1];
      if (gpuMatch) result.gpu = gpuMatch[1];
      if (memMatch) result.memory = memMatch[1];
      if (storMatch) result.storage = storMatch[1];
    }

    return result;
  } catch (err) {
    return { error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

// --- Cache ---
const fs = require("fs");
const CACHE_FILE = path.join(__dirname, "..", "specs-cache.json");

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch { return {}; }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Wrapper with retry logic and cache
 */
async function getAppleSpecsWithRetry(serial, maxRetries = 4) {
  // Check cache first
  const cache = loadCache();
  if (cache[serial]) {
    console.log(`Cache hit for ${serial}`);
    return cache[serial];
  }

  for (let i = 0; i <= maxRetries; i++) {
    const result = await getAppleSpecs(serial);
    if (!result.error) {
      cache[serial] = result;
      saveCache(cache);
      return result;
    }
    // Don't retry if device is unsupported by Apple
    if (result.unsupported) {
      cache[serial] = result;
      saveCache(cache);
      return result;
    }
    if (i < maxRetries) {
      console.log(`Retry ${i + 1}/${maxRetries} for ${serial}...`);
      await new Promise((r) => setTimeout(r, 5000));
    } else {
      return result;
    }
  }
}

module.exports = { getAppleSpecs, getAppleSpecsWithRetry };

// CLI test
if (require.main === module) {
  const serial = process.argv[2];
  if (!serial) {
    console.error("Usage: node apple-specs.js <serial>");
    process.exit(1);
  }
  console.log(`Looking up specs for ${serial}...`);
  getAppleSpecsWithRetry(serial).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  });
}

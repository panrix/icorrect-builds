import fs from "node:fs";
import path from "node:path";

const DEFAULT_ENV_PATHS = [
  "/home/ricky/config/api-keys/.env",
  "/home/ricky/config/supabase/.env"
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const result = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function mergeEnv(source) {
  for (const [key, value] of Object.entries(source)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(filePath = DEFAULT_ENV_PATHS) {
  const paths = Array.isArray(filePath) ? filePath : [filePath];
  for (const currentPath of paths) {
    mergeEnv(parseEnvFile(currentPath));
  }
}

function required(name, strict) {
  const value = process.env[name];
  if (!value) {
    if (!strict) {
      return null;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function valueOrRequired(name, strict, fallback) {
  const value = process.env[name];
  if (value) {
    return value;
  }
  if (fallback !== undefined && fallback !== null) {
    return fallback;
  }
  return required(name, strict);
}

function optionalNumber(name, fallback = null) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be numeric`);
  }

  return parsed;
}

function optionalBoolean(name, fallback = false) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`Environment variable ${name} must be a boolean-like value`);
}

export function getConfig(options = {}) {
  const strict = options.strict ?? true;
  loadEnv();

  const rootDir = "/home/ricky/builds/alex-triage-rebuild";
  const dataDir = path.join(rootDir, "data");

  return {
    rootDir,
    dataDir,
    dbPath: path.join(dataDir, "triage.db"),
    pricingPath: path.join(dataDir, "pricing.json"),
    learnedRulesPath: path.join(dataDir, "learned-rules.md"),
    ferrariContextPath: path.join(dataDir, "ferrari-context.md"),
    triageOutputDir: dataDir,
    supabase: {
      url: required("SUPABASE_URL", strict),
      serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", strict)
    },
    intercom: {
      baseUrl: "https://api.intercom.io",
      token: required("INTERCOM_API_TOKEN", strict),
      adminId: valueOrRequired("INTERCOM_ADMIN_ID", strict, "9702338"),
      workspaceId: process.env.INTERCOM_WORKSPACE_ID || "pt6lwaq6",
      needsFerrariTagId: process.env.INTERCOM_TAG_NEEDS_FERRARI_ID || null,
      needsRickyTagId: process.env.INTERCOM_TAG_NEEDS_RICKY_ID || null
    },
    monday: {
      baseUrl: "https://api.monday.com/v2",
      token: required("MONDAY_APP_TOKEN", strict),
      boardId: Number(process.env.MONDAY_MAIN_BOARD_ID || "349212843")
    },
    shopify: {
      store: required("SHOPIFY_STORE", strict),
      token: required("SHOPIFY_ACCESS_TOKEN", strict),
      apiVersion: process.env.SHOPIFY_API_VERSION || "2024-01"
    },
    telegram: {
      token: valueOrRequired("ALEX_TELEGRAM_BOT_TOKEN", strict, process.env.TELEGRAM_BOT_TOKEN || null),
      chatId: valueOrRequired("TELEGRAM_CHAT_ID", strict, "-1003822970061"),
      rickyChatId: valueOrRequired("TELEGRAM_RICKY_CHAT_ID", strict, "1611042131"),
      emailsThreadId: optionalNumber("TELEGRAM_EMAILS_THREAD_ID", 774),
      quotesThreadId: optionalNumber("TELEGRAM_QUOTES_THREAD_ID"),
      invoicesThreadId: optionalNumber("TELEGRAM_INVOICES_THREAD_ID"),
      disablePolling: optionalBoolean("TELEGRAM_DISABLE_POLLING", false),
      baseUrl: "https://api.telegram.org",
      publicBaseUrl: valueOrRequired("ALEX_PUBLIC_BASE_URL", strict, "https://alex.icorrect.co.uk")
    },
    openrouter: {
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: required("OPENROUTER_API_KEY", strict),
      model: process.env.OPENROUTER_MODEL || "qwen/qwen3.6-plus"
    },
    service: {
      port: optionalNumber("ALEX_TRIAGE_PORT", 8020),
      enableLivePosting: optionalBoolean("ALEX_ENABLE_LIVE_POSTING", false),
      emailFreshHours: optionalNumber("ALEX_EMAIL_FRESH_HOURS", 168)
    }
  };
}

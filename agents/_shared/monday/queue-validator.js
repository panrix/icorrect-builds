"use strict";

const fs = require("node:fs");
const path = require("node:path");
// Resolver note: after `npm install --prefix agents/_shared/bridge/`, plain package resolution
// from `agents/_shared/monday/queue-validator.js` does not find `ajv/dist/2020` or
// `ajv-formats`; the bridge-local installed layout at `../bridge/node_modules/...` does.
// This file still tries standard resolution first, then falls back to that verified path.
const Ajv2020 = (function resolveAjv2020() {
  try {
    return require("ajv/dist/2020").default ?? require("ajv/dist/2020");
  } catch (error) {
    if (error && error.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    return require("../bridge/node_modules/ajv/dist/2020").default ?? require("../bridge/node_modules/ajv/dist/2020");
  }
})();
let addFormats = (function resolveAddFormats() {
  try {
    return require("ajv-formats");
  } catch (error) {
    if (error && error.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    return require("../bridge/node_modules/ajv-formats");
  }
})();
addFormats = addFormats.default ?? addFormats;

const SCHEMA_DIR = path.join(__dirname, "schemas", "v1");

function loadSchema(filename) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, filename), "utf8"));
}

function formatErrors(errors) {
  return (errors || []).map((error) => ({
    instancePath: error.instancePath || "",
    schemaPath: error.schemaPath || "",
    keyword: error.keyword || "",
    message: error.message || "Validation failed",
    params: error.params || {}
  }));
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

addFormats(ajv);

const envelopeSchema = loadSchema("queue-record.schema.json");
const payloadSchemas = {
  project: loadSchema("payload-project.schema.json"),
  worker: loadSchema("payload-worker.schema.json"),
  agent: loadSchema("payload-agent.schema.json"),
  delegation: loadSchema("payload-delegation.schema.json"),
  decision: loadSchema("payload-decision.schema.json")
};

const validateEnvelope = ajv.compile(envelopeSchema);
const validatePayloadByKind = Object.fromEntries(
  Object.entries(payloadSchemas).map(([kind, schema]) => [kind, ajv.compile(schema)])
);

function validate(record) {
  if (!validateEnvelope(record)) {
    return {
      ok: false,
      errors: formatErrors(validateEnvelope.errors)
    };
  }

  const payloadValidator = validatePayloadByKind[record.kind];
  if (!payloadValidator) {
    return {
      ok: false,
      errors: [
        {
          instancePath: "/kind",
          schemaPath: "#/properties/kind",
          keyword: "enum",
          message: `Unknown kind: ${record.kind}`,
          params: {
            allowedKinds: Object.keys(validatePayloadByKind)
          }
        }
      ]
    };
  }

  if (!payloadValidator(record.payload)) {
    return {
      ok: false,
      errors: formatErrors(payloadValidator.errors)
    };
  }

  return {
    ok: true,
    errors: []
  };
}

module.exports = {
  validate
};

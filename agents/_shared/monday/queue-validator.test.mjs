import validator from "./queue-validator.js";

const { validate } = validator;

const goodRecord = {
  schema_version: 1,
  id: "01JTESTQUEUEVALIDATORGOOD0000001",
  kind: "agent",
  op: "upsert",
  ts: "2026-04-21T00:00:00Z",
  source_skill: "intake",
  payload: {
    id: "chief-of-staff",
    name: "Chief of Staff",
    status: "alive",
    model: "claude-cli",
    bot_username: "chief_of_staff_bot",
    last_activity_ts: "2026-04-21T00:00:00Z"
  },
  trace: {
    session_id: "session-123",
    user: "ricky"
  }
};

const missingRequiredFieldRecord = {
  ...goodRecord,
  id: "01JTESTQUEUEVALIDATORMISSING0002",
  payload: {
    id: "chief-of-staff",
    name: "Chief of Staff",
    status: "alive",
    model: "claude-cli",
    last_activity_ts: "2026-04-21T00:00:00Z"
  }
};

const extraFieldRecord = {
  ...goodRecord,
  id: "01JTESTQUEUEVALIDATOREXTRA000003",
  payload: {
    ...goodRecord.payload,
    extra_field: "unexpected"
  }
};

function logCase(label, result) {
  console.log(`${label}: ${result.ok ? "PASS" : "FAIL"}`);
  if (!result.ok) {
    console.log(JSON.stringify(result.errors));
  }
}

logCase("known-good", validate(goodRecord));
logCase("missing-required-field", validate(missingRequiredFieldRecord));
logCase("extra-fields", validate(extraFieldRecord));

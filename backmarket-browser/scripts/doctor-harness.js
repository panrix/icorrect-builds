#!/usr/bin/env node
const { runHarnessDoctor, summariseDoctor } = require('../lib/harness-doctor');
const result = runHarnessDoctor();
console.log(JSON.stringify({ result, summary: summariseDoctor(result) }, null, 2));
process.exit(result.ok ? 0 : 1);

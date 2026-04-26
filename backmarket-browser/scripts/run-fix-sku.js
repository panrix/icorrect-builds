#!/usr/bin/env node
const fs = require('fs');
const { buildVerificationPlan } = require('../lib/fix-sku-contract');
const args = process.argv.slice(2);
if (!args.includes('--dry-run')) {
  console.error('Refusing to run without --dry-run. Live SKU writes are not implemented in this skeleton.');
  process.exit(1);
}
const inputArg = args.find(arg => arg.startsWith('--input='));
const rows = inputArg ? JSON.parse(fs.readFileSync(inputArg.split('=')[1], 'utf8')) : [];
const plans = rows.map(buildVerificationPlan);
console.log(JSON.stringify({ ok: plans.every(p => p.ok), plans }, null, 2));

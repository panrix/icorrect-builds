#!/usr/bin/env node
const fs = require('fs');
const { classifyCustomerCareRow } = require('../lib/cs-monitor-contract');
const args = process.argv.slice(2);
if (!args.includes('--fixture')) {
  console.error('Refusing live portal scan in skeleton. Use --fixture.');
  process.exit(1);
}
const inputArg = args.find(arg => arg.startsWith('--input='));
const rows = inputArg ? JSON.parse(fs.readFileSync(inputArg.split('=')[1], 'utf8')) : [];
const events = rows.map(row => ({ ...row, classification: classifyCustomerCareRow(row) }));
console.log(JSON.stringify({ ok: true, events }, null, 2));

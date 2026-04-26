#!/usr/bin/env node
const fs = require('fs');
const { buildFrontendUrlCapturePlan } = require('../lib/frontend-url-capture-contract');

function argValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : '';
}

const inputPath = argValue('--input');
const input = inputPath
  ? JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  : [{
      listing_id: '6709047',
      sku: 'MBP.A2338.M1.16GB.256GB.Grey.Fair',
      product_id: '7408af3f-40ad-4e74-aff8-d2acca799683',
    }];

const rows = Array.isArray(input) ? input : [input];
const plans = rows.map(buildFrontendUrlCapturePlan);
const ok = plans.every(plan => plan.ok);

console.log(JSON.stringify({ ok, plans }, null, 2));
process.exit(ok ? 0 : 1);

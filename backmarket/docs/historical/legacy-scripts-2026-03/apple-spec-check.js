#!/usr/bin/env node
/**
 * Apple Spec Checker — standalone wrapper
 * Usage: node apple-spec-check.js <serial>
 * 
 * Calls the Apple Self Service Repair site to look up device specs.
 * Returns: model, color, chip, cpu, gpu, memory, storage
 * Has built-in caching + retry logic.
 */

// Use the icloud-checker's implementation (has Playwright + proxy)
const path = require('path');
const CHECKER_PATH = '/home/ricky/builds/icloud-checker/src/apple-specs.js';

// Temporarily add icloud-checker's node_modules to resolve path
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  try {
    return origResolve.call(this, request, parent, ...args);
  } catch (e) {
    // Fall back to icloud-checker's node_modules
    const icPath = path.join('/home/ricky/builds/icloud-checker/node_modules', request);
    try { return require.resolve(icPath); } catch { throw e; }
  }
};

const { getAppleSpecsWithRetry } = require(CHECKER_PATH);

const serial = process.argv[2];
if (!serial) {
  console.error('Usage: node apple-spec-check.js <serial>');
  process.exit(1);
}

console.log(`Looking up specs for ${serial}...`);
getAppleSpecsWithRetry(serial).then(result => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

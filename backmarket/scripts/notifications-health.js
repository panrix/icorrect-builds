#!/usr/bin/env node
/**
 * Check BM notification wiring.
 *
 * Default mode verifies local env/config shape. Add --probe to call Telegram
 * getMe and Slack auth.test without sending chat messages.
 */
const { notificationHealthCheck } = require('./lib/notifications');

async function main() {
  const probe = process.argv.includes('--probe');
  const health = await notificationHealthCheck({ probe });
  console.log(JSON.stringify(health, null, 2));
  if (!health.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

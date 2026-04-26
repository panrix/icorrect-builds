const assert = require('assert');
const { createMailboxFetchPlan } = require('../../lib/mailbox-fetcher');

const plan = createMailboxFetchPlan({
  JARVIS_IMAP_SERVER: 'imap.example.com',
  JARVIS_IMAP_PORT: '993',
  JARVIS_EMAIL: 'jarvis@icorrect.co.uk',
  JARVIS_EMAIL_PW: 'secret'
}, { since: '2026-04-25T19:00:00Z' });

assert.equal(plan.ok, true);
assert.equal(plan.mode, 'metadata-only');
assert.equal(plan.liveNetwork, false);
assert.equal(plan.search.readOnly, true);
assert.equal(plan.search.bodyPolicy.storeRawBody, false);
assert(plan.nextImplementation.some(step => step.includes('never persist raw body')));

const bad = createMailboxFetchPlan({ JARVIS_IMAP_SERVER: 'imap.example.com' });
assert.equal(bad.ok, false);
assert(bad.missing.includes('JARVIS_EMAIL'));
assert(bad.missing.includes('JARVIS_EMAIL_PW'));
console.log('mailbox-fetcher.test passed');

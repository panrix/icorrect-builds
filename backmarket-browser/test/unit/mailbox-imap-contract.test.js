const assert = require('assert');
const { buildImapConfig, buildReadOnlySearch } = require('../../lib/mailbox-imap-contract');

const good = buildImapConfig({
  JARVIS_IMAP_SERVER: 'imap.example.com',
  JARVIS_IMAP_PORT: '993',
  JARVIS_EMAIL: 'jarvis@icorrect.co.uk',
  JARVIS_EMAIL_PW: 'secret'
});
assert.equal(good.ok, true);
assert.equal(good.config.passwordPresent, true);
assert.equal(good.config.tls, true);

const bad = buildImapConfig({ JARVIS_IMAP_SERVER: 'imap.example.com' });
assert.equal(bad.ok, false);
assert.deepEqual(bad.missing.sort(), ['JARVIS_EMAIL', 'JARVIS_EMAIL_PW'].sort());

const search = buildReadOnlySearch({ since: '2026-04-25T18:00:00Z' });
assert.equal(search.readOnly, true);
assert.equal(search.criteria.to, 'jarvis@icorrect.co.uk');
assert.equal(search.bodyPolicy.storeRawBody, false);
assert.equal(search.bodyPolicy.storeMetadataOnly, true);
console.log('mailbox-imap-contract.test passed');

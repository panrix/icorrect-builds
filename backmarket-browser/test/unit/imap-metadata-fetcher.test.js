const assert = require('assert');
const { hashMessageId, sanitiseEnvelope, buildImapMetadataFetchPlan } = require('../../lib/imap-metadata-fetcher');

assert.equal(hashMessageId('<abc@example.com>').length, 16);
assert.equal(hashMessageId(''), null);

const envelope = sanitiseEnvelope({
  messageId: '<abc@example.com>',
  receivedAt: '2026-04-25T19:30:00Z',
  from: 'login@backmarket.com',
  subject: 'Your login code',
  preview: 'Code 123456'
});
assert.equal(envelope.rawBodyStored, false);
assert.equal(envelope.codeStored, false);
assert.equal(envelope.previewPresent, true);
assert.equal(envelope.messageIdHash.length, 16);

const plan = buildImapMetadataFetchPlan({
  JARVIS_IMAP_SERVER: 'imap.example.com',
  JARVIS_IMAP_PORT: '993',
  JARVIS_EMAIL: 'jarvis@icorrect.co.uk',
  JARVIS_EMAIL_PW: 'secret'
}, { since: '2026-04-25T19:00:00Z' });
assert.equal(plan.ok, true);
assert.equal(plan.readOnly, true);
assert.equal(plan.liveNetwork, false);
assert.equal(plan.storagePolicy.markRead, false);
assert(plan.commands.some(command => command.includes('EXAMINE')));
assert(plan.commands.some(command => command.includes('BODY.PEEK')));
console.log('imap-metadata-fetcher.test passed');

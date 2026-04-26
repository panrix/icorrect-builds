const { buildImapConfig, buildReadOnlySearch } = require('./mailbox-imap-contract');

function createMailboxFetchPlan(env = process.env, options = {}) {
  const configResult = buildImapConfig(env);
  const search = buildReadOnlySearch(options);
  return {
    ok: configResult.ok,
    missing: configResult.missing,
    mode: 'metadata-only',
    liveNetwork: false,
    config: configResult.config,
    search,
    nextImplementation: [
      'open IMAP connection using config with readOnly=true',
      'select mailbox without marking messages read',
      'search by recipient/from/subject/since criteria',
      'fetch headers, internal date, message id, and short text preview only',
      'pass preview through mailbox-code parser in memory',
      'persist metadata only: message id hash, receivedAt, from, subject, parse status, code age',
      'never persist raw body or extracted code'
    ]
  };
}

module.exports = { createMailboxFetchPlan };

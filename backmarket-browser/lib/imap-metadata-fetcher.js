const tls = require('tls');
const crypto = require('crypto');
const { buildImapConfig, buildReadOnlySearch } = require('./mailbox-imap-contract');

function hashMessageId(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function sanitiseEnvelope(message = {}) {
  return {
    messageIdHash: hashMessageId(message.messageId || message.id),
    receivedAt: message.receivedAt || message.date || null,
    from: message.from || null,
    subject: message.subject || null,
    previewPresent: Boolean(message.preview || message.text),
    rawBodyStored: false,
    codeStored: false
  };
}

function buildImapMetadataFetchPlan(env = process.env, options = {}) {
  const configResult = buildImapConfig(env);
  const search = buildReadOnlySearch(options);
  return {
    ok: configResult.ok,
    missing: configResult.missing,
    transport: 'imap-tls',
    liveNetwork: Boolean(options.liveNetwork),
    readOnly: true,
    config: {
      serverPresent: Boolean(configResult.config.server),
      port: configResult.config.port,
      userPresent: Boolean(configResult.config.user),
      passwordPresent: Boolean(configResult.config.passwordPresent),
      mailbox: configResult.config.mailbox,
      tls: configResult.config.tls
    },
    search,
    commands: [
      'CAPABILITY',
      'LOGIN <redacted-user> <redacted-password>',
      `EXAMINE ${configResult.config.mailbox || 'INBOX'}`,
      'SEARCH HEADER To <recipient> FROM <fromFilter> SUBJECT <subjectFilter> SINCE <date>',
      'FETCH <ids> (BODY.PEEK[HEADER.FIELDS (MESSAGE-ID FROM TO SUBJECT DATE)] INTERNALDATE BODY.PEEK[TEXT]<0.512>)',
      'LOGOUT'
    ],
    storagePolicy: {
      metadataOnly: true,
      rawBodyStored: false,
      extractedCodeStored: false,
      markRead: false
    }
  };
}

function createLiveImapClient(env = process.env) {
  const configResult = buildImapConfig(env);
  if (!configResult.ok) {
    throw new Error(`Missing IMAP env: ${configResult.missing.join(', ')}`);
  }
  return {
    connect() {
      return tls.connect({
        host: configResult.config.server,
        port: configResult.config.port,
        servername: configResult.config.server,
        rejectUnauthorized: true
      });
    },
    // Intentionally not wired to scripts yet. Live mailbox validation must be explicitly approved.
    plan: buildImapMetadataFetchPlan(env, { liveNetwork: false })
  };
}

module.exports = { hashMessageId, sanitiseEnvelope, buildImapMetadataFetchPlan, createLiveImapClient };

function buildImapConfig(env = process.env) {
  const server = env.JARVIS_IMAP_SERVER;
  const port = Number(env.JARVIS_IMAP_PORT || 993);
  const user = env.JARVIS_EMAIL;
  const password = env.JARVIS_EMAIL_PW;
  const mailbox = env.BM_CODE_MAILBOX || 'INBOX';
  const tls = String(env.JARVIS_IMAP_TLS || 'true').toLowerCase() !== 'false';
  const missing = [];
  if (!server) missing.push('JARVIS_IMAP_SERVER');
  if (!user) missing.push('JARVIS_EMAIL');
  if (!password) missing.push('JARVIS_EMAIL_PW');
  return { ok: missing.length === 0, missing, config: { server, port, user, passwordPresent: Boolean(password), mailbox, tls } };
}

function buildReadOnlySearch({ recipient = 'jarvis@icorrect.co.uk', since, fromFilter = 'backmarket', subjectFilter = 'code' } = {}) {
  return {
    readOnly: true,
    mailbox: 'INBOX',
    criteria: {
      to: recipient,
      fromContains: fromFilter,
      subjectContains: subjectFilter,
      since: since || null
    },
    bodyPolicy: {
      fetchHeaders: true,
      fetchTextPreview: true,
      storeRawBody: false,
      storeCode: false,
      storeMetadataOnly: true
    }
  };
}

module.exports = { buildImapConfig, buildReadOnlySearch };

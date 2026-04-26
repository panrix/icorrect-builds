const DEFAULT_CODE_REGEX = /\b(\d{6})\b/;

function normaliseAddress(value) {
  return String(value || '').trim().toLowerCase();
}

function emailMatchesLoginCode(message, options = {}) {
  const recipient = normaliseAddress(options.recipient || 'jarvis@icorrect.co.uk');
  const fromFilter = options.fromFilter ? String(options.fromFilter).toLowerCase() : 'backmarket';
  const subjectFilter = options.subjectFilter ? String(options.subjectFilter).toLowerCase() : 'code';
  const to = normaliseAddress(message.to || message.recipient || '');
  const from = normaliseAddress(message.from || '');
  const subject = String(message.subject || '').toLowerCase();

  if (recipient && to && to !== recipient) return false;
  if (fromFilter && !from.includes(fromFilter)) return false;
  if (subjectFilter && !subject.includes(subjectFilter)) return false;
  return true;
}

function extractLoginCode(message, options = {}) {
  if (!emailMatchesLoginCode(message, options)) return null;
  const regex = options.codeRegex || DEFAULT_CODE_REGEX;
  const body = `${message.subject || ''}\n${message.text || ''}\n${message.html || ''}`;
  const match = body.match(regex);
  return match ? match[1] : null;
}

function pickFreshestLoginCode(messages, options = {}) {
  const after = options.after ? new Date(options.after).getTime() : 0;
  const candidates = messages
    .map(message => ({ message, code: extractLoginCode(message, options) }))
    .filter(candidate => candidate.code)
    .filter(candidate => {
      if (!after) return true;
      const ts = new Date(candidate.message.date || candidate.message.receivedAt || 0).getTime();
      return ts >= after;
    })
    .sort((a, b) => new Date(b.message.date || b.message.receivedAt || 0) - new Date(a.message.date || a.message.receivedAt || 0));

  if (!candidates.length) return null;
  const newest = candidates[0];
  return {
    code: newest.code,
    receivedAt: newest.message.date || newest.message.receivedAt || null,
    from: newest.message.from || null,
    subject: newest.message.subject || null
  };
}

module.exports = { DEFAULT_CODE_REGEX, emailMatchesLoginCode, extractLoginCode, pickFreshestLoginCode };

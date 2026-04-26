const assert = require('assert');
const { extractLoginCode, pickFreshestLoginCode } = require('../../lib/mailbox-code');

const base = {
  from: 'login@backmarket.com',
  to: 'jarvis@icorrect.co.uk',
  subject: 'Your Back Market login code',
  text: 'Use code 123456 to sign in.',
  date: '2026-04-25T18:00:00Z'
};

assert.equal(extractLoginCode(base), '123456');
assert.equal(extractLoginCode({ ...base, to: 'someone@example.com' }), null);
assert.equal(extractLoginCode({ ...base, from: 'noise@example.com' }), null);

const picked = pickFreshestLoginCode([
  { ...base, text: 'Use code 111111', date: '2026-04-25T17:00:00Z' },
  { ...base, text: 'Use code 222222', date: '2026-04-25T18:00:00Z' }
]);
assert.equal(picked.code, '222222');

assert.equal(pickFreshestLoginCode([{ ...base, date: '2026-04-25T17:00:00Z' }], { after: '2026-04-25T17:30:00Z' }), null);

console.log('mailbox-code.test passed');

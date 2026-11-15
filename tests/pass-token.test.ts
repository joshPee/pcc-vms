import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePassToken, isValidPassToken } from '../src/lib/pass-token';

test('Phase 1 - Task 4: Unguessable QR Pass Tokens', async (t) => {
  await t.test('generatePassToken produces 128-bit (32 character) hex strings', () => {
    const token = generatePassToken();
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 32);
    assert.match(token, /^[0-9a-f]{32}$/);
  });

  await t.test('generated pass tokens are non-sequential and unique across large batches', () => {
    const tokens = new Set<string>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const token = generatePassToken();
      assert.ok(!tokens.has(token), `Collision detected on token: ${token}`);
      tokens.add(token);
    }
    assert.equal(tokens.size, count);
  });

  await t.test('isValidPassToken validates valid 128-bit hex tokens correctly', () => {
    assert.equal(isValidPassToken('4f8a12bc93de76fa50123456789abcde'), true);
    assert.equal(isValidPassToken('4F8A12BC93DE76FA50123456789ABCDE'), true);
    assert.equal(isValidPassToken(generatePassToken()), true);
  });

  await t.test('isValidPassToken rejects human pass numbers and forged strings', () => {
    // Human-readable pass numbers should not pass as cryptographic QR tokens
    assert.equal(isValidPassToken('PCC-V8K294'), false);
    assert.equal(isValidPassToken('PCC-VABCDEF'), false);
    assert.equal(isValidPassToken('12345'), false);
    assert.equal(isValidPassToken(''), false);
    assert.equal(isValidPassToken(null), false);
    assert.equal(isValidPassToken(undefined), false);
    assert.equal(isValidPassToken('xyz4f8a12bc93de76fa50123456789abcde'), false); // too long
  });

  await t.test('pass token is independent of pass number format', () => {
    const passNumber = 'PCC-V8K294';
    const passToken = generatePassToken();
    assert.notEqual(passNumber, passToken);
    assert.equal(passNumber.startsWith('PCC-V'), true);
    assert.equal(passToken.startsWith('PCC-V'), false);
  });
});


import { describe, expect, it } from 'vitest';
import { encryptTotpSecret, decryptTotpSecret, verifyTotp } from '../src/utils/totp.js';
import { validateFormData } from '../src/utils/validateForm.js';

describe('security and form utilities', () => {
  it('accepts a known RFC 6238 six digit code and rejects a wrong one', () => {
    expect(verifyTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '287082', 59_000)).toBe(true);
    expect(verifyTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', '000000', 59_000)).toBe(false);
  });

  it('encrypts TOTP secrets at rest and decrypts them for verification', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(decryptTotpSecret(encryptTotpSecret(secret))).toBe(secret);
  });

  it('normalizes optional blanks and Aadhaar whitespace before validation', () => {
    const schema = JSON.stringify({ fields: [
      { name: 'aadhaar', type: 'aadhaar', required: true },
      { name: 'middleName', type: 'string', required: false },
    ] });
    expect(validateFormData(schema, { aadhaar: '1234 5678 9012', middleName: '' }))
      .toEqual({ aadhaar: '123456789012' });
  });

  it('rejects fields that do not belong to a service schema', () => {
    const schema = JSON.stringify({ fields: [{ name: 'name', type: 'string', required: true }] });
    expect(() => validateFormData(schema, { name: 'Rahul', unexpected: 'value' }))
      .toThrow('Form data validation failed');
  });
});

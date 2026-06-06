/**
 * Tests for the otpSchema exported from @/lib/validators/auth.
 * RTL is not available on this branch (comes with B2), so we test the Zod schema directly.
 */
import { otpSchema } from '@/lib/validators/auth';

describe('otpSchema — OTP code validation', () => {
  it('should reject a 5-digit code (too short)', () => {
    const result = otpSchema.safeParse({ code: '12345' });
    expect(result.success).toBe(false);
  });

  it('should reject a 7-digit code (too long)', () => {
    const result = otpSchema.safeParse({ code: '1234567' });
    expect(result.success).toBe(false);
  });

  it('should accept a 6-digit numeric code', () => {
    const result = otpSchema.safeParse({ code: '123456' });
    expect(result.success).toBe(true);
  });

  it('should reject a 6-character code containing letters', () => {
    const result = otpSchema.safeParse({ code: '12345a' });
    expect(result.success).toBe(false);
  });

  it('should reject an empty string', () => {
    const result = otpSchema.safeParse({ code: '' });
    expect(result.success).toBe(false);
  });
});

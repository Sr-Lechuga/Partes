/**
 * Tests for the phoneSchema exported from @/lib/validators/auth.
 * RTL is not available on this branch (comes with B2), so we test the Zod schema directly.
 */
import { phoneSchema } from '@/lib/validators/auth';

describe('phoneSchema — E.164 validation', () => {
  it('should reject "+598" alone (too short — only country code, no subscriber number)', () => {
    const result = phoneSchema.safeParse({ phone: '+598' });
    expect(result.success).toBe(false);
  });

  it('should reject a number that is too short after country code', () => {
    const result = phoneSchema.safeParse({ phone: '+59891' });
    expect(result.success).toBe(false);
  });

  it('should accept "+59899123456" (valid Uruguayan number, 11 digits total)', () => {
    const result = phoneSchema.safeParse({ phone: '+59899123456' });
    expect(result.success).toBe(true);
  });

  it('should accept a generic valid E.164 number', () => {
    const result = phoneSchema.safeParse({ phone: '+12125551234' });
    expect(result.success).toBe(true);
  });

  it('should reject a number without leading "+"', () => {
    const result = phoneSchema.safeParse({ phone: '59899123456' });
    expect(result.success).toBe(false);
  });

  it('should reject an empty string', () => {
    const result = phoneSchema.safeParse({ phone: '' });
    expect(result.success).toBe(false);
  });
});

import { createCompanySchema, updateCompanySchema } from '@/lib/validators/company';

describe('createCompanySchema', () => {
  it('should validate a correct input with only required fields', () => {
    const result = createCompanySchema.parse({ name: 'Mi Empresa' });
    expect(result.name).toBe('Mi Empresa');
    expect(result.defaultThreshold).toBe(8);
    expect(result.currency).toBe('UYU');
  });

  it('should validate with all optional fields provided', () => {
    const result = createCompanySchema.parse({
      name: 'Mi Empresa',
      defaultThreshold: 10,
      currency: 'USD',
    });
    expect(result.name).toBe('Mi Empresa');
    expect(result.defaultThreshold).toBe(10);
    expect(result.currency).toBe('USD');
  });

  it('should reject an empty name', () => {
    expect(() => createCompanySchema.parse({ name: '' })).toThrow();
  });

  it('should reject a missing name', () => {
    expect(() => createCompanySchema.parse({})).toThrow();
  });

  it('should reject a name that exceeds 100 characters', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'A'.repeat(101) })
    ).toThrow();
  });

  it('should reject a threshold below 1', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Test', defaultThreshold: 0 })
    ).toThrow();
  });

  it('should reject a threshold above 24', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Test', defaultThreshold: 25 })
    ).toThrow();
  });

  it('should reject a non-integer threshold', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Test', defaultThreshold: 8.5 })
    ).toThrow();
  });

  it('should reject a currency that is not exactly 3 characters', () => {
    expect(() =>
      createCompanySchema.parse({ name: 'Test', currency: 'US' })
    ).toThrow();

    expect(() =>
      createCompanySchema.parse({ name: 'Test', currency: 'USDD' })
    ).toThrow();
  });
});

describe('updateCompanySchema', () => {
  it('should allow partial updates (name only)', () => {
    const result = updateCompanySchema.parse({ name: 'Updated Name' });
    expect(result.name).toBe('Updated Name');
  });

  it('should allow updating status to ACTIVE', () => {
    const result = updateCompanySchema.parse({ status: 'ACTIVE' });
    expect(result.status).toBe('ACTIVE');
  });

  it('should allow updating status to INACTIVE', () => {
    const result = updateCompanySchema.parse({ status: 'INACTIVE' });
    expect(result.status).toBe('INACTIVE');
  });

  it('should reject an invalid status value', () => {
    expect(() =>
      updateCompanySchema.parse({ status: 'DELETED' })
    ).toThrow();
  });

  it('should allow an empty object (no fields to update)', () => {
    const result = updateCompanySchema.parse({});
    expect(result).toEqual({});
  });
});

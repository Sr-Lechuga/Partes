import {
  createMembershipSchema,
  updateMembershipSchema,
  listMembersQuerySchema,
} from '@/lib/validators/membership';

// ─── createMembershipSchema ───────────────────────────────────────────────────

describe('createMembershipSchema', () => {
  const validInput = {
    firebaseUid: 'firebase-uid-abc123',
    email: 'hr@empresa.com',
    name: 'Carlos García',
    role: 'HR' as const,
  };

  it('should accept a valid HR membership input', () => {
    const result = createMembershipSchema.parse(validInput);
    expect(result.firebaseUid).toBe('firebase-uid-abc123');
    expect(result.email).toBe('hr@empresa.com');
    expect(result.name).toBe('Carlos García');
    expect(result.role).toBe('HR');
  });

  it('should default role to HR when not provided', () => {
    const result = createMembershipSchema.parse({
      firebaseUid: 'uid-001',
      email: 'user@empresa.com',
      name: 'Usuario Test',
    });
    expect(result.role).toBe('HR');
  });

  it('should accept ADMIN role', () => {
    const result = createMembershipSchema.parse({ ...validInput, role: 'ADMIN' });
    expect(result.role).toBe('ADMIN');
  });

  it('should accept EMPLOYEE role', () => {
    const result = createMembershipSchema.parse({ ...validInput, role: 'EMPLOYEE' });
    expect(result.role).toBe('EMPLOYEE');
  });

  it('should reject an invalid role', () => {
    expect(() =>
      createMembershipSchema.parse({ ...validInput, role: 'SUPERUSER' })
    ).toThrow();
  });

  it('should reject an empty firebaseUid', () => {
    expect(() =>
      createMembershipSchema.parse({ ...validInput, firebaseUid: '' })
    ).toThrow();
  });

  it('should reject an invalid email', () => {
    expect(() =>
      createMembershipSchema.parse({ ...validInput, email: 'not-an-email' })
    ).toThrow();
  });

  it('should reject an empty name', () => {
    expect(() =>
      createMembershipSchema.parse({ ...validInput, name: '' })
    ).toThrow();
  });

  it('should reject a name longer than 100 characters', () => {
    expect(() =>
      createMembershipSchema.parse({ ...validInput, name: 'A'.repeat(101) })
    ).toThrow();
  });

  it('should reject missing required fields', () => {
    expect(() => createMembershipSchema.parse({})).toThrow();
  });
});

// ─── updateMembershipSchema ───────────────────────────────────────────────────

describe('updateMembershipSchema', () => {
  it('should accept a role-only update', () => {
    const result = updateMembershipSchema.parse({ role: 'ADMIN' });
    expect(result.role).toBe('ADMIN');
  });

  it('should accept a status-only update', () => {
    const result = updateMembershipSchema.parse({ status: 'INACTIVE' });
    expect(result.status).toBe('INACTIVE');
  });

  it('should accept a name-only update', () => {
    const result = updateMembershipSchema.parse({ name: 'Nuevo Nombre' });
    expect(result.name).toBe('Nuevo Nombre');
  });

  it('should accept updating role and status together', () => {
    const result = updateMembershipSchema.parse({ role: 'HR', status: 'ACTIVE' });
    expect(result.role).toBe('HR');
    expect(result.status).toBe('ACTIVE');
  });

  it('should reject an empty object (at least one field required)', () => {
    expect(() => updateMembershipSchema.parse({})).toThrow();
  });

  it('should reject an invalid role', () => {
    expect(() => updateMembershipSchema.parse({ role: 'GOD' })).toThrow();
  });

  it('should reject an invalid status', () => {
    expect(() => updateMembershipSchema.parse({ status: 'SUSPENDED' })).toThrow();
  });

  it('should reject an empty name', () => {
    expect(() => updateMembershipSchema.parse({ name: '' })).toThrow();
  });
});

// ─── listMembersQuerySchema ───────────────────────────────────────────────────

describe('listMembersQuerySchema', () => {
  it('should parse with all defaults when no params are provided', () => {
    const result = listMembersQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.status).toBeUndefined();
    expect(result.role).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it('should coerce page and pageSize from strings (URL param style)', () => {
    const result = listMembersQuerySchema.parse({ page: '2', pageSize: '10' });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
  });

  it('should accept optional status filter', () => {
    const result = listMembersQuerySchema.parse({ status: 'INACTIVE' });
    expect(result.status).toBe('INACTIVE');
  });

  it('should accept optional role filter', () => {
    const result = listMembersQuerySchema.parse({ role: 'HR' });
    expect(result.role).toBe('HR');
  });

  it('should accept optional search string', () => {
    const result = listMembersQuerySchema.parse({ search: 'carlos' });
    expect(result.search).toBe('carlos');
  });

  it('should reject invalid status value', () => {
    expect(() => listMembersQuerySchema.parse({ status: 'BANNED' })).toThrow();
  });

  it('should reject invalid role value', () => {
    expect(() => listMembersQuerySchema.parse({ role: 'ROOT' })).toThrow();
  });

  it('should reject page less than 1', () => {
    expect(() => listMembersQuerySchema.parse({ page: '0' })).toThrow();
  });

  it('should reject pageSize greater than 100', () => {
    expect(() => listMembersQuerySchema.parse({ pageSize: '101' })).toThrow();
  });

  it('should reject pageSize less than 1', () => {
    expect(() => listMembersQuerySchema.parse({ pageSize: '0' })).toThrow();
  });
});

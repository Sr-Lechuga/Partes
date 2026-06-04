import {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesQuerySchema,
} from '@/lib/validators/employee';

describe('createEmployeeSchema', () => {
  const validInput = {
    name: 'Juan Pérez',
    documentNumber: '12345678',
    hourlyRate: 250,
  };

  it('should validate with only required fields', () => {
    const result = createEmployeeSchema.parse(validInput);
    expect(result.name).toBe('Juan Pérez');
    expect(result.documentNumber).toBe('12345678');
    expect(result.hourlyRate).toBe(250);
    expect(result.phone).toBeUndefined();
    expect(result.overtimeThreshold).toBeUndefined();
  });

  it('should validate with all optional fields provided', () => {
    const result = createEmployeeSchema.parse({
      ...validInput,
      phone: '+59899123456',
      overtimeThreshold: 6,
    });
    expect(result.phone).toBe('+59899123456');
    expect(result.overtimeThreshold).toBe(6);
  });

  it('should reject an empty name', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...validInput, name: '' })
    ).toThrow();
  });

  it('should reject a missing document number', () => {
    const { documentNumber, ...rest } = validInput;
    expect(() => createEmployeeSchema.parse(rest)).toThrow();
  });

  it('should reject a negative hourly rate', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...validInput, hourlyRate: -10 })
    ).toThrow();
  });

  it('should reject a zero hourly rate', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...validInput, hourlyRate: 0 })
    ).toThrow();
  });

  it('should reject a threshold below 1', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...validInput, overtimeThreshold: 0 })
    ).toThrow();
  });

  it('should reject a threshold above 24', () => {
    expect(() =>
      createEmployeeSchema.parse({ ...validInput, overtimeThreshold: 25 })
    ).toThrow();
  });

  it('should accept null for phone', () => {
    const result = createEmployeeSchema.parse({ ...validInput, phone: null });
    expect(result.phone).toBeNull();
  });

  it('should accept null for overtimeThreshold', () => {
    const result = createEmployeeSchema.parse({
      ...validInput,
      overtimeThreshold: null,
    });
    expect(result.overtimeThreshold).toBeNull();
  });
});

describe('updateEmployeeSchema', () => {
  it('should allow partial updates (name only)', () => {
    const result = updateEmployeeSchema.parse({ name: 'Nuevo Nombre' });
    expect(result.name).toBe('Nuevo Nombre');
  });

  it('should allow updating hourly rate', () => {
    const result = updateEmployeeSchema.parse({ hourlyRate: 300 });
    expect(result.hourlyRate).toBe(300);
  });

  it('should allow providing a reason for the change', () => {
    const result = updateEmployeeSchema.parse({
      name: 'Updated',
      reason: 'Corrección de nombre',
    });
    expect(result.reason).toBe('Corrección de nombre');
  });

  it('should allow an empty object (no fields to update)', () => {
    const result = updateEmployeeSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject a negative hourly rate', () => {
    expect(() =>
      updateEmployeeSchema.parse({ hourlyRate: -5 })
    ).toThrow();
  });

  it('should reject a reason exceeding 500 characters', () => {
    expect(() =>
      updateEmployeeSchema.parse({ reason: 'A'.repeat(501) })
    ).toThrow();
  });
});

describe('listEmployeesQuerySchema', () => {
  it('should apply default values when no params provided', () => {
    const result = listEmployeesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.status).toBeUndefined();
    expect(result.search).toBeUndefined();
  });

  it('should parse string numbers into integers (coerce)', () => {
    const result = listEmployeesQuerySchema.parse({
      page: '3',
      pageSize: '50',
    });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it('should accept ACTIVE status filter', () => {
    const result = listEmployeesQuerySchema.parse({ status: 'ACTIVE' });
    expect(result.status).toBe('ACTIVE');
  });

  it('should accept INACTIVE status filter', () => {
    const result = listEmployeesQuerySchema.parse({ status: 'INACTIVE' });
    expect(result.status).toBe('INACTIVE');
  });

  it('should reject an invalid status value', () => {
    expect(() =>
      listEmployeesQuerySchema.parse({ status: 'DELETED' })
    ).toThrow();
  });

  it('should reject page below 1', () => {
    expect(() =>
      listEmployeesQuerySchema.parse({ page: 0 })
    ).toThrow();
  });

  it('should reject pageSize above 100', () => {
    expect(() =>
      listEmployeesQuerySchema.parse({ pageSize: 101 })
    ).toThrow();
  });

  it('should accept a search string', () => {
    const result = listEmployeesQuerySchema.parse({ search: 'Juan' });
    expect(result.search).toBe('Juan');
  });
});

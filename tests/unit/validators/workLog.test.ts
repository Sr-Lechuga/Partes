import { 
  startSessionSchema, 
  stopSessionSchema, 
  createManualWorkLogSchema, 
  updateWorkLogSchema 
} from '@/lib/validators/workLog';

describe('WorkLog Validators', () => {
  describe('startSessionSchema', () => {
    it('should validate valid employeeId', () => {
      const result = startSessionSchema.safeParse({ employeeId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });

    it('should fail on invalid uuid', () => {
      const result = startSessionSchema.safeParse({ employeeId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('createManualWorkLogSchema', () => {
    const validData = {
      employeeId: '550e8400-e29b-41d4-a716-446655440000',
      date: '2026-05-11T12:00:00Z',
      startTime: '2026-05-11T08:00:00Z',
      endTime: '2026-05-11T17:00:00Z',
      reason: 'Carga manual obligatoria'
    };

    it('should validate valid manual entry', () => {
      const result = createManualWorkLogSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if endTime is before startTime', () => {
      const invalid = { ...validData, endTime: '2026-05-11T07:00:00Z' };
      const result = createManualWorkLogSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail if reason is too short', () => {
      const invalid = { ...validData, reason: 'err' };
      const result = createManualWorkLogSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('updateWorkLogSchema', () => {
    it('should allow partial updates', () => {
      const result = updateWorkLogSchema.safeParse({ status: 'APPROVED' });
      expect(result.success).toBe(true);
    });

    it('should require valid status enum', () => {
      const result = updateWorkLogSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});

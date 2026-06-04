import { calculateHours } from '@/lib/hours';

describe('calculateHours utility', () => {
  it('should return 0 when start and end are the same', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T08:00:00Z');
    const result = calculateHours(start, end, 8);
    
    expect(result).toEqual({ total: 0, normal: 0, extra: 0 });
  });

  it('should return only normal hours when within threshold', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T12:00:00Z'); // 4 hours
    const result = calculateHours(start, end, 8);
    
    expect(result).toEqual({ total: 4, normal: 4, extra: 0 });
  });

  it('should split normal and extra hours when exceeding threshold', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T18:00:00Z'); // 10 hours
    const result = calculateHours(start, end, 8);
    
    expect(result).toEqual({ total: 10, normal: 8, extra: 2 });
  });

  it('should handle decimal hours correctly', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T17:45:00Z'); // 9.75 hours
    const result = calculateHours(start, end, 8);
    
    expect(result).toEqual({ total: 9.75, normal: 8, extra: 1.75 });
  });

  it('should handle zero threshold (all hours as extra)', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T10:00:00Z');
    const result = calculateHours(start, end, 0);
    
    expect(result).toEqual({ total: 2, normal: 0, extra: 2 });
  });
});

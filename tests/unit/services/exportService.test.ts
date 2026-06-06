import { ExportService } from '@/services/exportService';
import { AnalyticsService } from '@/services/analyticsService';

// Mock AnalyticsService to avoid real DB calls
jest.mock('@/services/analyticsService', () => ({
  AnalyticsService: {
    getCompanySummary: jest.fn(),
    getEmployeeRankings: jest.fn(),
  },
}));

// Mock ExcelJS workbook to avoid real xlsx generation in unit tests
jest.mock('exceljs', () => {
  const mockWriteBuffer = jest.fn().mockResolvedValue(Buffer.from('mock-excel-content'));
  const mockAddRow = jest.fn();
  const mockAddWorksheet = jest.fn().mockReturnValue({ addRow: mockAddRow });
  const MockWorkbook = jest.fn().mockImplementation(() => ({
    addWorksheet: mockAddWorksheet,
    xlsx: { writeBuffer: mockWriteBuffer },
  }));
  // ExcelJS is a CommonJS module — default export is the module object itself
  // `import ExcelJS from 'exceljs'` → ExcelJS.Workbook must be a constructor
  return {
    __esModule: true,
    default: { Workbook: MockWorkbook },
  };
});

// Ensure prisma is NOT imported by the module under test
jest.mock('@/lib/prisma', () => ({
  prisma: {
    exportTask: {
      create: jest.fn(() => { throw new Error('prisma.exportTask must NOT be called'); }),
      findUnique: jest.fn(() => { throw new Error('prisma.exportTask must NOT be called'); }),
      update: jest.fn(() => { throw new Error('prisma.exportTask must NOT be called'); }),
    },
  },
}));

// Ensure fs is NOT used
jest.mock('fs', () => ({
  existsSync: jest.fn(() => { throw new Error('fs.existsSync must NOT be called'); }),
  mkdirSync: jest.fn(() => { throw new Error('fs.mkdirSync must NOT be called'); }),
  writeFileSync: jest.fn(() => { throw new Error('fs must NOT be called'); }),
}));

describe('ExportService.generateExcelBuffer', () => {
  const companyId = 'comp-1';
  const filters = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31'),
  };

  const mockSummary = {
    totalHours: 120,
    totalNormalHours: 96,
    totalExtraHours: 24,
    totalCost: 15000,
    employeeCount: 5,
    workLogCount: 30,
  };

  const mockRankings = [
    { employeeId: 'emp-1', name: 'John Doe', documentNumber: '12345', totalHours: 60, totalCost: 7500 },
    { employeeId: 'emp-2', name: 'Jane Smith', documentNumber: '67890', totalHours: 60, totalCost: 7500 },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a non-empty Buffer', async () => {
    (AnalyticsService.getCompanySummary as jest.Mock).mockResolvedValue(mockSummary);
    (AnalyticsService.getEmployeeRankings as jest.Mock).mockResolvedValue(mockRankings);

    const result = await ExportService.generateExcelBuffer(companyId, filters);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should call AnalyticsService.getCompanySummary with correct args', async () => {
    (AnalyticsService.getCompanySummary as jest.Mock).mockResolvedValue(mockSummary);
    (AnalyticsService.getEmployeeRankings as jest.Mock).mockResolvedValue(mockRankings);

    await ExportService.generateExcelBuffer(companyId, filters);

    expect(AnalyticsService.getCompanySummary).toHaveBeenCalledWith(
      companyId,
      filters.from,
      filters.to
    );
  });

  it('should call AnalyticsService.getEmployeeRankings with correct args', async () => {
    (AnalyticsService.getCompanySummary as jest.Mock).mockResolvedValue(mockSummary);
    (AnalyticsService.getEmployeeRankings as jest.Mock).mockResolvedValue(mockRankings);

    await ExportService.generateExcelBuffer(companyId, filters);

    expect(AnalyticsService.getEmployeeRankings).toHaveBeenCalledWith(
      companyId,
      filters.from,
      filters.to,
      100
    );
  });

  it('should work with optional employeeId filter (triangulation)', async () => {
    const filtersWithEmployee = { ...filters, employeeId: 'emp-1' };
    (AnalyticsService.getCompanySummary as jest.Mock).mockResolvedValue(mockSummary);
    (AnalyticsService.getEmployeeRankings as jest.Mock).mockResolvedValue([mockRankings[0]]);

    const result = await ExportService.generateExcelBuffer(companyId, filtersWithEmployee);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // AnalyticsService is still called (employeeId is a filter hint, not blocking)
    expect(AnalyticsService.getCompanySummary).toHaveBeenCalledTimes(1);
  });

  it('should NOT call prisma.exportTask (no DB task persistence)', async () => {
    (AnalyticsService.getCompanySummary as jest.Mock).mockResolvedValue(mockSummary);
    (AnalyticsService.getEmployeeRankings as jest.Mock).mockResolvedValue(mockRankings);

    // This will throw if prisma.exportTask is called (see mock above)
    await expect(ExportService.generateExcelBuffer(companyId, filters)).resolves.toBeDefined();
  });
});

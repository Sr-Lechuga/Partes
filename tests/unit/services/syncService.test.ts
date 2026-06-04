import { SyncService, SyncOperation } from '@/services/syncService';
import { WorkLogService } from '@/services/workLogService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    workLog: {
      findUnique: jest.fn(),
    },
    workSession: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/services/workLogService', () => ({
  WorkLogService: {
    startSession: jest.fn(),
    stopSession: jest.fn(),
    createManualWorkLog: jest.fn(),
  },
}));

describe('SyncService', () => {
  const companyId = 'comp-1';
  const userId = 'user-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process a batch successfully', async () => {
    const operations: SyncOperation[] = [
      {
        id: 'sync-1',
        type: 'START_SESSION',
        payload: { employeeId: 'emp-1' },
        timestamp: new Date().toISOString(),
      },
    ];

    (prisma.workLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.workSession.findUnique as jest.Mock).mockResolvedValue(null);
    (WorkLogService.startSession as jest.Mock).mockResolvedValue({ id: 'sess-1' });

    const results = await SyncService.processBatch(companyId, userId, operations);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('SUCCESS');
    expect(WorkLogService.startSession).toHaveBeenCalled();
  });

  it('should detect duplicates by syncId', async () => {
    const operations: SyncOperation[] = [
      {
        id: 'sync-dup',
        type: 'START_SESSION',
        payload: { employeeId: 'emp-1' },
        timestamp: new Date().toISOString(),
      },
    ];

    (prisma.workLog.findUnique as jest.Mock).mockResolvedValue({ id: 'log-existing' });

    const results = await SyncService.processBatch(companyId, userId, operations);

    expect(results[0].status).toBe('DUPLICATE');
    expect(WorkLogService.startSession).not.toHaveBeenCalled();
  });

  it('should handle errors per operation without stopping the batch', async () => {
    const operations: SyncOperation[] = [
      {
        id: 'sync-fail',
        type: 'START_SESSION',
        payload: { employeeId: 'emp-1' },
        timestamp: new Date().toISOString(),
      },
      {
        id: 'sync-ok',
        type: 'START_SESSION',
        payload: { employeeId: 'emp-1' },
        timestamp: new Date().toISOString(),
      },
    ];

    (prisma.workLog.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.workSession.findUnique as jest.Mock).mockResolvedValue(null);
    (WorkLogService.startSession as jest.Mock)
      .mockRejectedValueOnce(new Error('Session error'))
      .mockResolvedValueOnce({ id: 'sess-ok' });

    const results = await SyncService.processBatch(companyId, userId, operations);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('ERROR');
    expect(results[0].error).toBe('Session error');
    expect(results[1].status).toBe('SUCCESS');
  });
});

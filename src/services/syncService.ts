import { prisma } from '@/lib/prisma';
import { WorkLogService } from './workLogService';

export interface SyncOperation {
  id: string; // clientGeneratedId (syncId)
  type: 'START_SESSION' | 'STOP_SESSION' | 'MANUAL_LOG';
  payload: any;
  timestamp: string;
}

export interface SyncResult {
  id: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'ERROR';
  error?: string;
  data?: any;
}

export class SyncService {
  /**
   * RF-OFF-002: Process a batch of offline operations
   */
  static async processBatch(
    companyId: string,
    performedBy: string,
    operations: SyncOperation[],
    isHR: boolean = false
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const op of operations) {
      try {
        // RF-OFF-003: Check for idempotency
        const existingLog = await prisma.workLog.findUnique({ where: { syncId: op.id } });
        const existingSession = await prisma.workSession.findUnique({ where: { syncId: op.id } });

        if (existingLog || existingSession) {
          results.push({ id: op.id, status: 'DUPLICATE', data: existingLog || existingSession });
          continue;
        }

        let data;
        switch (op.type) {
          case 'START_SESSION':
            data = await WorkLogService.startSession(
              companyId,
              op.payload.employeeId,
              performedBy,
              'mobile',
              op.id
            );
            break;

          case 'STOP_SESSION':
            data = await WorkLogService.stopSession(
              companyId,
              op.payload.sessionId,
              performedBy,
              new Date(op.payload.endedAt),
              op.id
            );
            break;

          case 'MANUAL_LOG':
            data = await WorkLogService.createManualWorkLog(
              companyId,
              {
                employeeId: op.payload.employeeId,
                date: new Date(op.payload.date),
                startTime: new Date(op.payload.startTime),
                endTime: new Date(op.payload.endTime),
                reason: op.payload.reason,
              },
              performedBy,
              isHR,
              op.id
            );
            break;

          default:
            throw new Error(`Tipo de operación no soportado: ${op.type}`);
        }

        results.push({ id: op.id, status: 'SUCCESS', data });
      } catch (error) {
        // RF-OFF-004: Handle conflicts and errors per item
        results.push({
          id: op.id,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return results;
  }
}

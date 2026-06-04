import { prisma } from '@/lib/prisma';
import { calculateHours } from '@/lib/hours';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from './auditService';

export class WorkSessionActiveError extends Error {
  readonly code = 'SESSION_ALREADY_ACTIVE';
  constructor() {
    super('El empleado ya tiene una jornada activa.');
    this.name = 'WorkSessionActiveError';
  }
}

export class WorkLogNotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  constructor() {
    super('El registro de jornada no existe.');
    this.name = 'WorkLogNotFoundError';
  }
}

export class OutsideManualEntryWindowError extends Error {
  readonly code = 'OUTSIDE_ENTRY_WINDOW';
  constructor() {
    super('No se pueden registrar jornadas con más de 48 horas de atraso.');
    this.name = 'OutsideManualEntryWindowError';
  }
}

export class WorkLogService {
  /**
   * RF-JOR-001: Start a work session (timer)
   */
  static async startSession(
    companyId: string,
    employeeId: string,
    performedBy: string,
    source: string = 'mobile',
    syncId?: string
  ) {
    // Check for existing session
    const activeSession = await prisma.workSession.findFirst({
      where: { employeeId, companyId },
    });

    if (activeSession) {
      throw new WorkSessionActiveError();
    }

    const session = await prisma.workSession.create({
      data: {
        companyId,
        employeeId,
        startedAt: new Date(),
        source,
        syncId,
      },
    });

    await AuditService.recordEvent({
      companyId,
      entityType: 'WORK_LOG',
      entityId: session.id,
      action: 'CREATE',
      performedBy,
      metadata: { action: 'START_SESSION', source },
    });

    return session;
  }

  /**
   * RF-JOR-002: Stop a work session and create a WorkLog
   */
  static async stopSession(
    companyId: string,
    sessionId: string,
    performedBy: string,
    endedAt: Date = new Date(),
    syncId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.workSession.findUnique({
        where: { id: sessionId, companyId },
        include: { employee: true },
      });

      if (!session) {
        throw new Error('Sesión no encontrada.');
      }

      // Get threshold (employee override or company default)
      const company = await tx.company.findUnique({ where: { id: companyId } });
      const threshold = session.employee.overtimeThreshold ?? company?.defaultThreshold ?? 8;

      // Get effective rate at the time of work (RF-ANA-005)
      const hourlyRate = await tx.employeeRateHistory.findFirst({
        where: {
          employeeId: session.employeeId,
          effectiveFrom: { lte: session.startedAt },
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      const rate = hourlyRate?.hourlyRate || new Decimal(0);
      const breakdown = calculateHours(session.startedAt, endedAt, threshold);

      // Cost calculation: (normal * rate) + (extra * rate * 2)
      const totalCost = new Decimal(breakdown.normal).mul(rate)
        .add(new Decimal(breakdown.extra).mul(rate).mul(2));

      const workLog = await tx.workLog.create({
        data: {
          companyId,
          employeeId: session.employeeId,
          date: session.startedAt,
          startTime: session.startedAt,
          endTime: endedAt,
          totalHours: new Decimal(breakdown.total),
          normalHours: new Decimal(breakdown.normal),
          extraHours: new Decimal(breakdown.extra),
          hourlyRate: rate,
          totalCost: totalCost,
          source: 'timer',
          status: 'PENDING',
          syncId,
        },
      });

      // Remove session
      await tx.workSession.delete({ where: { id: sessionId } });

      await AuditService.recordEvent({
        companyId,
        entityType: 'WORK_LOG',
        entityId: workLog.id,
        action: 'UPDATE',
        performedBy,
        metadata: { action: 'STOP_SESSION', breakdown },
      });

      return workLog;
    });
  }

  /**
   * RF-JOR-003: Create a manual work log (with 48h window check)
   */
  static async createManualWorkLog(
    companyId: string,
    data: {
      employeeId: string;
      date: Date;
      startTime: Date;
      endTime: Date;
      reason: string;
    },
    performedBy: string,
    isHR: boolean = false,
    syncId?: string
  ) {
    // RF-JOR-003: 48h window check for non-HR
    if (!isHR) {
      const now = new Date();
      const diffHours = (now.getTime() - data.date.getTime()) / (1000 * 60 * 60);
      if (diffHours > 48) {
        throw new OutsideManualEntryWindowError();
      }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId, companyId },
      include: { company: true },
    });

    if (!employee) {
      throw new Error('Empleado no encontrado.');
    }

    const threshold = employee.overtimeThreshold ?? employee.company.defaultThreshold;
    
    // Get effective rate at the time of work (RF-ANA-005)
    const hourlyRateEntry = await prisma.employeeRateHistory.findFirst({
      where: {
        employeeId: data.employeeId,
        effectiveFrom: { lte: data.date },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    const rate = hourlyRateEntry?.hourlyRate || new Decimal(0);
    const breakdown = calculateHours(data.startTime, data.endTime, threshold);

    // Cost calculation
    const totalCost = new Decimal(breakdown.normal).mul(rate)
      .add(new Decimal(breakdown.extra).mul(rate).mul(2));

    const workLog = await prisma.workLog.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        totalHours: new Decimal(breakdown.total),
        normalHours: new Decimal(breakdown.normal),
        extraHours: new Decimal(breakdown.extra),
        hourlyRate: rate,
        totalCost: totalCost,
        source: 'manual',
        status: 'PENDING',
        syncId,
      },
    });

    await AuditService.recordEvent({
      companyId,
      entityType: 'WORK_LOG',
      entityId: workLog.id,
      action: 'CREATE',
      performedBy,
      metadata: { action: 'MANUAL_ENTRY', reason: data.reason },
    });

    return workLog;
  }

  /**
   * RF-JOR-006: List work logs with filters
   */
  static async listWorkLogs(
    companyId: string,
    filters: {
      employeeId?: string;
      from?: Date;
      to?: Date;
      status?: string;
      page: number;
      pageSize: number;
    }
  ) {
    const where: any = { companyId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = filters.from;
      if (filters.to) where.date.lte = filters.to;
    }

    const [data, totalItems] = await Promise.all([
      prisma.workLog.findMany({
        where,
        include: { employee: true },
        orderBy: { date: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.workLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / filters.pageSize),
      },
    };
  }

  /**
   * RF-JOR-008: Update work log with audit trail
   */
  static async updateWorkLog(
    companyId: string,
    workLogId: string,
    data: {
      startTime?: Date;
      endTime?: Date;
      status?: string;
      rejectionReason?: string;
      reason?: string; // Audit reason
      changedBy: string; // firebaseUid
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.workLog.findUnique({
        where: { id: workLogId, companyId },
        include: { employee: { include: { company: true } } },
      });

      if (!existing) {
        throw new WorkLogNotFoundError();
      }

      const updateData: any = {};
      const historyEntries: any[] = [];

      if (data.status) {
        updateData.status = data.status;
        if (data.status === 'REJECTED') {
          updateData.rejectionReason = data.rejectionReason;
        }
      }

      if (data.startTime || data.endTime) {
        const newStartTime = data.startTime || existing.startTime;
        const newEndTime = data.endTime || existing.endTime;

        const threshold = existing.employee.overtimeThreshold ?? existing.employee.company.defaultThreshold;
        const breakdown = calculateHours(newStartTime, newEndTime, threshold);

        // Recalculate cost if hours changed, using the original rate of that log
        const rate = existing.hourlyRate || new Decimal(0);
        const totalCost = new Decimal(breakdown.normal).mul(rate)
          .add(new Decimal(breakdown.extra).mul(rate).mul(2));

        updateData.startTime = newStartTime;
        updateData.endTime = newEndTime;
        updateData.totalHours = new Decimal(breakdown.total);
        updateData.normalHours = new Decimal(breakdown.normal);
        updateData.extraHours = new Decimal(breakdown.extra);
        updateData.totalCost = totalCost;
      }

      // Record history for changes
      // In a real scenario, we would loop through keys to detect changes
      // For brevity, we'll record the main change
      if (data.reason) {
        historyEntries.push({
          workLogId,
          changedBy: data.changedBy,
          fieldName: 'multiple',
          oldValue: JSON.stringify({ start: existing.startTime, end: existing.endTime, status: existing.status }),
          newValue: JSON.stringify(updateData),
          reason: data.reason,
        });
      }

      const updated = await tx.workLog.update({
        where: { id: workLogId },
        data: updateData,
      });

      if (historyEntries.length > 0) {
        await tx.workLogHistory.createMany({ data: historyEntries });
        
        await AuditService.recordEvent({
          companyId,
          entityType: 'WORK_LOG',
          entityId: workLogId,
          action: 'UPDATE',
          performedBy: data.changedBy,
          metadata: { updates: updateData, reason: data.reason },
        });
      }

      return updated;
    });
  }
}

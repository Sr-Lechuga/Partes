import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface DashboardSummary {
  totalHours: number;
  totalNormalHours: number;
  totalExtraHours: number;
  totalCost: number;
  employeeCount: number;
  workLogCount: number;
}

export interface EmployeeRanking {
  employeeId: string;
  name: string;
  documentNumber: string;
  totalHours: number;
  totalCost: number;
}

export class AnalyticsService {
  /**
   * RF-ANA-001 / RF-ANA-005: Get company-wide summary for a period
   */
  static async getCompanySummary(companyId: string, from: Date, to: Date): Promise<DashboardSummary> {
    const logs = await prisma.workLog.findMany({
      where: {
        companyId,
        date: { gte: from, lte: to },
        status: 'APPROVED', // Usually analytics are based on approved logs
      },
    });

    const totals = logs.reduce(
      (acc, log) => {
        acc.totalHours += Number(log.totalHours);
        acc.totalNormalHours += Number(log.normalHours);
        acc.totalExtraHours += Number(log.extraHours);
        acc.totalCost += Number(log.totalCost || 0);
        return acc;
      },
      { totalHours: 0, totalNormalHours: 0, totalExtraHours: 0, totalCost: 0 }
    );

    const employeeCount = await prisma.employee.count({
      where: { companyId, status: 'ACTIVE' },
    });

    return {
      ...totals,
      employeeCount,
      workLogCount: logs.length,
    };
  }

  /**
   * RF-ANA-002 / RF-ANA-003: Ranking of employees by hours or cost
   */
  static async getEmployeeRankings(
    companyId: string,
    from: Date,
    to: Date,
    limit: number = 10
  ): Promise<EmployeeRanking[]> {
    // We group by employeeId
    const logs = await prisma.workLog.findMany({
      where: {
        companyId,
        date: { gte: from, lte: to },
        status: 'APPROVED',
      },
      include: {
        employee: true,
      },
    });

    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.employeeId]) {
        acc[log.employeeId] = {
          employeeId: log.employeeId,
          name: log.employee.name,
          documentNumber: log.employee.documentNumber,
          totalHours: 0,
          totalCost: 0,
        };
      }
      acc[log.employeeId].totalHours += Number(log.totalHours);
      acc[log.employeeId].totalCost += Number(log.totalCost || 0);
      return acc;
    }, {} as Record<string, EmployeeRanking>);

    return Object.values(grouped)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, limit);
  }

  /**
   * RF-ANA-004: Grouping by day for a specific employee
   */
  static async getEmployeeDailyStats(
    companyId: string,
    employeeId: string,
    from: Date,
    to: Date
  ) {
    const logs = await prisma.workLog.findMany({
      where: {
        companyId,
        employeeId,
        date: { gte: from, lte: to },
        status: 'APPROVED',
      },
      orderBy: { date: 'asc' },
    });

    return logs.map(log => ({
      date: log.date,
      totalHours: Number(log.totalHours),
      normalHours: Number(log.normalHours),
      extraHours: Number(log.extraHours),
      cost: Number(log.totalCost || 0),
    }));
  }
}

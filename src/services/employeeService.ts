import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ListEmployeesQuery,
  AddRateInput,
} from '@/lib/validators/employee';
import { AuditService } from './auditService';

export class EmployeeService {
  /**
   * RF-EMPL-001: Create employee with initial rate history entry.
   * If overtimeThreshold is set, it overrides company default.
   */
  static async createEmployee(companyId: string, input: CreateEmployeeInput, performedBy: string) {

    const { hourlyRate, ...employeeData } = input;

    // Create employee and first rate history entry in a transaction
    const employee = await prisma.$transaction(async (tx) => {
      const newEmployee = await tx.employee.create({
        data: {
          companyId,
          ...employeeData,
        },
      });

      // Create initial rate history entry (RF-CFG-001)
      await tx.employeeRateHistory.create({
        data: {
          employeeId: newEmployee.id,
          hourlyRate: new Prisma.Decimal(hourlyRate),
          effectiveFrom: new Date(),
        },
      });

      // Record creation in change history (RF-EMPL-006)
      await tx.employeeChangeHistory.create({
        data: {
          employeeId: newEmployee.id,
          fieldName: 'CREATED',
          oldValue: null,
          newValue: JSON.stringify({ ...employeeData, hourlyRate }),
          changedBy: performedBy,
        },
      });

      await AuditService.recordEvent({
        companyId,
        entityType: 'EMPLOYEE',
        entityId: newEmployee.id,
        action: 'CREATE',
        performedBy,
        metadata: { input },
      });

      return newEmployee;
    });

    // Return with current rate included
    return this.getEmployeeById(companyId, employee.id);
  }

  /**
   * RF-EMPL-002: List employees with filters and pagination.
   * Filters: status, search (name/document), pagination.
   */
  static async listEmployees(companyId: string, query: ListEmployeesQuery) {
    const { status, search, page, pageSize } = query;

    const where: Prisma.EmployeeWhereInput = {
      companyId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { documentNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [employees, totalItems] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          rateHistory: {
            orderBy: { effectiveFrom: 'desc' },
            take: 1, // Only current rate
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    // Map employees to include currentRate at top level
    const data = employees.map((emp) => ({
      ...emp,
      currentRate: emp.rateHistory[0] || null,
      rateHistory: undefined,
    }));

    return {
      data,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  /**
   * RF-EMPL-003: Get employee detail with current rate.
   */
  static async getEmployeeById(companyId: string, employeeId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        rateHistory: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!employee) return null;

    return {
      ...employee,
      currentRate: employee.rateHistory[0] || null,
      rateHistory: undefined,
    };
  }

  /**
   * RF-EMPL-004: Edit employee data with change history tracking.
   * If hourlyRate is changed, a new rate history entry is created.
   */
  static async updateEmployee(
    companyId: string,
    employeeId: string,
    input: UpdateEmployeeInput,
    performedBy: string
  ) {
    const { hourlyRate, effectiveFrom, reason, ...updateData } = input;

    // Fetch current employee to compare changes
    const current = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        rateHistory: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (!current) return null;

    const employee = await prisma.$transaction(async (tx) => {
      // Track field-level changes in history (RF-EMPL-006)
      const changes: { fieldName: string; oldValue: string | null; newValue: string | null }[] = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          const oldVal = String((current as any)[key] ?? '');
          const newVal = String(value ?? '');
          if (oldVal !== newVal) {
            changes.push({ fieldName: key, oldValue: oldVal, newValue: newVal });
          }
        }
      }

      // If hourly rate changed, create new rate entry (RF-CFG-001)
      if (hourlyRate !== undefined) {
        const currentRate = current.rateHistory[0]?.hourlyRate;
        if (!currentRate || Number(currentRate) !== hourlyRate) {
          await tx.employeeRateHistory.create({
            data: {
              employeeId,
              hourlyRate: new Prisma.Decimal(hourlyRate),
              effectiveFrom: effectiveFrom || new Date(),
            },
          });
          changes.push({
            fieldName: 'hourlyRate',
            oldValue: currentRate ? String(currentRate) : null,
            newValue: String(hourlyRate),
          });
        }
      }

      // Record all changes in history
      if (changes.length > 0) {
        await tx.employeeChangeHistory.createMany({
          data: changes.map((change) => ({
            employeeId,
            ...change,
            changedBy: performedBy,
            reason: reason || null,
          })),
        });

        await AuditService.recordEvent({
          companyId,
          entityType: 'EMPLOYEE',
          entityId: employeeId,
          action: 'UPDATE',
          performedBy,
          metadata: { changes, reason },
        });
      }

      // Update the employee record
      if (Object.keys(updateData).length > 0) {
        await tx.employee.update({
          where: { id: employeeId },
          data: updateData,
        });
      }

      return true;
    });

    if (!employee) return null;

    // Return updated employee with current rate
    return this.getEmployeeById(companyId, employeeId);
  }

  /**
   * RF-EMPL-005: Soft delete — set status to INACTIVE.
   * Historical data persists, employee cannot create sessions.
   */
  static async deactivateEmployee(
    companyId: string,
    employeeId: string,
    performedBy: string
  ) {
    const current = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!current) return null;

    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: { status: 'INACTIVE' },
      });

      await tx.employeeChangeHistory.create({
        data: {
          employeeId,
          fieldName: 'status',
          oldValue: current.status,
          newValue: 'INACTIVE',
          changedBy: performedBy,
        },
      });

      await AuditService.recordEvent({
        companyId,
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        action: 'DEACTIVATE',
        performedBy,
      });
    });

    return this.getEmployeeById(companyId, employeeId);
  }

  /**
   * RF-EMPL-006: Get full change history timeline for an employee.
   * Includes data changes and rate changes.
   */
  static async getEmployeeHistory(companyId: string, employeeId: string) {
    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) return null;

    const [changeHistory, rateHistory] = await Promise.all([
      prisma.employeeChangeHistory.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employeeRateHistory.findMany({
        where: { employeeId },
        orderBy: { effectiveFrom: 'desc' },
      }),
    ]);

    return {
      changeHistory,
      rateHistory,
    };
  }

  /**
   * RF-CFG-001: Explicitly add a new rate history entry.
   */
  static async addRateHistory(
    companyId: string,
    employeeId: string,
    input: AddRateInput,
    performedBy: string
  ) {
    const { hourlyRate, effectiveFrom, reason } = input;

    // Verify employee belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });

    if (!employee) return null;

    await prisma.$transaction(async (tx) => {
      await tx.employeeRateHistory.create({
        data: {
          employeeId,
          hourlyRate: new Prisma.Decimal(hourlyRate),
          effectiveFrom,
        },
      });

      await tx.employeeChangeHistory.create({
        data: {
          employeeId,
          fieldName: 'hourlyRate',
          oldValue: null, // We could fetch current but it's optional for history detail
          newValue: String(hourlyRate),
          changedBy: performedBy,
          reason: reason || 'Ajuste manual de tarifa',
        },
      });

      await AuditService.recordEvent({
        companyId,
        entityType: 'EMPLOYEE',
        entityId: employeeId,
        action: 'UPDATE',
        performedBy,
        metadata: { action: 'ADD_RATE', hourlyRate, effectiveFrom, reason },
      });
    });

    return this.getEmployeeById(companyId, employeeId);
  }
}

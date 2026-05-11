import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { AnalyticsService } from './analyticsService';
import path from 'path';
import fs from 'fs';

export class ExportService {
  /**
   * RF-EXP-002: Create an export task and start processing
   */
  static async createExportTask(
    companyId: string,
    userId: string,
    type: string,
    filters: any
  ) {
    const task = await prisma.exportTask.create({
      data: {
        companyId,
        userId,
        type,
        filters,
        status: 'PENDING',
      },
    });

    // Start background processing (not awaited)
    this.processExport(task.id).catch(err => {
      console.error(`Export ${task.id} failed:`, err);
    });

    return task;
  }

  /**
   * Background process for Excel generation
   */
  private static async processExport(taskId: string) {
    const task = await prisma.exportTask.findUnique({ where: { id: taskId } });
    if (!task) return;

    await prisma.exportTask.update({
      where: { id: taskId },
      data: { status: 'PROCESSING' },
    });

    try {
      const filters = task.filters as any;
      const from = filters.from ? new Date(filters.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const to = filters.to ? new Date(filters.to) : new Date();

      const summary = await AnalyticsService.getCompanySummary(task.companyId, from, to);
      const rankings = await AnalyticsService.getEmployeeRankings(task.companyId, from, to, 100);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Resumen');

      sheet.addRow(['Resumen de Jornales']);
      sheet.addRow(['Desde', from.toISOString().split('T')[0]]);
      sheet.addRow(['Hasta', to.toISOString().split('T')[0]]);
      sheet.addRow([]);

      sheet.addRow(['Total Horas', summary.totalHours]);
      sheet.addRow(['Total Normales', summary.totalNormalHours]);
      sheet.addRow(['Total Extras', summary.totalExtraHours]);
      sheet.addRow(['Costo Total', summary.totalCost]);
      sheet.addRow([]);

      sheet.addRow(['Ranking de Empleados']);
      sheet.addRow(['ID', 'Nombre', 'Documento', 'Horas Totales', 'Costo Total']);
      rankings.forEach(r => {
        sheet.addRow([r.employeeId, r.name, r.documentNumber, r.totalHours, r.totalCost]);
      });

      // Simulation of file storage
      // In production, this would upload to Supabase Storage
      const fileName = `export-${task.id}.xlsx`;
      const exportDir = path.join(process.cwd(), 'public', 'exports');
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, fileName);
      await workbook.xlsx.writeFile(filePath);

      await prisma.exportTask.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          fileUrl: `/exports/${fileName}`, // Relative URL for internal access
        },
      });

    } catch (error) {
      await prisma.exportTask.update({
        where: { id: taskId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get export status
   */
  static async getExportTask(taskId: string, companyId: string) {
    return prisma.exportTask.findUnique({
      where: { id: taskId, companyId },
    });
  }
}

import ExcelJS from 'exceljs';
import { AnalyticsService } from './analyticsService';

export interface ExportFilters {
  from: Date;
  to: Date;
  employeeId?: string;
}

export class ExportService {
  /**
   * Generate an Excel workbook in memory and return it as a Buffer.
   * Does NOT write to the filesystem or create any DB task.
   */
  static async generateExcelBuffer(
    companyId: string,
    filters: ExportFilters
  ): Promise<Buffer> {
    const { from, to } = filters;

    const [summary, rankings] = await Promise.all([
      AnalyticsService.getCompanySummary(companyId, from, to),
      AnalyticsService.getEmployeeRankings(companyId, from, to, 100),
    ]);

    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.addRow(['Resumen de Jornales']);
    summarySheet.addRow(['Desde', from.toISOString().split('T')[0]]);
    summarySheet.addRow(['Hasta', to.toISOString().split('T')[0]]);
    summarySheet.addRow([]);
    summarySheet.addRow(['Total Horas', summary.totalHours]);
    summarySheet.addRow(['Total Normales', summary.totalNormalHours]);
    summarySheet.addRow(['Total Extras', summary.totalExtraHours]);
    summarySheet.addRow(['Costo Total', summary.totalCost]);

    // Rankings sheet
    const rankingsSheet = workbook.addWorksheet('Ranking');
    rankingsSheet.addRow(['ID', 'Nombre', 'Documento', 'Horas Totales', 'Costo Total']);
    rankings.forEach(r => {
      rankingsSheet.addRow([r.employeeId, r.name, r.documentNumber, r.totalHours, r.totalCost]);
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

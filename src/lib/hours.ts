/**
 * RF-JOR-004: Helper utility to calculate and split hours between normal and extra
 * based on a given threshold.
 */
export interface HoursBreakdown {
  total: number;
  normal: number;
  extra: number;
}

export function calculateHours(
  start: Date,
  end: Date,
  threshold: number
): HoursBreakdown {
  const diffMs = end.getTime() - start.getTime();
  const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
  
  const normalHours = Math.min(totalHours, threshold);
  const extraHours = Math.max(0, totalHours - threshold);

  // Round to 2 decimal places for consistent storage as Decimal(5,2)
  return {
    total: Number(totalHours.toFixed(2)),
    normal: Number(normalHours.toFixed(2)),
    extra: Number(extraHours.toFixed(2)),
  };
}

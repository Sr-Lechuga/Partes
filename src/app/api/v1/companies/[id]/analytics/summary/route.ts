import { NextRequest } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';
import { analyticsQuerySchema } from '@/lib/validators/analytics';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const GET = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = analyticsQuerySchema.parse({
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
      });

      // Default to current month if dates missing
      const from = query.from ? new Date(query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const to = query.to ? new Date(query.to) : new Date();

      const summary = await AnalyticsService.getCompanySummary(params.id, from, to);

      return createSuccessResponse(summary);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error interno', 500);
    }
  },
  { requiredRoles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);

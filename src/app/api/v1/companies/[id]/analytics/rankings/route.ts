import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth';
import { AnalyticsService } from '@/services/analyticsService';
import { analyticsQuerySchema } from '@/lib/validators/analytics';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-utils';

export const GET = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = analyticsQuerySchema.parse({
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        limit: searchParams.get('limit') || undefined,
      });

      const from = query.from ? new Date(query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const to = query.to ? new Date(query.to) : new Date();

      const rankings = await AnalyticsService.getEmployeeRankings(params.id, from, to, query.limit);

      return createSuccessResponse(rankings);
    } catch (error) {
      if (error instanceof Error) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse('Error interno', 500);
    }
  },
  { roles: ['ADMIN', 'HR'], checkCompanyAccess: true }
);

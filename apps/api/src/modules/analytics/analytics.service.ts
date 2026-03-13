import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getFormAnalytics(formId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const analytics = await this.prisma.formAnalytics.findMany({
      where: { formId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    const totalResponses = await this.prisma.response.count({ where: { formId } });
    const completedResponses = await this.prisma.response.count({ where: { formId, isCompleted: true } });

    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalStarts = analytics.reduce((sum, a) => sum + a.starts, 0);
    const totalCompletions = analytics.reduce((sum, a) => sum + a.completions, 0);

    const conversionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(1) : '0';
    const completionRate = totalStarts > 0 ? ((totalCompletions / totalStarts) * 100).toFixed(1) : '0';

    return {
      summary: {
        totalViews,
        totalStarts,
        totalCompletions,
        totalResponses,
        completedResponses,
        conversionRate: `${conversionRate}%`,
        completionRate: `${completionRate}%`,
      },
      daily: analytics.map((a) => ({
        date: a.date.toISOString().split('T')[0],
        views: a.views,
        starts: a.starts,
        completions: a.completions,
      })),
    };
  }

  async getWorkspaceOverview(workspaceId: string) {
    const forms = await this.prisma.form.findMany({
      where: { workspaceId },
      select: {
        id: true,
        title: true,
        status: true,
        _count: { select: { responses: true } },
      },
    });

    const totalForms = forms.length;
    const publishedForms = forms.filter((f) => f.status === 'published').length;
    const totalResponses = forms.reduce((sum, f) => sum + f._count.responses, 0);

    return {
      totalForms,
      publishedForms,
      totalResponses,
      forms: forms.map((f) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        responseCount: f._count.responses,
      })),
    };
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('form/:formId')
  getFormAnalytics(@Param('formId') formId: string, @Query('days') days?: string) {
    return this.analyticsService.getFormAnalytics(formId, days ? parseInt(days) : 30);
  }

  @Get('workspace/:workspaceId')
  getWorkspaceOverview(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getWorkspaceOverview(workspaceId);
  }
}

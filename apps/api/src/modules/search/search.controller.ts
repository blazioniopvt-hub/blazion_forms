import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get('responses')
  searchResponses(
    @Query('q') query: string,
    @Query('formId') formId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'relevance' | 'newest' | 'oldest',
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
  ) {
    return this.searchService.searchResponses({
      query,
      formId,
      page: parseInt(page || '1'),
      limit: Math.min(parseInt(limit || '25'), 100),
      sortBy: sort,
      filters: {
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('forms')
  searchForms(
    @Query('q') query: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.searchService.searchForms(query, workspaceId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('field-distribution')
  getFieldDistribution(
    @Query('formId') formId: string,
    @Query('fieldId') fieldId: string,
  ) {
    return this.searchService.getFieldValueDistribution(formId, fieldId);
  }
}

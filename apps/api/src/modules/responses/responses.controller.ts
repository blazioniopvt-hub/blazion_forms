import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, Res, Header } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ResponsesService } from './responses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('responses')
export class ResponsesController {
  constructor(private responsesService: ResponsesService) {}

  // PUBLIC — submit a form response
  @Post('submit/:slug')
  submit(
    @Param('slug') slug: string,
    @Body() body: { answers: Record<string, any>; metadata?: any },
    @Req() req,
  ) {
    return this.responsesService.submit(slug, body, req.ip, req.headers['user-agent']);
  }

  @UseGuards(JwtAuthGuard)
  @Get('form/:formId')
  findAll(
    @Param('formId') formId: string,
    @Query() query: { page?: number; limit?: number; search?: string; completed?: string },
  ) {
    return this.responsesService.findAll(formId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.responsesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.responsesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export/csv/:formId')
  async exportCsv(@Param('formId') formId: string, @Res() res: ExpressResponse) {
    const csv = await this.responsesService.exportCsv(formId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=responses-${formId}.csv`);
    res.send(csv);
  }

  @UseGuards(JwtAuthGuard)
  @Get('export/json/:formId')
  async exportJson(@Param('formId') formId: string) {
    return this.responsesService.exportJson(formId);
  }
}

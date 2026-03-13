import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private automationsService: AutomationsService) {}

  @Post()
  create(@Body() body: { formId: string; name: string; trigger: string; conditions?: any; actions: any[] }) {
    return this.automationsService.create(body.formId, body);
  }

  @Get('form/:formId')
  findAll(@Param('formId') formId: string) {
    return this.automationsService.findAll(formId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.automationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.automationsService.remove(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.automationsService.getLogs(id, limit ? parseInt(limit) : 20);
  }
}

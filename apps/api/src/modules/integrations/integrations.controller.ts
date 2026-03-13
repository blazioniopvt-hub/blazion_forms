import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Post()
  create(@Body() body: { workspaceId: string; provider: string; name: string; config: any }) {
    return this.integrationsService.create(body.workspaceId, body);
  }

  @Get('workspace/:workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.integrationsService.findAll(workspaceId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.integrationsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string) {
    return this.integrationsService.testConnection(id);
  }
}

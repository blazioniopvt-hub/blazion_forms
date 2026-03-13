import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get(':workspaceId/members')
  getMembers(@Param('workspaceId') workspaceId: string) {
    return this.teamsService.getMembers(workspaceId);
  }

  @Post(':workspaceId/invite')
  invite(@Param('workspaceId') workspaceId: string, @Body() body: { email: string; role: string }) {
    return this.teamsService.inviteMember(workspaceId, body.email, body.role);
  }

  @Post('accept-invite/:token')
  acceptInvite(@Param('token') token: string, @Req() req) {
    return this.teamsService.acceptInvite(token, req.user.id);
  }

  @Put(':workspaceId/members/:userId')
  updateRole(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string, @Body() body: { role: string }) {
    return this.teamsService.updateRole(workspaceId, userId, body.role);
  }

  @Delete(':workspaceId/members/:userId')
  removeMember(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(workspaceId, userId);
  }

  @Put(':workspaceId')
  updateWorkspace(@Param('workspaceId') workspaceId: string, @Body() body: { name?: string }) {
    return this.teamsService.updateWorkspace(workspaceId, body);
  }

  @Get(':workspaceId/invites')
  getPendingInvites(@Param('workspaceId') workspaceId: string) {
    return this.teamsService.getPendingInvites(workspaceId);
  }
}

import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async inviteMember(workspaceId: string, email: string, role: string) {
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const token = uuidv4();
    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600000), // 7 days
      },
    });

    // TODO: Send invite email via Resend
    return { invite, inviteLink: `/invite/${token}` };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) throw new NotFoundException('Invite expired or invalid');

    await this.prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role },
    });
    await this.prisma.workspaceInvite.delete({ where: { id: invite.id } });

    return { joined: true, workspaceId: invite.workspaceId };
  }

  async updateRole(workspaceId: string, userId: string, role: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new ForbiddenException('Cannot change owner role');

    return this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new NotFoundException();
    if (member.role === 'owner') throw new ForbiddenException('Cannot remove workspace owner');

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return { removed: true };
  }

  async updateWorkspace(workspaceId: string, data: { name?: string }) {
    return this.prisma.workspace.update({ where: { id: workspaceId }, data });
  }

  async getPendingInvites(workspaceId: string) {
    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

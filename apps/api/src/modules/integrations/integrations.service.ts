import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================
// Integrations Hub — Slack, Google Sheets, Notion, Zapier
// ============================================================
@Injectable()
export class IntegrationsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, data: { provider: string; name: string; config: any }) {
    return this.prisma.integration.create({
      data: { workspaceId, provider: data.provider, name: data.name, config: data.config },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.integration.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, data: Partial<{ name: string; config: any; isActive: boolean }>) {
    return this.prisma.integration.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.integration.delete({ where: { id } });
    return { deleted: true };
  }

  async testConnection(id: string) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) throw new Error('Integration not found');

    switch (integration.provider) {
      case 'slack':
        return this.testSlack(integration.config as any);
      case 'google_sheets':
        return { success: true, message: 'Google Sheets connection is configured.' };
      case 'notion':
        return this.testNotion(integration.config as any);
      default:
        return { success: true, message: 'Connection configured.' };
    }
  }

  private async testSlack(config: any) {
    try {
      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '✅ Blazion Forms integration test successful!' }),
      });
      return { success: res.ok, message: res.ok ? 'Slack message sent!' : 'Failed to send' };
    } catch (e) {
      return { success: false, message: 'Could not reach Slack webhook URL' };
    }
  }

  private async testNotion(config: any) {
    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${config.databaseId}`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Notion-Version': '2022-06-28' },
      });
      return { success: res.ok, message: res.ok ? 'Notion database accessible!' : 'Failed to access database' };
    } catch (e) {
      return { success: false, message: 'Could not reach Notion API' };
    }
  }
}

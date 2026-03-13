import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================
// Automations Engine — trigger actions on form events
// ============================================================

interface AutomationAction {
  type: 'send_email' | 'webhook' | 'slack' | 'google_sheets' | 'notion' | 'delay';
  config: Record<string, any>;
}

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(private prisma: PrismaService) {}

  // Create a new automation
  async create(formId: string, data: { name: string; trigger: string; conditions?: any; actions: AutomationAction[] }) {
    return this.prisma.automation.create({
      data: {
        formId,
        name: data.name,
        trigger: data.trigger,
        conditions: data.conditions || [],
        actions: data.actions as any,
      },
    });
  }

  // List automations for a form
  async findAll(formId: string) {
    return this.prisma.automation.findMany({
      where: { formId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update automation
  async update(id: string, data: Partial<{ name: string; trigger: string; conditions: any; actions: any; isActive: boolean }>) {
    return this.prisma.automation.update({ where: { id }, data });
  }

  // Delete automation
  async remove(id: string) {
    await this.prisma.automation.delete({ where: { id } });
    return { deleted: true };
  }

  // Execute automations for a trigger event
  async executeTrigger(formId: string, trigger: string, payload: any) {
    const automations = await this.prisma.automation.findMany({
      where: { formId, trigger, isActive: true },
    });

    for (const automation of automations) {
      this.executeAutomation(automation, payload);
    }
  }

  // Execute a single automation
  private async executeAutomation(automation: any, payload: any) {
    const startTime = Date.now();
    const actions = automation.actions as AutomationAction[];

    try {
      for (const action of actions) {
        await this.executeAction(action, payload);
      }

      await this.prisma.automation.update({
        where: { id: automation.id },
        data: { runCount: { increment: 1 }, lastRunAt: new Date() },
      });

      await this.prisma.automationLog.create({
        data: {
          automationId: automation.id,
          status: 'success',
          duration: Date.now() - startTime,
          input: payload,
        },
      });
    } catch (error: any) {
      this.logger.error(`Automation ${automation.id} failed:`, error.message);
      await this.prisma.automationLog.create({
        data: {
          automationId: automation.id,
          status: 'failed',
          duration: Date.now() - startTime,
          input: payload,
          error: error.message,
        },
      });
    }
  }

  // Execute individual action
  private async executeAction(action: AutomationAction, payload: any) {
    switch (action.type) {
      case 'send_email':
        await this.sendEmail(action.config, payload);
        break;
      case 'webhook':
        await this.sendWebhook(action.config, payload);
        break;
      case 'slack':
        await this.sendToSlack(action.config, payload);
        break;
      case 'google_sheets':
        await this.appendToGoogleSheets(action.config, payload);
        break;
      case 'notion':
        await this.createNotionPage(action.config, payload);
        break;
      case 'delay':
        await new Promise(r => setTimeout(r, (action.config.seconds || 1) * 1000));
        break;
    }
  }

  // Action implementations
  private async sendEmail(config: any, payload: any) {
    // Production: Use Resend API
    this.logger.log(`📧 Sending email to ${config.to} | Subject: ${config.subject}`);
    // await fetch('https://api.resend.com/emails', { ... })
  }

  private async sendWebhook(config: any, payload: any) {
    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.secret ? { 'X-Webhook-Secret': config.secret } : {}),
      },
      body: JSON.stringify({ event: 'automation.triggered', data: payload, timestamp: new Date().toISOString() }),
    });
  }

  private async sendToSlack(config: any, payload: any) {
    if (!config.webhookUrl) return;
    const text = this.formatSlackMessage(config, payload);
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel: config.channel }),
    });
  }

  private async appendToGoogleSheets(config: any, payload: any) {
    // Production: Use Google Sheets API v4
    this.logger.log(`📊 Appending to Google Sheet: ${config.spreadsheetId}`);
    // const auth = new google.auth.GoogleAuth({ ... })
    // await sheets.spreadsheets.values.append({ ... })
  }

  private async createNotionPage(config: any, payload: any) {
    if (!config.apiKey || !config.databaseId) return;
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: config.databaseId },
        properties: this.formatNotionProperties(config, payload),
      }),
    });
  }

  private formatSlackMessage(config: any, payload: any): string {
    const answers = payload.answers || {};
    const lines = Object.entries(answers).map(([key, val]) => `• *${key}*: ${val}`);
    return `📋 *New Form Submission*\n${config.formTitle || 'Form'}\n\n${lines.join('\n')}`;
  }

  private formatNotionProperties(config: any, payload: any): any {
    const props: any = {};
    if (config.titleField && payload.answers?.[config.titleField]) {
      props['Name'] = { title: [{ text: { content: payload.answers[config.titleField] } }] };
    }
    return props;
  }

  // Get automation logs
  async getLogs(automationId: string, limit = 20) {
    return this.prisma.automationLog.findMany({
      where: { automationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

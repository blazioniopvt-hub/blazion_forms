import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ResponsesService {
  constructor(private prisma: PrismaService) {}

  // Submit a response (PUBLIC — no auth)
  async submit(slug: string, body: { answers: Record<string, any>; metadata?: any }, ip?: string, ua?: string) {
    const form = await this.prisma.form.findUnique({
      where: { slug },
      include: { fields: true },
    });
    if (!form || form.status !== 'published') {
      throw new NotFoundException('Form not found or not published');
    }

    // Create response
    const response = await this.prisma.response.create({
      data: {
        formId: form.id,
        respondentIp: ip,
        userAgent: ua,
        isCompleted: true,
        submittedAt: new Date(),
        metadata: body.metadata || {},
        answers: body.answers,
        answerDetails: {
          create: Object.entries(body.answers).map(([fieldId, value]) => ({
            fieldId,
            valueText: typeof value === 'string' ? value : null,
            valueJson: typeof value !== 'string' ? value : null,
          })),
        },
      },
      include: { answerDetails: true },
    });

    // Track analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.prisma.formAnalytics.upsert({
      where: { formId_date: { formId: form.id, date: today } },
      update: { completions: { increment: 1 } },
      create: { formId: form.id, date: today, completions: 1 },
    });

    // Fire webhooks
    await this.fireWebhooks(form.id, response);

    return { success: true, responseId: response.id };
  }

  // Get all responses for a form
  async findAll(formId: string, query: { page?: number; limit?: number; search?: string; completed?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const where: any = { formId };
    if (query.completed === 'true') where.isCompleted = true;
    if (query.completed === 'false') where.isCompleted = false;

    const [responses, total] = await Promise.all([
      this.prisma.response.findMany({
        where,
        include: {
          answerDetails: { include: { field: { select: { label: true, type: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.response.count({ where }),
    ]);

    return {
      data: responses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get a single response
  async findOne(responseId: string) {
    const response = await this.prisma.response.findUnique({
      where: { id: responseId },
      include: {
        answerDetails: { include: { field: { select: { label: true, type: true } } } },
      },
    });
    if (!response) throw new NotFoundException('Response not found');
    return response;
  }

  // Delete a response
  async remove(responseId: string) {
    await this.prisma.response.delete({ where: { id: responseId } });
    return { deleted: true };
  }

  // Export responses as CSV
  async exportCsv(formId: string): Promise<string> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: { orderBy: [{ pageNumber: 'asc' }, { orderIndex: 'asc' }] },
      },
    });
    if (!form) throw new NotFoundException();

    const responses = await this.prisma.response.findMany({
      where: { formId, isCompleted: true },
      include: { answerDetails: true },
      orderBy: { submittedAt: 'desc' },
    });

    // Build CSV headers
    const headers = ['Response ID', 'Submitted At', ...form.fields.map((f) => f.label)];

    const rows = responses.map((r) => {
      const row: string[] = [
        r.id,
        r.submittedAt?.toISOString() || '',
      ];
      for (const field of form.fields) {
        const answer = r.answerDetails.find((a) => a.fieldId === field.id);
        row.push(answer?.valueText || (answer?.valueJson ? JSON.stringify(answer.valueJson) : ''));
      }
      return row;
    });

    return stringify([headers, ...rows]);
  }

  // Export responses as JSON
  async exportJson(formId: string) {
    const responses = await this.prisma.response.findMany({
      where: { formId, isCompleted: true },
      include: {
        answerDetails: { include: { field: { select: { label: true, type: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return responses.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt,
      answers: r.answerDetails.reduce((acc, a) => {
        acc[a.field.label] = a.valueText || a.valueJson;
        return acc;
      }, {} as Record<string, any>),
    }));
  }

  // Fire webhooks
  private async fireWebhooks(formId: string, response: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { formId, isActive: true },
    });
    for (const wh of webhooks) {
      try {
        await fetch(wh.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': wh.secret || '' },
          body: JSON.stringify({ event: 'response.created', data: response }),
        });
      } catch (e) {
        console.error(`Webhook ${wh.id} failed:`, e);
      }
    }
  }
}

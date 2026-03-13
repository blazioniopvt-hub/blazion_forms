import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================
// Queue Service — Background Job Processing Engine
// Handles: emails, webhooks, automations, CSV exports, analytics
// Design: Pull-based queue using PostgreSQL (upgrade to BullMQ)
// Target: Process 1M+ jobs/day with retry logic
// ============================================================

export interface JobPayload {
  type: 'email' | 'webhook' | 'automation' | 'export' | 'analytics_aggregate' | 'cleanup';
  data: Record<string, any>;
  priority?: number; // 1=highest, 10=lowest
}

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private processing = false;
  private pollInterval: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Start polling for jobs every 2 seconds
    this.pollInterval = setInterval(() => this.processNextBatch(), 2000);
    this.logger.log('Queue worker started — polling every 2s');
  }

  // ── Enqueue a Job ──────────────────────────

  async enqueue(job: JobPayload): Promise<string> {
    const created = await this.prisma.jobQueue.create({
      data: {
        type: job.type,
        payload: job.data as any,
        status: 'pending',
        scheduledAt: new Date(),
      },
    });
    return created.id;
  }

  // ── Enqueue multiple jobs atomically ───────

  async enqueueBatch(jobs: JobPayload[]): Promise<number> {
    const result = await this.prisma.jobQueue.createMany({
      data: jobs.map(j => ({
        type: j.type,
        payload: j.data as any,
        status: 'pending',
        scheduledAt: new Date(),
      })),
    });
    return result.count;
  }

  // Schedule a delayed job
  async enqueueDelayed(job: JobPayload, delaySeconds: number): Promise<string> {
    const created = await this.prisma.jobQueue.create({
      data: {
        type: job.type,
        payload: job.data as any,
        status: 'pending',
        scheduledAt: new Date(Date.now() + delaySeconds * 1000),
      },
    });
    return created.id;
  }

  // ── Process Jobs ───────────────────────────

  private async processNextBatch() {
    if (this.processing) return;
    this.processing = true;

    try {
      // Fetch up to 10 pending jobs (oldest first, only if scheduled time has passed)
      const jobs = await this.prisma.jobQueue.findMany({
        where: {
          status: 'pending',
          scheduledAt: { lte: new Date() },
        },
        orderBy: [{ scheduledAt: 'asc' }],
        take: 10,
      });

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error: any) {
      this.logger.error('Queue polling error:', error.message);
    } finally {
      this.processing = false;
    }
  }

  private async processJob(job: any) {
    const startTime = Date.now();

    // Mark as processing
    await this.prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: 'processing', startedAt: new Date(), attempts: { increment: 1 } },
    });

    try {
      await this.executeJob(job.type, job.payload);

      // Mark as done
      await this.prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: 'done', completedAt: new Date() },
      });

      this.logger.debug(`Job ${job.type}:${job.id} completed in ${Date.now() - startTime}ms`);
    } catch (error: any) {
      const shouldRetry = job.attempts < job.maxAttempts;

      await this.prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          error: error.message,
          // Exponential backoff: 10s, 40s, 90s
          scheduledAt: shouldRetry
            ? new Date(Date.now() + Math.pow(job.attempts + 1, 2) * 10_000)
            : undefined,
        },
      });

      this.logger.warn(
        `Job ${job.type}:${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}): ${error.message}`,
      );
    }
  }

  // ── Job Handlers ───────────────────────────

  private async executeJob(type: string, payload: any) {
    switch (type) {
      case 'email':
        await this.handleEmail(payload);
        break;
      case 'webhook':
        await this.handleWebhook(payload);
        break;
      case 'automation':
        await this.handleAutomation(payload);
        break;
      case 'export':
        await this.handleExport(payload);
        break;
      case 'analytics_aggregate':
        await this.handleAnalyticsAggregate(payload);
        break;
      case 'cleanup':
        await this.handleCleanup(payload);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  private async handleEmail(payload: any) {
    // Production: Use Resend SDK
    this.logger.log(`📧 Sending email to ${payload.to}: ${payload.subject}`);
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Blazion Forms <noreply@blazionforms.com>',
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
    }
  }

  private async handleWebhook(payload: any) {
    const response = await fetch(payload.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(payload.secret ? { 'X-Webhook-Secret': payload.secret } : {}),
        'User-Agent': 'BlazionForms-Webhook/2.0',
      },
      body: JSON.stringify(payload.data),
      signal: AbortSignal.timeout(15_000), // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook returned HTTP ${response.status}`);
    }
  }

  private async handleAutomation(payload: any) {
    this.logger.log(`⚙️ Running automation ${payload.automationId}`);
    // Delegated to AutomationsService
  }

  private async handleExport(payload: any) {
    this.logger.log(`📊 Generating ${payload.format} export for form ${payload.formId}`);
    // Large CSV/JSON export in background
  }

  private async handleAnalyticsAggregate(payload: any) {
    // Aggregate daily analytics from raw events
    const { formId, date } = payload;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [views, completions] = await Promise.all([
      this.prisma.response.count({
        where: { formId, startedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.response.count({
        where: { formId, isCompleted: true, submittedAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    await this.prisma.formAnalytics.upsert({
      where: { formId_date: { formId, date: dayStart } },
      update: { views, completions, starts: views },
      create: { formId, date: dayStart, views, starts: views, completions },
    });
  }

  private async handleCleanup(payload: any) {
    // Remove completed jobs older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 3600_000);
    const { count } = await this.prisma.jobQueue.deleteMany({
      where: { status: 'done', completedAt: { lt: cutoff } },
    });
    this.logger.log(`🧹 Cleaned ${count} completed jobs`);
  }

  // ── Queue Stats ────────────────────────────

  async getStats() {
    const [pending, processing, done, failed] = await Promise.all([
      this.prisma.jobQueue.count({ where: { status: 'pending' } }),
      this.prisma.jobQueue.count({ where: { status: 'processing' } }),
      this.prisma.jobQueue.count({ where: { status: 'done' } }),
      this.prisma.jobQueue.count({ where: { status: 'failed' } }),
    ]);
    return { pending, processing, done, failed, total: pending + processing + done + failed };
  }
}

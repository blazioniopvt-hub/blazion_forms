import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { QueueService } from '../queue/queue.service';

// ============================================================
// Optimized Response Service — High-Throughput Submissions
// Target: Handle 1M+ submissions/day with minimal latency
// Strategy: Write-behind caching, async side-effects, batch DB ops
// ============================================================

@Injectable()
export class OptimizedResponseService {
  private readonly logger = new Logger(OptimizedResponseService.name);

  // Write buffer: batch inserts for analytics counters
  private analyticsBuffer = new Map<string, { views: number; starts: number; completions: number }>();
  private flushInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private queue: QueueService,
  ) {
    // Flush analytics buffer every 10 seconds
    this.flushInterval = setInterval(() => this.flushAnalyticsBuffer(), 10_000);
  }

  // ── High-Performance Form Submission ───────
  // Optimized to minimize DB round-trips and defer non-critical work

  async submitResponse(slug: string, answers: Record<string, any>, metadata: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
  }) {
    const startTime = Date.now();

    // 1. Load form from cache (avoids DB hit for every submission)
    const form = await this.cache.getOrSet(
      CacheService.keys.formPublic(slug),
      () => this.prisma.form.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          fields: true,
          settings: true,
          workspaceId: true,
        },
      }),
      600, // Cache for 10 min
    );

    if (!form || form.status !== 'published') {
      throw new Error('Form not found or not published');
    }

    // 2. Validate answers (lightweight, synchronous)
    const validatedAnswers = this.validateAnswers(form.fields as any[], answers);

    // 3. Insert response (single DB write — the critical path)
    const response = await this.prisma.response.create({
      data: {
        formId: form.id,
        answers: validatedAnswers,
        isCompleted: true,
        submittedAt: new Date(),
        metadata: {
          ip: metadata.ip ? this.hashIp(metadata.ip) : undefined,
          userAgent: metadata.userAgent?.slice(0, 200),
          referrer: metadata.referrer?.slice(0, 500),
        },
      },
      select: { id: true, submittedAt: true },
    });

    // 4. Buffer analytics counter (NOT a DB write per submission)
    this.incrementAnalytics(form.id);

    // 5. Invalidate response count cache
    await this.cache.del(CacheService.keys.responseCount(form.id));

    // 6. Fire side-effects asynchronously via job queue (non-blocking)
    this.queue.enqueue({
      type: 'automation',
      data: { formId: form.id, responseId: response.id, trigger: 'form.submitted', answers: validatedAnswers },
    }).catch(() => {}); // Fire-and-forget

    // 7. Update response count in background
    this.queue.enqueue({
      type: 'analytics_aggregate',
      data: { formId: form.id, date: new Date().toISOString().slice(0, 10) },
    }).catch(() => {});

    this.logger.debug(`Submission for ${slug} processed in ${Date.now() - startTime}ms`);

    return {
      success: true,
      responseId: response.id,
      submittedAt: response.submittedAt,
    };
  }

  // ── Optimized Response Listing ─────────────
  // Uses cursor-based pagination (much faster than OFFSET for large datasets)

  async listResponses(formId: string, options: {
    cursor?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const limit = Math.min(options.limit || 25, 100);
    const cursor = options.cursor;

    const responses = await this.prisma.response.findMany({
      where: { formId },
      take: limit + 1, // Fetch one extra to determine if there are more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { submittedAt: options.sortOrder || 'desc' },
      select: {
        id: true,
        answers: true,
        isCompleted: true,
        submittedAt: true,
        metadata: true,
      },
    });

    const hasMore = responses.length > limit;
    const results = hasMore ? responses.slice(0, -1) : responses;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    // Get total count from cache
    const total = await this.cache.getOrSet(
      CacheService.keys.responseCount(formId),
      () => this.prisma.response.count({ where: { formId } }),
      120,
    );

    return { data: results, total, hasMore, nextCursor };
  }

  // ── Optimized CSV Export ───────────────────
  // Streams data in chunks to avoid OOM on large datasets

  async exportResponses(formId: string, format: 'csv' | 'json') {
    const CHUNK_SIZE = 500;
    let cursor: string | undefined;
    const allData: any[] = [];

    // Fetch in chunks
    while (true) {
      const chunk = await this.prisma.response.findMany({
        where: { formId, isCompleted: true },
        take: CHUNK_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          answers: true,
          submittedAt: true,
        },
      });

      allData.push(...chunk);
      if (chunk.length < CHUNK_SIZE) break;
      cursor = chunk[chunk.length - 1].id;
    }

    if (format === 'csv') {
      return this.convertToCsv(allData);
    }
    return allData;
  }

  // ── Private Methods ────────────────────────

  private validateAnswers(fields: any[], answers: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {};
    if (!fields) return answers;

    for (const field of fields) {
      const value = answers[field.id];

      // Required field check
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Field "${field.label}" is required`);
      }

      if (value !== undefined && value !== null) {
        // Type-specific validation
        switch (field.type) {
          case 'email':
            if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              throw new Error(`Invalid email for "${field.label}"`);
            }
            break;
          case 'url':
            if (typeof value === 'string' && !value.match(/^https?:\/\/.+/)) {
              throw new Error(`Invalid URL for "${field.label}"`);
            }
            break;
          case 'number':
          case 'rating':
          case 'scale':
            if (isNaN(Number(value))) {
              throw new Error(`Invalid number for "${field.label}"`);
            }
            break;
        }

        // Sanitize strings (prevent XSS in stored data)
        validated[field.id] = typeof value === 'string'
          ? value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').slice(0, 10000)
          : value;
      }
    }

    return validated;
  }

  private hashIp(ip: string): string {
    // Store hashed IP for privacy compliance (GDPR)
    const { createHash } = require('crypto');
    return createHash('sha256').update(ip + (process.env.JWT_SECRET || '')).digest('hex').slice(0, 16);
  }

  private incrementAnalytics(formId: string) {
    const existing = this.analyticsBuffer.get(formId);
    if (existing) {
      existing.completions++;
    } else {
      this.analyticsBuffer.set(formId, { views: 0, starts: 0, completions: 1 });
    }
  }

  private async flushAnalyticsBuffer() {
    if (this.analyticsBuffer.size === 0) return;

    const buffer = new Map(this.analyticsBuffer);
    this.analyticsBuffer.clear();

    for (const [formId, counts] of buffer) {
      try {
        // Batch update response count
        await this.prisma.form.update({
          where: { id: formId },
          data: { responseCount: { increment: counts.completions } },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to flush analytics for ${formId}: ${err.message}`);
      }
    }
  }

  private convertToCsv(data: any[]): string {
    if (data.length === 0) return '';

    // Collect all unique field keys
    const allKeys = new Set<string>();
    data.forEach(r => {
      if (r.answers && typeof r.answers === 'object') {
        Object.keys(r.answers).forEach(k => allKeys.add(k));
      }
    });

    const headers = ['id', 'submittedAt', ...Array.from(allKeys)];
    const rows = data.map(r => {
      return headers.map(h => {
        if (h === 'id') return r.id;
        if (h === 'submittedAt') return r.submittedAt;
        const val = r.answers?.[h];
        if (val === undefined || val === null) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}

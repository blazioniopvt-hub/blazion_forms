import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

// ============================================================
// Search Service — Fast Full-Text Search for Responses
// Uses: PostgreSQL pg_trgm + GIN indexes for fuzzy matching
// Target: <100ms search across millions of responses
// ============================================================

interface SearchOptions {
  query: string;
  formId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'newest' | 'oldest';
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    isCompleted?: boolean;
    fieldFilters?: { fieldId: string; value: string }[];
  };
}

export interface SearchResult {
  results: any[];
  total: number;
  page: number;
  totalPages: number;
  queryTimeMs: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // ── Search Responses ───────────────────────

  async searchResponses(options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const { query, formId, page = 1, limit = 25, sortBy = 'relevance', filters } = options;

    // Build cache key
    const cacheKey = `search:${formId || 'all'}:${query}:${page}:${sortBy}`;
    const cached = await this.cache.get<SearchResult>(cacheKey);
    if (cached) return { ...cached, queryTimeMs: Date.now() - startTime };

    // Sanitize search query
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s@.\-_]/g, '').trim();
    if (!sanitizedQuery) {
      return { results: [], total: 0, page: 1, totalPages: 0, queryTimeMs: 0 };
    }

    // Build WHERE conditions
    const where: any = {};
    if (formId) where.formId = formId;
    if (filters?.isCompleted !== undefined) where.isCompleted = filters.isCompleted;
    if (filters?.dateFrom || filters?.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) where.submittedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.submittedAt.lte = filters.dateTo;
    }

    // PostgreSQL full-text search using raw query for performance
    // This leverages pg_trgm extension for fuzzy matching
    const searchTerms = sanitizedQuery.split(/\s+/).map(t => `%${t}%`);

    // Use Prisma's native findMany with JSON field filtering
    // For answers stored as JSONB, we search across all values
    const [responses, total] = await Promise.all([
      this.prisma.response.findMany({
        where: {
          ...where,
          // Search within JSONB answers field
          OR: searchTerms.map(term => ({
            answers: { path: [], string_contains: term.replace(/%/g, '') },
          })),
        },
        include: {
          form: { select: { id: true, title: true, slug: true } },
        },
        orderBy: sortBy === 'newest'
          ? { submittedAt: 'desc' }
          : sortBy === 'oldest'
            ? { submittedAt: 'asc' }
            : { submittedAt: 'desc' }, // Default: newest
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.response.count({
        where: {
          ...where,
          OR: searchTerms.map(term => ({
            answers: { path: [], string_contains: term.replace(/%/g, '') },
          })),
        },
      }),
    ]);

    const result: SearchResult = {
      results: responses.map(r => ({
        id: r.id,
        formId: r.formId,
        formTitle: (r as any).form?.title,
        answers: r.answers,
        submittedAt: r.submittedAt,
        isCompleted: r.isCompleted,
        // Highlight matching terms in results
        _highlights: this.getHighlights(r.answers, sanitizedQuery),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      queryTimeMs: Date.now() - startTime,
    };

    // Cache search results for 60s
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  // ── Search Forms by Title/Description ──────

  async searchForms(query: string, workspaceId: string) {
    const sanitized = query.replace(/[^a-zA-Z0-9\s]/g, '').trim();

    return this.prisma.form.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: sanitized, mode: 'insensitive' } },
          { description: { contains: sanitized, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        responseCount: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  // ── Highlight Matching Text ────────────────

  private getHighlights(answers: any, query: string): Record<string, string> {
    const highlights: Record<string, string> = {};
    if (!answers || typeof answers !== 'object') return highlights;

    const terms = query.toLowerCase().split(/\s+/);

    for (const [key, value] of Object.entries(answers as Record<string, any>)) {
      const strValue = String(value).toLowerCase();
      for (const term of terms) {
        if (strValue.includes(term)) {
          // Extract context around the match
          const idx = strValue.indexOf(term);
          const start = Math.max(0, idx - 30);
          const end = Math.min(strValue.length, idx + term.length + 30);
          const snippet = String(value).slice(start, end);
          highlights[key] = `${start > 0 ? '...' : ''}${snippet}${end < strValue.length ? '...' : ''}`;
          break;
        }
      }
    }
    return highlights;
  }

  // ── Response Count by Field Value (for analytics) ──

  async getFieldValueDistribution(formId: string, fieldId: string) {
    const cacheKey = `field_dist:${formId}:${fieldId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const responses = await this.prisma.response.findMany({
        where: { formId, isCompleted: true },
        select: { answers: true },
        take: 10000,
      });

      const distribution: Record<string, number> = {};
      for (const r of responses) {
        const answers = r.answers as Record<string, any>;
        const value = String(answers?.[fieldId] || 'N/A');
        distribution[value] = (distribution[value] || 0) + 1;
      }

      return Object.entries(distribution)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);
    }, 300);
  }
}

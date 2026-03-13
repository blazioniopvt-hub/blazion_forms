import { Injectable, CanActivate, ExecutionContext, HttpException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache/cache.service';

// ============================================================
// Advanced Rate Limiter — Multi-tier IP + User throttling
// Tiers: Public forms (generous), Auth endpoints (strict),
//        General API (moderate), Admin (relaxed)
// Uses sliding window counter via cache atomic increment
// ============================================================

export interface RateLimitConfig {
  windowSec: number;
  maxRequests: number;
  message?: string;
}

// Decorator to set per-route rate limits
export const RateLimit = (config: RateLimitConfig) =>
  Reflect.metadata('rateLimit', config);

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'auth/login':    { windowSec: 300, maxRequests: 10,  message: 'Too many login attempts. Try again in 5 minutes.' },
  'auth/register': { windowSec: 3600, maxRequests: 5,  message: 'Too many registration attempts. Try again later.' },
  'auth/forgot':   { windowSec: 3600, maxRequests: 3,  message: 'Too many password reset requests.' },
  'responses/submit': { windowSec: 60, maxRequests: 30, message: 'Submission rate exceeded. Please slow down.' },
  'ai/generate':   { windowSec: 60, maxRequests: 5,   message: 'AI generation rate exceeded. Please wait.' },
  'storage/upload': { windowSec: 60, maxRequests: 20,  message: 'Upload rate exceeded.' },
};

const GLOBAL_LIMIT: RateLimitConfig = { windowSec: 60, maxRequests: 120 };

@Injectable()
export class AdvancedRateLimiter implements CanActivate {
  private readonly logger = new Logger(AdvancedRateLimiter.name);

  constructor(
    private cache: CacheService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract client identifier
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userId = request.user?.id;
    const path = request.route?.path || request.url;

    // Determine rate limit config
    const routeLimit = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());
    const pathLimit = this.findPathLimit(path);
    const config = routeLimit || pathLimit || GLOBAL_LIMIT;

    // Use user ID if authenticated, IP otherwise
    const identifier = userId || ip;
    const key = CacheService.keys.rateLimit(identifier, this.normalizeEndpoint(path));

    // Increment counter
    const current = await this.cache.increment(key, config.windowSec);

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current));
    response.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + config.windowSec);

    if (current > config.maxRequests) {
      this.logger.warn(`Rate limit exceeded: ${identifier} on ${path} (${current}/${config.maxRequests})`);
      response.setHeader('Retry-After', config.windowSec);
      throw new HttpException(
        { statusCode: 429, message: config.message || 'Too many requests', retryAfter: config.windowSec },
        429,
      );
    }

    return true;
  }

  private findPathLimit(path: string): RateLimitConfig | null {
    for (const [pattern, config] of Object.entries(DEFAULT_LIMITS)) {
      if (path.includes(pattern)) return config;
    }
    return null;
  }

  private normalizeEndpoint(path: string): string {
    // Convert /api/v1/forms/abc123 → forms/:id
    return path
      .replace(/\/api\/v1\//g, '')
      .replace(/\/[a-f0-9-]{20,}/g, '/:id')
      .replace(/\/\d+/g, '/:n');
  }
}

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './modules/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { FormsModule } from './modules/forms/forms.module';
import { ResponsesModule } from './modules/responses/responses.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { BillingModule } from './modules/billing/billing.module';
import { TeamsModule } from './modules/teams/teams.module';
import { StorageModule } from './modules/storage/storage.module';
import { SearchModule } from './modules/search/search.module';
import { AdvancedRateLimiter } from './modules/rate-limiter/rate-limiter.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    CacheModule,      // Global: Redis-backed caching
    QueueModule,      // Global: Background job processing
    AuthModule,
    FormsModule,
    ResponsesModule,
    AnalyticsModule,
    AiModule,
    AutomationsModule,
    IntegrationsModule,
    BillingModule,
    TeamsModule,
    StorageModule,    // File uploads with signed URLs
    SearchModule,     // Full-text search
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AdvancedRateLimiter },
  ],
})
export class AppModule {}

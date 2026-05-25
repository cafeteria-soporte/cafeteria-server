import { Module } from '@nestjs/common';
import { SalesAnalyticsController } from './sales-analytics.controller';
import { SalesAnalyticsService } from './sales-analytics.service';
import { AnalyticsAuditInterceptor } from '../interceptors/analytics-audit.interceptor';

@Module({
  controllers: [SalesAnalyticsController],
  providers: [SalesAnalyticsService, AnalyticsAuditInterceptor],
})
export class SalesAnalyticsModule {}

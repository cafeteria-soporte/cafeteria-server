import { Module } from '@nestjs/common';
import { ShiftsAnalyticsController } from './shifts-analytics.controller';
import { ShiftsAnalyticsService } from './shifts-analytics.service';
import { AnalyticsAuditInterceptor } from '../interceptors/analytics-audit.interceptor';

@Module({
    controllers: [ShiftsAnalyticsController],
    providers:   [ShiftsAnalyticsService, AnalyticsAuditInterceptor],
})
export class ShiftsAnalyticsModule {}

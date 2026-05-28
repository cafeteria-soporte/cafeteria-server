import { Module } from '@nestjs/common';
import { DssController } from './dss.controller';
import { TabPrincipalService } from './services/tab-principal.service';
import { TabPredictivoService } from './services/tab-predictivo.service';
import { TabMarketingService } from './services/tab-marketing.service';
import { AnalyticsAuditInterceptor } from '../analytics/interceptors/analytics-audit.interceptor';

@Module({
  controllers: [DssController],
  providers: [
    TabPrincipalService,
    TabPredictivoService,
    TabMarketingService,
    AnalyticsAuditInterceptor,
  ],
})
export class DssModule {}

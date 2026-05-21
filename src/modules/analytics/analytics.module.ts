import { Module } from '@nestjs/common';
import { SalesAnalyticsModule } from './sales/sales-analytics.module';

@Module({
    imports: [SalesAnalyticsModule],
})
export class AnalyticsModule {}

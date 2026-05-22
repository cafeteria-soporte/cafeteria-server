import { Module } from '@nestjs/common';
import { SalesAnalyticsModule } from './sales/sales-analytics.module';
import { ShiftsAnalyticsModule } from './shifts/shifts-analytics.module';

@Module({
    imports: [SalesAnalyticsModule, ShiftsAnalyticsModule],
})
export class AnalyticsModule {}

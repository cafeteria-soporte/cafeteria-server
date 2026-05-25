import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesAnalyticsModule } from './sales/sales-analytics.module';
import { ShiftsAnalyticsModule } from './shifts/shifts-analytics.module';
import { Product } from '../product-catalog/products/entities/product.entity';
import { StockMovement } from '../inventory/stock-movements/entities/stock-movement.entity';
import { InventoryAnalyticsController } from './inventory/controllers/inventory-analytics.controller';
import { InventoryAnalyticsService } from './inventory/services/inventory-analytics.service';

@Module({
    imports: [
        SalesAnalyticsModule,
        ShiftsAnalyticsModule,
        TypeOrmModule.forFeature([Product, StockMovement]),
    ],
    controllers: [InventoryAnalyticsController],
    providers:   [InventoryAnalyticsService],
})
export class AnalyticsModule {}

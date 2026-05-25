import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product-catalog/products/entities/product.entity';
import { StockMovement } from '../inventory/stock-movements/entities/stock-movement.entity';

import { SalesAnalyticsController } from './sales/sales-analytics.controller';
import { SalesAnalyticsService } from './sales/sales-analytics.service';

import { InventoryAnalyticsController } from './inventory/controllers/inventory-analytics.controller';
import { InventoryAnalyticsService } from './inventory/services/inventory-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, StockMovement])],
  controllers: [SalesAnalyticsController, InventoryAnalyticsController],
  providers: [SalesAnalyticsService, InventoryAnalyticsService],
})
export class AnalyticsModule {}

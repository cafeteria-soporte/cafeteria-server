import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemsService } from './services/order-items.service';
import { OrderItemsController } from './controllers/order-items.controller';
import { UserOrdersModule } from '../user-orders/user-orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem]), UserOrdersModule],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}

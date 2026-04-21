import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrder } from './entities/user-order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { OrderPayment } from '../order-payments/entities/order-payment.entity';
import { UserOrdersService } from './services/user-orders.service';
import { UserOrdersController } from './controllers/user-orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrder, OrderItem, OrderPayment])],
  controllers: [UserOrdersController],
  providers: [UserOrdersService],
  exports: [UserOrdersService],
})
export class UserOrdersModule {}

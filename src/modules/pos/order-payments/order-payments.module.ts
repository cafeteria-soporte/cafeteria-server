import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderPaymentsService } from './services/order-payments.service';
import { OrderPaymentsController } from './controllers/order-payments.controller';

import { UserOrdersModule } from '../user-orders/user-orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderPayment]), UserOrdersModule],
  controllers: [OrderPaymentsController],
  providers: [OrderPaymentsService],
  exports: [OrderPaymentsService],
})
export class OrderPaymentsModule {}

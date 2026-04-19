import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderPaymentsService } from './services/order-payments.service';
import { OrderPaymentsController } from './controllers/order-payments.controller';

@Module({
    imports: [TypeOrmModule.forFeature([OrderPayment])],
    controllers: [OrderPaymentsController],
    providers: [OrderPaymentsService],
    exports: [OrderPaymentsService],
})
export class OrderPaymentsModule {}

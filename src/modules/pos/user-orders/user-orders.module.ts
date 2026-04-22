import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrder } from './entities/user-order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { OrderPayment } from '../order-payments/entities/order-payment.entity';
import { UserOrdersService } from './services/user-orders.service';
import { UserOrdersController } from './controllers/user-orders.controller';
import { ShiftRecordsModule } from '../shift-records/shift-records.module';
import { OrderItemsModule } from '../order-items/order-items.module';
import { OrderPaymentsModule } from '../order-payments/order-payments.module';
import { StockMovementsModule } from 'src/modules/inventory/stock-movements/stock-movements.module';
import { StockMovementTypesModule } from 'src/modules/inventory/stock-movement-types/stock-movement-types.module';
import { GlobalSettingsModule } from 'src/modules/system-config/global-settings/global-settings.module';
import { ConfirmPaymentUseCase } from 'src/app/sales/use-cases/confirm-payment.use-case';
import { VoidOrderUseCase } from 'src/app/sales/use-cases/void-order.use-case';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserOrder, OrderItem, OrderPayment]),
        forwardRef(() => ShiftRecordsModule),
        forwardRef(() => OrderItemsModule),
        forwardRef(() => OrderPaymentsModule),
        StockMovementsModule,
        StockMovementTypesModule,
        GlobalSettingsModule,
    ],
    controllers: [UserOrdersController],
    providers:   [UserOrdersService, ConfirmPaymentUseCase, VoidOrderUseCase],
    exports:     [UserOrdersService],
})
export class UserOrdersModule {}

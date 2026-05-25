import { Module } from '@nestjs/common';
import { ConfirmPaymentUseCase } from './use-cases/confirm-payment.use-case';
import { VoidOrderUseCase } from './use-cases/void-order.use-case';
import { UserOrdersModule } from 'src/modules/pos/user-orders/user-orders.module';
import { OrderItemsModule } from 'src/modules/pos/order-items/order-items.module';
import { OrderPaymentsModule } from 'src/modules/pos/order-payments/order-payments.module';
import { StockMovementsModule } from 'src/modules/inventory/stock-movements/stock-movements.module';
import { StockMovementTypesModule } from 'src/modules/inventory/stock-movement-types/stock-movement-types.module';
import { GlobalSettingsModule } from 'src/modules/system-config/global-settings/global-settings.module';

@Module({
  imports: [
    UserOrdersModule,
    OrderItemsModule,
    OrderPaymentsModule,
    StockMovementsModule,
    StockMovementTypesModule,
    GlobalSettingsModule,
  ],
  providers: [ConfirmPaymentUseCase, VoidOrderUseCase],
  exports: [ConfirmPaymentUseCase, VoidOrderUseCase],
})
export class SalesModule {}

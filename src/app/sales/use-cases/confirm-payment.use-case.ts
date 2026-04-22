import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfirmPaymentDto } from '../dto/in/confirm-payment.dto';
import { UserOrderDto } from 'src/modules/pos/user-orders/dto/user-order.dto';
import { UserOrdersService } from 'src/modules/pos/user-orders/services/user-orders.service';
import { OrderItemsService } from 'src/modules/pos/order-items/services/order-items.service';
import { OrderPaymentsService } from 'src/modules/pos/order-payments/services/order-payments.service';
import { StockMovementsService } from 'src/modules/inventory/stock-movements/services/stock-movements.service';
import { StockMovementTypesService } from 'src/modules/inventory/stock-movement-types/services/stock-movement-types.service';
import { GlobalSettingsService } from 'src/modules/system-config/global-settings/services/global-settings.service';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@Injectable()
export class ConfirmPaymentUseCase {
    constructor(
        private readonly dataSource: DataSource,
        private readonly userOrdersService: UserOrdersService,
        private readonly orderItemsService: OrderItemsService,
        private readonly orderPaymentsService: OrderPaymentsService,
        private readonly stockMovementsService: StockMovementsService,
        private readonly stockMovementTypesService: StockMovementTypesService,
        private readonly globalSettingsService: GlobalSettingsService,
    ) {}

    async execute(orderId: number, dto: ConfirmPaymentDto, actingUser: AuthUser): Promise<UserOrderDto> {
        const order = await this.userOrdersService.findOne(orderId);

        if (order.status !== 'open') {
            throw new BadRequestException({
                message: `Cannot pay an order with status '${order.status}'.`,
                error: 'ORDER_NOT_OPEN',
            });
        }

        const orderTotal = Number(order.total);
        const paymentsTotal = dto.payments.reduce((sum, p) => sum + Number(p.amount), 0);

        if (Math.abs(paymentsTotal - orderTotal) > 0.01) {
            throw new BadRequestException({
                message: `Payment total (${paymentsTotal}) does not match order total (${orderTotal}).`,
                error: 'PAYMENT_TOTAL_MISMATCH',
            });
        }

        const items = await this.orderItemsService.findByOrder(orderId);
        if (items.length === 0) {
            throw new BadRequestException({ message: 'Cannot pay an empty order.', error: 'ORDER_EMPTY' });
        }

        const saleTypeId = await this.stockMovementTypesService.findIdByName('sale');

        await this.dataSource.transaction(async (manager) => {
            const receiptNumber = await this.globalSettingsService.incrementReceiptNumber(manager);

            for (const payment of dto.payments) {
                await this.orderPaymentsService.createTransactional(
                    orderId,
                    payment.paymentMethodId,
                    payment.amount,
                    payment.amountTendered ?? null,
                    manager,
                );
            }

            for (const item of items) {
                await this.stockMovementsService.create(
                    {
                        productId:      item.productId,
                        movementTypeId: saleTypeId,
                        quantity:       -item.quantity,
                        reason:         undefined,
                    },
                    actingUser.id,
                    { manager },
                );
            }

            await this.userOrdersService.markAsPaid(orderId, receiptNumber, { manager });
        });

        await this.userOrdersService.logPaid(orderId, order.receiptNumber ?? '', actingUser);

        return this.userOrdersService.findOne(orderId);
    }
}

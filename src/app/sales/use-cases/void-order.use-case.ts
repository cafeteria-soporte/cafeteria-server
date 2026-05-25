import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VoidOrderDto } from '../dto/in/void-order.dto';
import { UserOrderDto } from 'src/modules/pos/user-orders/dto/user-order.dto';
import { UserOrdersService } from 'src/modules/pos/user-orders/services/user-orders.service';
import { OrderItemsService } from 'src/modules/pos/order-items/services/order-items.service';
import { StockMovementsService } from 'src/modules/inventory/stock-movements/services/stock-movements.service';
import { StockMovementTypesService } from 'src/modules/inventory/stock-movement-types/services/stock-movement-types.service';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@Injectable()
export class VoidOrderUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userOrdersService: UserOrdersService,
    private readonly orderItemsService: OrderItemsService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly stockMovementTypesService: StockMovementTypesService,
  ) {}

  async execute(
    orderId: number,
    dto: VoidOrderDto,
    actingUser: AuthUser,
  ): Promise<UserOrderDto> {
    const order = await this.userOrdersService.findOne(orderId);

    if (order.status === 'voided') {
      throw new BadRequestException({
        message: 'Order is already voided.',
        error: 'ORDER_ALREADY_VOIDED',
      });
    }

    if (order.status === 'open') {
      throw new BadRequestException({
        message: 'Cannot void an open order. Remove it instead.',
        error: 'ORDER_NOT_PAID',
      });
    }

    const items = await this.orderItemsService.findByOrder(orderId);
    const saleVoidTypeId =
      await this.stockMovementTypesService.findIdByName('sale_void');

    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        await this.stockMovementsService.create(
          {
            productId: item.productId,
            movementTypeId: saleVoidTypeId,
            quantity: item.quantity,
            reason: `Void order #${orderId}: ${dto.reason}`,
          },
          actingUser.id,
          { manager },
        );
      }

      await this.userOrdersService.markAsVoided(
        orderId,
        dto.reason,
        actingUser.id,
        { manager },
      );
    });

    await this.userOrdersService.logVoid(
      orderId,
      dto.reason,
      order.status,
      actingUser,
    );

    return this.userOrdersService.findOne(orderId);
  }
}

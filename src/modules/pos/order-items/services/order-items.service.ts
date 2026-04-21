import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';
import { OrderItem } from '../entities/order-item.entity';
import { OrderItemDto } from '../dto/order-item.dto';
import { CreateOrderItemDto } from '../dto/in/create-order-item.dto';
import { OrderItemNotFoundException } from '../exceptions';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import {
  AuditAction,
  AuditModule,
} from 'src/modules/system-config/audit-log/enums';
import { UserOrdersService } from '../../user-orders/services/user-orders.service';

@Injectable()
export class OrderItemsService {
  private readonly repo: DtoRepository<OrderItem>;
  private readonly rawRepo: Repository<OrderItem>;

  constructor(
    @InjectRepository(OrderItem) rawRepo: Repository<OrderItem>,
    private readonly auditLog: AuditLogService,
    private readonly userOrdersService: UserOrdersService,
  ) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async findByOrder(userOrderId: number): Promise<OrderItemDto[]> {
    return this.repo.find({
      dto: OrderItemDto,
      where: { userOrderId },
    });
  }

  async create(
    userOrderId: number,
    dto: CreateOrderItemDto,
    currentUser: AuthUser,
  ): Promise<OrderItemDto[]> {
    const subtotal = dto.quantity * dto.unitPrice;

    const item = this.rawRepo.create({
      userOrderId,
      productId: dto.productId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      subtotal,
    });

    await this.rawRepo.save(item);
    await this.userOrdersService.recalculateTotal(userOrderId);

    await this.auditLog.create({
      action: AuditAction.ORDER_ITEM_ADDED,
      module: AuditModule.ORDERS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: currentUser.roleId.toString(),
      affectedEntity: 'OrderItem',
      entityId: userOrderId,
      previousValue: null,
      newValue: JSON.stringify({
        productId: dto.productId,
        quantity: dto.quantity,
      }),
    });

    return this.findByOrder(userOrderId);
  }

  async remove(
    userOrderId: number,
    productId: number,
    currentUser: AuthUser,
  ): Promise<void> {
    const item = await this.repo.findOne({
      dto: OrderItemDto,
      where: { userOrderId, productId },
    });

    if (!item) throw new OrderItemNotFoundException();

    await this.rawRepo.delete({ userOrderId, productId });

    await this.userOrdersService.recalculateTotal(userOrderId);

    await this.auditLog.create({
      action: AuditAction.ORDER_ITEM_REMOVED,
      module: AuditModule.ORDERS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: currentUser.roleId.toString(),
      affectedEntity: 'OrderItem',
      entityId: userOrderId,
      previousValue: JSON.stringify({ productId, quantity: item.quantity }),
      newValue: null,
    });
  }
}

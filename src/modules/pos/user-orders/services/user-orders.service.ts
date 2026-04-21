import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DtoRepository,
  PaginationParamsDto,
  PaginationResponseDto,
} from 'src/shared';
import { UserOrder } from '../entities/user-order.entity';
import { UserOrderDto } from '../dto/user-order.dto';
import { CreateUserOrderDto } from '../dto/in/create-user-order.dto';
import { UpdateUserOrderDto } from '../dto/in/update-user-order.dto';
import { UserOrderNotFoundException } from '../exceptions/user-order-not-found.exception';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@Injectable()
export class UserOrdersService {
  private readonly repo: DtoRepository<UserOrder>;

  constructor(
    @InjectRepository(UserOrder)
    private readonly rawRepo: Repository<UserOrder>,
    private readonly auditLog: AuditLogService,
  ) {
    this.repo = new DtoRepository(rawRepo);
  }

  async findAll(
    pagination: PaginationParamsDto,
  ): Promise<PaginationResponseDto<UserOrderDto>> {
    return this.repo.findPaginated({
      dto: UserOrderDto,
      pagination,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserOrderDto> {
    const order = await this.repo.findOne({ dto: UserOrderDto, where: { id } });
    if (!order) throw new UserOrderNotFoundException();
    return order;
  }

  async create(
    data: CreateUserOrderDto,
    currentUser: AuthUser,
  ): Promise<UserOrderDto> {
    const order = new UserOrder();
    order.shiftRecordId = data.shiftRecordId;
    order.receiptNumber = data.receiptNumber;
    order.total = 0;
    order.cashierId = currentUser.id;
    order.status = 'open';

    const saved = await this.rawRepo.save(order);

    await this.auditLog.create({
      action: AuditAction.SALE_PAID,
      module: AuditModule.ORDERS,
      userId: currentUser.id,
      affectedEntity: 'user_orders',
      entityId: saved.id,
      newValue: JSON.stringify(saved),
    });

    return this.findOne(saved.id);
  }

  async update(
    id: number,
    data: UpdateUserOrderDto,
    currentUser: AuthUser,
  ): Promise<UserOrderDto> {
    const previousValue = await this.findOne(id);

    await this.rawRepo.update(id, data);

    await this.auditLog.create({
      action:
        data.status === 'voided'
          ? AuditAction.SALE_VOIDED
          : AuditAction.SALE_PAID,
      module: AuditModule.ORDERS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      affectedEntity: 'user_orders',
      entityId: id,
      previousValue: JSON.stringify(previousValue),
      newValue: JSON.stringify(data),
    });

    return this.findOne(id);
  }

  async voidOrder(
    id: number,
    voidReason: string,
    currentUser: AuthUser,
  ): Promise<UserOrderDto> {
    const order = await this.findOne(id);

    if (order.status === 'voided') {
      return order;
    }

    const previousValue = JSON.stringify(order);

    await this.rawRepo.update(id, {
      status: 'voided',
      voidReason: voidReason,
      voidedBy: currentUser.id,
    });

    await this.auditLog.create({
      action: AuditAction.SALE_VOIDED,
      module: AuditModule.ORDERS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      affectedEntity: 'user_orders',
      entityId: id,
      previousValue: previousValue,
      newValue: JSON.stringify({ status: 'voided', voidReason }),
    });

    return this.findOne(id);
  }

  async getTotalByShift(shiftRecordId: number): Promise<number> {
    const result = await this.rawRepo.sum('total', {
      shiftRecordId,
      status: 'open',
    });
    return result ?? 0;
  }

  async recalculateTotal(userOrderId: number): Promise<void> {
    const result = await this.rawRepo
      .createQueryBuilder('o')
      .leftJoin('o.items', 'i')
      .select('COALESCE(SUM(i.subtotal), 0)', 'total')
      .where('o.id = :userOrderId', { userOrderId })
      .getRawOne<{ total: string }>();

    const total = Number(result?.total ?? 0);
    await this.rawRepo.update(userOrderId, { total });
  }
}

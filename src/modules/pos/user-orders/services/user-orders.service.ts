import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  DtoRepository,
  MutationOptions,
  PaginationParamsDto,
  PaginationResponseDto,
} from 'src/shared';
import { UserOrder } from '../entities/user-order.entity';
import { UserOrderDto } from '../dto/user-order.dto';
import { CreateUserOrderDto } from '../dto/in/create-user-order.dto';
import { UserOrderNotFoundException } from '../exceptions/user-order-not-found.exception';
import { NoOpenShiftException } from '../exceptions/no-open-shift.exception';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';
import { ShiftRecordsService } from 'src/modules/pos/shift-records/services/shift-records.service';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

const ROLE_NAMES: Record<number, string> = {
  1: 'root',
  2: 'administrator',
  3: 'cashier',
};

@Injectable()
export class UserOrdersService {
  private readonly repo: DtoRepository<UserOrder>;

  constructor(
    @InjectRepository(UserOrder)
    private readonly rawRepo: Repository<UserOrder>,
    private readonly auditLog: AuditLogService,
    @Inject(forwardRef(() => ShiftRecordsService))
    private readonly shiftRecordsService: ShiftRecordsService,
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

  async findOneRaw(id: number, manager?: EntityManager): Promise<UserOrder> {
    const mgr = manager ?? this.rawRepo.manager;
    const order = await mgr.findOne(UserOrder, { where: { id } });
    if (!order) throw new UserOrderNotFoundException();
    return order;
  }

  async create(
    data: CreateUserOrderDto,
    currentUser: AuthUser,
  ): Promise<UserOrderDto> {
    const openShift = await this.shiftRecordsService.findOpenShiftById(
      data.shiftRecordId,
      currentUser.id,
    );
    if (!openShift) throw new NoOpenShiftException();

    const order = this.rawRepo.create({
      shiftRecordId: data.shiftRecordId,
      cashierId: currentUser.id,
      total: 0,
      status: 'open',
    });
    const saved = await this.rawRepo.save(order);

    return this.findOne(saved.id);
  }

  async markAsPaid(
    id: number,
    receiptNumber: string,
    options?: MutationOptions,
  ): Promise<void> {
    const manager = options?.manager ?? this.rawRepo.manager;
    await manager.update(UserOrder, id, { status: 'paid', receiptNumber });
  }

  async markAsVoided(
    id: number,
    voidReason: string,
    voidedBy: number,
    options?: MutationOptions,
  ): Promise<void> {
    const manager = options?.manager ?? this.rawRepo.manager;
    await manager.update(UserOrder, id, {
      status: 'voided',
      voidReason,
      voidedBy,
    });
  }

  async recalculateTotal(
    userOrderId: number,
    options?: MutationOptions,
  ): Promise<void> {
    const manager = options?.manager ?? this.rawRepo.manager;
    const result = await manager
      .createQueryBuilder(UserOrder, 'o')
      .leftJoin('o.items', 'i')
      .select('COALESCE(SUM(i.subtotal), 0)', 'total')
      .where('o.id = :userOrderId', { userOrderId })
      .getRawOne<{ total: string }>();

    const total = Number(result?.total ?? 0);
    await manager.update(UserOrder, userOrderId, { total });
  }

  async logVoid(
    id: number,
    voidReason: string,
    previousStatus: string,
    actingUser: AuthUser,
  ): Promise<void> {
    await this.auditLog.create({
      action: AuditAction.SALE_VOIDED,
      module: AuditModule.ORDERS,
      userId: actingUser.id,
      usernameSnapshot: actingUser.username,
      roleSnapshot: ROLE_NAMES[actingUser.roleId],
      affectedEntity: 'user_orders',
      entityId: id,
      previousValue: previousStatus,
      newValue: JSON.stringify({ status: 'voided', voidReason }),
    });
  }

  async logPaid(
    id: number,
    receiptNumber: string,
    actingUser: AuthUser,
  ): Promise<void> {
    await this.auditLog.create({
      action: AuditAction.SALE_PAID,
      module: AuditModule.ORDERS,
      userId: actingUser.id,
      usernameSnapshot: actingUser.username,
      roleSnapshot: ROLE_NAMES[actingUser.roleId],
      affectedEntity: 'user_orders',
      entityId: id,
      newValue: receiptNumber,
    });
  }
}

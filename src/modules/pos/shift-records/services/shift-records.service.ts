import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { DtoRepository, FindOptions, PaginationResponseDto } from 'src/shared';
import { ShiftRecord } from '../entities/shift-record.entity';
import { OpenShiftDto } from '../dto/in/open-shift.dto';
import { CloseShiftDto } from '../dto/in/close-shift.dto';
import { ShiftRecordDto } from '../dto/shift-record.dto';
import {
  ShiftAlreadyOpenException,
  ShiftNotFoundException,
} from '../exceptions';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import {
  AuditAction,
  AuditModule,
} from 'src/modules/system-config/audit-log/enums';
import { AuthUser } from 'src/app/auth/strategies/jwt.strategy';
import { UserOrdersService } from 'src/modules/pos/user-orders/services/user-orders.service';
import { GlobalSettingsService } from 'src/modules/system-config/global-settings/services/global-settings.service';
import { FindShiftRecordsDto } from '../dto/in/find-shift-records.dto';
import { FindAllShiftRecordsResponseDto } from '../dto/out/find-all-shift-records-response.dto';

const ROLE_NAMES: Record<number, string> = {
  1: 'root',
  2: 'administrator',
  3: 'cashier',
};

@Injectable()
export class ShiftRecordsService {
  private readonly repo: DtoRepository<ShiftRecord>;
  private readonly rawRepo: Repository<ShiftRecord>;

  constructor(
    @InjectRepository(ShiftRecord) rawRepo: Repository<ShiftRecord>,
    private readonly auditLog: AuditLogService,
    @Inject(forwardRef(() => UserOrdersService))
    private readonly userOrdersService: UserOrdersService,
    private readonly globalSettingsService: GlobalSettingsService,
  ) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async findAll(
    params: FindShiftRecordsDto,
  ): Promise<FindAllShiftRecordsResponseDto> {
    const where: Record<string, any> = {};
    if (params.cashierId !== undefined) where['cashierId'] = params.cashierId;
    if (params.status !== undefined) where['status'] = params.status;
    if (params.from && params.to)
      where['openedAt'] = Between(new Date(params.from), new Date(params.to));
    else if (params.from)
      where['openedAt'] = MoreThanOrEqual(new Date(params.from));
    else if (params.to)
      where['openedAt'] = LessThanOrEqual(new Date(params.to));

    return this.repo.findPaginated({
      dto: ShiftRecordDto,
      pagination: params,
      where,
      order: { openedAt: 'DESC' },
    }) as Promise<FindAllShiftRecordsResponseDto>;
  }

  async findOne<T = ShiftRecordDto>(
    id: number,
    options: FindOptions<T> = {
      dto: ShiftRecordDto as any,
      throwException: true,
    },
  ): Promise<T | null> {
    const result = await this.repo.findOne({ dto: options.dto, where: { id } });
    if (!result && options.throwException !== false)
      throw new ShiftNotFoundException();
    return result;
  }

  async findMyCurrent(cashierId: number): Promise<ShiftRecordDto | null> {
    return this.repo.findOne({
      dto: ShiftRecordDto,
      where: { cashierId, status: 'open' },
    });
  }

  async findOpenShiftById(
    shiftId: number,
    cashierId: number,
  ): Promise<ShiftRecordDto | null> {
    return this.repo.findOne({
      dto: ShiftRecordDto,
      where: { id: shiftId, cashierId, status: 'open' },
    });
  }

  async findAllMine(
    cashierId: number,
    params: FindShiftRecordsDto,
  ): Promise<FindAllShiftRecordsResponseDto> {
    const where: Record<string, any> = { cashierId };
    if (params.status !== undefined) where['status'] = params.status;
    if (params.from && params.to)
      where['openedAt'] = Between(new Date(params.from), new Date(params.to));
    else if (params.from)
      where['openedAt'] = MoreThanOrEqual(new Date(params.from));
    else if (params.to)
      where['openedAt'] = LessThanOrEqual(new Date(params.to));

    return this.repo.findPaginated({
      dto: ShiftRecordDto,
      pagination: params,
      where,
      order: { openedAt: 'DESC' },
    }) as Promise<FindAllShiftRecordsResponseDto>;
  }

  async openShift(
    currentUser: AuthUser,
    dto: OpenShiftDto,
  ): Promise<ShiftRecordDto> {
    const activeShift = await this.repo.findOne({
      dto: ShiftRecordDto,
      where: { cashierId: currentUser.id, status: 'open' },
    });

    if (activeShift) throw new ShiftAlreadyOpenException();

    const newShift = this.rawRepo.create({
      cashierId: currentUser.id,
      initialFund: dto.initialFund,
      status: 'open',
    });

    await this.rawRepo.save(newShift);

    await this.auditLog.create({
      action: AuditAction.SHIFT_OPENED,
      module: AuditModule.SHIFTS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: ROLE_NAMES[currentUser.roleId],
      affectedEntity: 'ShiftRecord',
      entityId: newShift.id,
      previousValue: null,
      newValue: dto.initialFund.toString(),
    });

    const result = await this.repo.findOne({
      dto: ShiftRecordDto,
      where: { id: newShift.id },
    });

    if (!result) throw new ShiftNotFoundException();

    return result;
  }

  async closeShift(
    currentUser: AuthUser,
    dto: CloseShiftDto,
  ): Promise<{ message: string; discrepancyAlert: boolean }> {
    const activeShift = await this.rawRepo.findOne({
      where: { cashierId: currentUser.id, status: 'open' },
    });

    if (!activeShift) throw new ShiftNotFoundException();

    const cashSales = await this.getCashTotalByShift(activeShift.id);
    const threshold = await this.globalSettingsService.findValueByKey(
      'cash_discrepancy_threshold',
    );
    const discrepancyThreshold = parseFloat(threshold ?? '5');
    const expectedAmount = Number(activeShift.initialFund) + cashSales;
    const declaredAmount = Number(dto.declaredAmount);
    const discrepancy = declaredAmount - expectedAmount;
    const discrepancyAlert = Math.abs(discrepancy) > discrepancyThreshold;

    await this.rawRepo.update(activeShift.id, {
      declaredAmount,
      expectedAmount,
      discrepancy,
      discrepancyAlert,
      status: 'closed',
      closedAt: new Date(),
    });

    await this.auditLog.create({
      action: AuditAction.SHIFT_CLOSED,
      module: AuditModule.SHIFTS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: ROLE_NAMES[currentUser.roleId],
      affectedEntity: 'ShiftRecord',
      entityId: activeShift.id,
      previousValue: 'open',
      newValue: JSON.stringify({
        declaredAmount,
        expectedAmount,
        discrepancy,
        discrepancyAlert,
      }),
    });

    return { message: 'Turno cerrado correctamente.', discrepancyAlert };
  }

  private async getCashTotalByShift(shiftRecordId: number): Promise<number> {
    const [{ total }] = await this.rawRepo.manager.query<[{ total: string }]>(
      `SELECT COALESCE(SUM(op.amount), 0) AS total
       FROM order_payments op
       JOIN user_orders uo ON uo.user_order_id = op.user_order_id
       JOIN payment_methods pm ON pm.payment_method_id = op.payment_method_id
       WHERE uo.shift_record_id = $1
         AND uo.status = 'paid'
         AND pm.name = 'cash'`,
      [shiftRecordId],
    );
    return Number(total);
  }
}

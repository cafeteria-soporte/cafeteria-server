import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
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

@Injectable()
export class ShiftRecordsService {
  private readonly repo: DtoRepository<ShiftRecord>;
  private readonly rawRepo: Repository<ShiftRecord>;
  private readonly DISCREPANCY_THRESHOLD = 5;

  constructor(
    @InjectRepository(ShiftRecord) rawRepo: Repository<ShiftRecord>,
    private readonly auditLog: AuditLogService,
  ) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
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
      roleSnapshot: currentUser.roleId.toString(),
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

    // TODO: reemplazar con initialFund + total de ventas del turno
    // cuando UserOrdersModule esté implementado
    const expectedAmount = Number(activeShift.initialFund);
    const declaredAmount = Number(dto.declaredAmount);
    const discrepancy = declaredAmount - expectedAmount;
    const discrepancyAlert = Math.abs(discrepancy) > this.DISCREPANCY_THRESHOLD;

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
      roleSnapshot: currentUser.roleId.toString(),
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
}

// falta implementar el modulo de ventas para tener los valores verdaderos de las ventas del turno

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

@Injectable()
export class ShiftRecordsService {
  private readonly repo: DtoRepository<ShiftRecord>;
  private readonly rawRepo: Repository<ShiftRecord>;
  private readonly DISCREPANCY_THRESHOLD = 5;

  constructor(@InjectRepository(ShiftRecord) rawRepo: Repository<ShiftRecord>) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async openShift(userId: number, dto: OpenShiftDto): Promise<ShiftRecordDto> {
    const activeShift = await this.repo.findOne({
      dto: ShiftRecordDto,
      where: { cashierId: userId, status: 'open' },
    });

    if (activeShift) throw new ShiftAlreadyOpenException();

    const newShift = this.rawRepo.create({
      cashierId: userId,
      initialFund: dto.initialFund,
      status: 'open',
    });

    await this.rawRepo.save(newShift);

    const result = await this.repo.findOne({
      dto: ShiftRecordDto,
      where: { id: newShift.id },
    });

    if (!result) throw new ShiftNotFoundException();

    return result;
  }

  async closeShift(
    userId: number,
    dto: CloseShiftDto,
  ): Promise<{ message: string; discrepancyAlert: boolean }> {
    const activeShift = await this.rawRepo.findOne({
      where: { cashierId: userId, status: 'open' },
    });

    if (!activeShift) throw new ShiftNotFoundException();

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

    return {
      message: 'Turno cerrado correctamente.',
      discrepancyAlert,
    };
  }
}

// falta implementar el modulo de ventas para tener los valores verdaderos de las ventas del turno

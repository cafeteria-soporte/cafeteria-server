import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { DtoRepository } from 'src/shared';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogDto } from '../dto/audit-log.dto';
import { CreateAuditLogDto } from '../dto/in/create-audit-log.dto';
import { FindAuditLogsDto } from '../dto/in/find-audit-logs.dto';
import { FindAllAuditLogsResponseDto } from '../dto/out/find-all-audit-logs-response.dto';

@Injectable()
export class AuditLogService {
  private readonly repo: DtoRepository<AuditLog>;

  constructor(
    @InjectRepository(AuditLog)
    private readonly rawRepo: Repository<AuditLog>,
  ) {
    this.repo = new DtoRepository(rawRepo);
  }

  async findAll(
    params: FindAuditLogsDto,
  ): Promise<FindAllAuditLogsResponseDto> {
    const where: Record<string, any> = {};

    if (params.action) where['action'] = ILike(`%${params.action}%`);
    if (params.module) where['module'] = ILike(`%${params.module}%`);
    if (params.userId) where['userId'] = params.userId;
    if (params.username)
      where['usernameSnapshot'] = ILike(`%${params.username}%`);

    if (params.from && params.to) {
      where['createdAt'] = Between(new Date(params.from), new Date(params.to));
    } else if (params.from) {
      where['createdAt'] = MoreThanOrEqual(new Date(params.from));
    } else if (params.to) {
      where['createdAt'] = LessThanOrEqual(new Date(params.to));
    }

    return await this.repo.findPaginated({
      where: where,
      order: {
        createdAt: 'DESC',
      },
      dto: AuditLogDto,
      pagination: params,
    });
  }

  async create(data: CreateAuditLogDto): Promise<void> {
    const log = this.rawRepo.create({
      userId: data.userId ?? null,
      usernameSnapshot: data.usernameSnapshot ?? null,
      roleSnapshot: data.roleSnapshot ?? null,
      action: data.action,
      module: data.module,
      affectedEntity: data.affectedEntity ?? null,
      entityId: data.entityId ?? null,
      previousValue: data.previousValue ?? null,
      newValue: data.newValue ?? null,
      ip: data.ip ?? null,
      device: data.device ?? null,
    });

    await this.rawRepo.save(log);
  }
}

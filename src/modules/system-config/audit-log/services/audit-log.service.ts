import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
    private readonly repo: DtoRepository<AuditLog>;

    constructor(
        @InjectRepository(AuditLog)
        private readonly rawRepo: Repository<AuditLog>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

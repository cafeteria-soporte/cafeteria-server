import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { ShiftRecord } from '../entities/shift-record.entity';

@Injectable()
export class ShiftRecordsService {
    private readonly repo: DtoRepository<ShiftRecord>;

    constructor(
        @InjectRepository(ShiftRecord)
        private readonly rawRepo: Repository<ShiftRecord>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

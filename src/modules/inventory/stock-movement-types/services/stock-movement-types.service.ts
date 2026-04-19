import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { StockMovementType } from '../entities/stock-movement-type.entity';

@Injectable()
export class StockMovementTypesService {
    private readonly repo: DtoRepository<StockMovementType>;

    constructor(
        @InjectRepository(StockMovementType)
        private readonly rawRepo: Repository<StockMovementType>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

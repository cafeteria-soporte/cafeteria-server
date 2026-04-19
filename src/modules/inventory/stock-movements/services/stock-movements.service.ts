import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { StockMovement } from '../entities/stock-movement.entity';

@Injectable()
export class StockMovementsService {
    private readonly repo: DtoRepository<StockMovement>;

    constructor(
        @InjectRepository(StockMovement)
        private readonly rawRepo: Repository<StockMovement>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

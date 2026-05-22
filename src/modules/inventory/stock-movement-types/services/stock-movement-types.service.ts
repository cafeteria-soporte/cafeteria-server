import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { DtoRepository, FindOptions } from 'src/shared';
import { StockMovementType } from '../entities/stock-movement-type.entity';
import { StockMovementTypeDto } from '../dto/stock-movement-type.dto';
import { FindStockMovementTypesDto } from '../dto/in/find-stock-movement-types.dto';
import { FindAllStockMovementTypesResponseDto } from '../dto/out/find-all-stock-movement-types-response.dto';
import { StockMovementTypeNotFoundException } from '../exceptions';

@Injectable()
export class StockMovementTypesService {
    private readonly repo: DtoRepository<StockMovementType>;

    constructor(
        @InjectRepository(StockMovementType)
        rawRepo: Repository<StockMovementType>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(params: FindStockMovementTypesDto): Promise<FindAllStockMovementTypesResponseDto> {
        const where: Record<string, any> = {};
        if (params.name !== undefined) where['name'] = ILike(`%${params.name}%`);

        return this.repo.findPaginated({
            dto:        StockMovementTypeDto,
            pagination: params,
            where,
            order:      { id: 'ASC' },
        }) as Promise<FindAllStockMovementTypesResponseDto>;
    }

    async findOne<T = StockMovementTypeDto>(id: number, options: FindOptions<T> = { dto: StockMovementTypeDto as any, throwException: true }): Promise<T | null> {
        const result = await this.repo.findOne({ dto: options.dto, where: { id } });
        if (!result && options.throwException !== false) throw new StockMovementTypeNotFoundException();
        return result;
    }

    async findIdByName(name: string): Promise<number> {
        const result = await this.repo.findOne({ dto: StockMovementTypeDto, where: { name } });
        if (!result) throw new StockMovementTypeNotFoundException();
        return result.id;
    }
}

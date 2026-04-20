import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { DtoRepository, MutationOptions, PaginationResponseDto } from 'src/shared';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockMovementDto } from '../dto/stock-movement.dto';
import { CreateStockMovementDto } from '../dto/in/create-stock-movement.dto';
import { FindStockMovementsDto } from '../dto/in/find-stock-movements.dto';
import { StockMovementNotFoundException } from '../exceptions';
import { ProductsService } from 'src/modules/product-catalog/products/services/products.service';

@Injectable()
export class StockMovementsService {
    private readonly repo: DtoRepository<StockMovement>;

    constructor(
        @InjectRepository(StockMovement)
        private readonly rawRepo: Repository<StockMovement>,
        private readonly productsService: ProductsService,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(params: FindStockMovementsDto): Promise<PaginationResponseDto<StockMovementDto>> {
        return this.repo.findPaginated({
            dto: StockMovementDto,
            pagination: params,
            where: {
                ...(params.productId && { productId: params.productId }),
                ...(params.movementTypeId && { movementTypeId: params.movementTypeId }),
                ...this.buildDateFilter(params.from, params.to),
            },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number): Promise<StockMovementDto> {
        const movement = await this.repo.findOne({ dto: StockMovementDto, where: { id } });
        if (!movement) throw new StockMovementNotFoundException();
        return movement;
    }

    async findByProduct(productId: number, params: FindStockMovementsDto): Promise<PaginationResponseDto<StockMovementDto>> {
        return this.repo.findPaginated({
            dto: StockMovementDto,
            pagination: params,
            where: {
                productId,
                ...(params.movementTypeId && { movementTypeId: params.movementTypeId }),
                ...this.buildDateFilter(params.from, params.to),
            },
            order: { createdAt: 'DESC' },
        });
    }

    async create(data: CreateStockMovementDto, userId: number, options?: MutationOptions): Promise<void> {
        const manager = options?.manager ?? this.rawRepo.manager;
        const stockBefore = await this.productsService.findCurrentStock(data.productId, options);
        const stockAfter = stockBefore + data.quantity;

        const movement = manager.create(StockMovement, {
            productId: data.productId,
            movementTypeId: data.movementTypeId,
            userId,
            quantity: data.quantity,
            stockBefore,
            stockAfter,
            reason: data.reason ?? null,
        });

        await manager.save(StockMovement, movement);
    }

    private buildDateFilter(from?: string, to?: string) {
        if (from && to) return { createdAt: Between(new Date(from), new Date(to)) };
        if (from) return { createdAt: MoreThanOrEqual(new Date(from)) };
        if (to) return { createdAt: LessThanOrEqual(new Date(to)) };
        return {};
    }
}

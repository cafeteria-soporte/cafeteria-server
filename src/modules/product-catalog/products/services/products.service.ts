import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository, MutationOptions } from 'src/shared';
import { Product } from '../entities/product.entity';
import { ProductNotFoundException } from '../exceptions';

@Injectable()
export class ProductsService {
    private readonly repo: DtoRepository<Product>;

    constructor(
        @InjectRepository(Product)
        private readonly rawRepo: Repository<Product>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findCurrentStock(productId: number, options?: MutationOptions): Promise<number> {
        const manager = options?.manager ?? this.rawRepo.manager;
        const product = await manager.findOne(Product, {
            where: { id: productId },
            select: { id: true, currentStock: true },
        });
        if (!product) throw new ProductNotFoundException();
        return product.currentStock;
    }
}

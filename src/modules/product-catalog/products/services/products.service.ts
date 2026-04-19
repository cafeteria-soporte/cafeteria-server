import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
    private readonly repo: DtoRepository<Product>;

    constructor(
        @InjectRepository(Product)
        private readonly rawRepo: Repository<Product>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

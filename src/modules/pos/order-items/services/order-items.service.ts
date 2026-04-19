import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrderItemsService {
    private readonly repo: DtoRepository<OrderItem>;

    constructor(
        @InjectRepository(OrderItem)
        private readonly rawRepo: Repository<OrderItem>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

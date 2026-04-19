import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { OrderPayment } from '../entities/order-payment.entity';

@Injectable()
export class OrderPaymentsService {
    private readonly repo: DtoRepository<OrderPayment>;

    constructor(
        @InjectRepository(OrderPayment)
        private readonly rawRepo: Repository<OrderPayment>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

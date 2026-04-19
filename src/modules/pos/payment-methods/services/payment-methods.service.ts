import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodsService {
    private readonly repo: DtoRepository<PaymentMethod>;

    constructor(
        @InjectRepository(PaymentMethod)
        private readonly rawRepo: Repository<PaymentMethod>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

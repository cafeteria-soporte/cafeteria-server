import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { UserOrder } from '../entities/user-order.entity';

@Injectable()
export class UserOrdersService {
    private readonly repo: DtoRepository<UserOrder>;

    constructor(
        @InjectRepository(UserOrder)
        private readonly rawRepo: Repository<UserOrder>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

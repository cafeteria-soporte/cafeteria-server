import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { PaymentMethodNotFoundException } from '../exceptions';

@Injectable()
export class PaymentMethodsService {
  private readonly repo: DtoRepository<PaymentMethod>;

  constructor(
    @InjectRepository(PaymentMethod) rawRepo: Repository<PaymentMethod>,
  ) {
    this.repo = new DtoRepository(rawRepo);
  }

  async findAll(): Promise<PaymentMethodDto[]> {
    return this.repo.find({
      dto: PaymentMethodDto,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PaymentMethodDto> {
    const method = await this.repo.findOne({
      dto: PaymentMethodDto,
      where: { id },
    });
    if (!method) throw new PaymentMethodNotFoundException();
    return method;
  }
}

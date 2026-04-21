import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';
import { OrderPayment } from '../entities/order-payment.entity';
import { OrderPaymentDto } from '../dto/order-payment.dto';
import { CreateOrderPaymentDto } from '../dto/in/create-order-payment.dto';
import { OrderPaymentNotFoundException } from '../exceptions';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import {
  AuditAction,
  AuditModule,
} from 'src/modules/system-config/audit-log/enums';
import { UserOrdersService } from 'src/modules/pos/user-orders/services/user-orders.service';

@Injectable()
export class OrderPaymentsService {
  private readonly repo: DtoRepository<OrderPayment>;
  private readonly rawRepo: Repository<OrderPayment>;

  constructor(
    @InjectRepository(OrderPayment) rawRepo: Repository<OrderPayment>,
    private readonly auditLog: AuditLogService,
    private readonly userOrdersService: UserOrdersService,
  ) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async findByOrder(userOrderId: number): Promise<OrderPaymentDto[]> {
    return this.repo.find({
      dto: OrderPaymentDto,
      where: { userOrderId },
    });
  }

  async findOne(id: number): Promise<OrderPaymentDto> {
    const payment = await this.repo.findOne({
      dto: OrderPaymentDto,
      where: { id },
    });
    if (!payment) throw new OrderPaymentNotFoundException();
    return payment;
  }

  async create(
    userOrderId: number,
    dto: CreateOrderPaymentDto,
    currentUser: AuthUser,
  ): Promise<OrderPaymentDto[]> {
    const order = await this.userOrdersService.findOne(userOrderId);
    const amount = Number(order.total);

    const newPayment = new OrderPayment();
    newPayment.userOrderId = userOrderId;
    newPayment.paymentMethodId = dto.paymentMethodId;
    newPayment.amount = amount;
    newPayment.amountTendered = dto.amountTendered ?? null;

    await this.rawRepo.save(newPayment);

    await this.auditLog.create({
      action: AuditAction.ORDER_PAYMENT_ADDED,
      module: AuditModule.PAYMENTS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: currentUser.roleId.toString(),
      affectedEntity: 'OrderPayment',
      entityId: userOrderId,
      previousValue: null,
      newValue: JSON.stringify({
        paymentMethodId: dto.paymentMethodId,
        amount,
      }),
    });

    return this.findByOrder(userOrderId);
  }
}

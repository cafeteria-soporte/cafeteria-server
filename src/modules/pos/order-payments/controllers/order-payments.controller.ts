import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderPaymentsService } from '../services/order-payments.service';

@ApiTags('Order Payments')
@Controller('order-payments')
export class OrderPaymentsController {
    constructor(private readonly service: OrderPaymentsService) {}
}

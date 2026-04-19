import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from '../services/payment-methods.service';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
    constructor(private readonly service: PaymentMethodsService) {}
}

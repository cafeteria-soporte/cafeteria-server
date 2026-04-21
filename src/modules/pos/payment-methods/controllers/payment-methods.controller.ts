import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { PaymentMethodDto } from '../dto/payment-method.dto';
import { CashierUp } from 'src/app/auth/decorators';

@ApiTags('POS - Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar métodos de pago' })
  @ApiOkResponse({ type: PaymentMethodDto, isArray: true })
  findAll() {
    return this.paymentMethodsService.findAll();
  }

  @Get(':id')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener método de pago por ID' })
  @ApiOkResponse({ type: PaymentMethodDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodsService.findOne(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { OrderPaymentsService } from '../services/order-payments.service';
import { CreateOrderPaymentDto } from '../dto/in/create-order-payment.dto';
import { OrderPaymentDto } from '../dto/order-payment.dto';
import { CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('POS - Order Payments')
@Controller('user-orders/:orderId/payments')
export class OrderPaymentsController {
  constructor(private readonly orderPaymentsService: OrderPaymentsService) {}

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar pagos de una orden' })
  @ApiOkResponse({ type: OrderPaymentDto, isArray: true })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderPaymentsService.findByOrder(orderId);
  }

  @Post()
  @CashierUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar pago a una orden' })
  @ApiCreatedResponse({ type: OrderPaymentDto, isArray: true })
  create(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: CreateOrderPaymentDto,
  ) {
    return this.orderPaymentsService.create(orderId, dto, currentUser);
  }
}

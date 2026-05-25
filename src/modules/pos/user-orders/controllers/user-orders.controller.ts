import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { UserOrdersService } from '../services/user-orders.service';
import { UserOrderDto } from '../dto/user-order.dto';
import { CreateUserOrderDto } from '../dto/in/create-user-order.dto';
import { AdministratorUp, CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import { PaginationParamsDto, PaginationResponseDto } from 'src/shared';
import { ConfirmPaymentUseCase } from 'src/app/sales/use-cases/confirm-payment.use-case';
import { VoidOrderUseCase } from 'src/app/sales/use-cases/void-order.use-case';
import { ConfirmPaymentDto } from 'src/app/sales/dto/in/confirm-payment.dto';
import { VoidOrderDto } from 'src/app/sales/dto/in/void-order.dto';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('POS - User Orders')
@Controller('user-orders')
export class UserOrdersController {
  constructor(
    private readonly service: UserOrdersService,
    private readonly confirmPayment: ConfirmPaymentUseCase,
    private readonly voidOrder: VoidOrderUseCase,
  ) {}

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar todas las órdenes con paginación' })
  @ApiOkResponse({ type: PaginationResponseDto })
  findAll(
    @Query() pagination: PaginationParamsDto,
  ): Promise<PaginationResponseDto<UserOrderDto>> {
    return this.service.findAll(pagination);
  }

  @Post()
  @CashierUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva orden (requiere turno abierto)' })
  @ApiCreatedResponse({ type: UserOrderDto })
  create(@Body() dto: CreateUserOrderDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener el detalle de una orden por ID' })
  @ApiOkResponse({ type: UserOrderDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/pay')
  @CashierUp()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar pago de una orden',
    description:
      'Valida suma de pagos, genera receipt_number, crea stock_movements de salida y marca la orden como paid. Todo en una transacción.',
  })
  @ApiOkResponse({ type: UserOrderDto })
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.confirmPayment.execute(id, dto, user);
  }

  @Patch(':id/void')
  @AdministratorUp()
  @ApiOperation({
    summary: 'Anular una orden pagada (Admin+)',
    description:
      'Solo se pueden anular órdenes con status paid. Crea stock_movements de tipo sale_void para revertir el stock.',
  })
  @ApiOkResponse({ type: UserOrderDto })
  void(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.voidOrder.execute(id, dto, user);
  }
}

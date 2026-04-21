import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Patch,
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
import { PaginationParamsDto } from 'src/shared';
import { ApiNotFound, ApiValidationError } from 'src/shared/utils/swagger';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('User Orders')
@Controller('user-orders')
export class UserOrdersController {
  constructor(private readonly service: UserOrdersService) {}

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar todas las órdenes con paginación' })
  @ApiOkResponse({ type: UserOrderDto, isArray: true })
  findAll(@Query() pagination: PaginationParamsDto) {
    return this.service.findAll(pagination);
  }

  @Post()
  @CashierUp()
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiCreatedResponse({ type: UserOrderDto })
  @ApiValidationError()
  create(@Body() dto: CreateUserOrderDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener el detalle de una orden por ID' })
  @ApiOkResponse({ type: UserOrderDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/void')
  @AdministratorUp()
  @ApiOperation({ summary: 'Anular una orden existente (Requiere motivo)' })
  @ApiOkResponse({ type: UserOrderDto })
  @ApiNotFound()
  @ApiValidationError()
  voidOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.voidOrder(id, reason, user);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
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
import { OrderItemsService } from '../services/order-items.service';
import { CreateOrderItemDto } from '../dto/in/create-order-item.dto';
import { OrderItemDto } from '../dto/order-item.dto';
import { CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('POS - Order Items')
@Controller('user-orders/:orderId/items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar items de una orden' })
  @ApiOkResponse({ type: OrderItemDto, isArray: true })
  findByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderItemsService.findByOrder(orderId);
  }

  @Post()
  @CashierUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar item a una orden' })
  @ApiCreatedResponse({ type: OrderItemDto, isArray: true })
  create(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: CreateOrderItemDto,
  ) {
    return this.orderItemsService.create(orderId, dto, currentUser);
  }

  @Delete(':productId')
  @CashierUp()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar item de una orden' })
  remove(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.orderItemsService.remove(orderId, productId, currentUser);
  }
}

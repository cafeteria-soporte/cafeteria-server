import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { StockMovementsService } from '../services/stock-movements.service';
import { StockMovementDto } from '../dto/stock-movement.dto';
import { CreateStockMovementDto } from '../dto/in/create-stock-movement.dto';
import { FindStockMovementsDto } from '../dto/in/find-stock-movements.dto';
import { AdministratorUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import { ApiNotFound } from 'src/shared/utils/swagger';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('Stock Movements')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}

  @Post()
  @AdministratorUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar ajuste de stock manual (Admin+)',
    description:
      'Tipos válidos: goods_receipt (1), manual_adjustment (2), shrinkage (3). Los tipos sale y sale_void se crean automáticamente al pagar/anular una orden.',
  })
  @ApiCreatedResponse({ description: 'Movimiento registrado correctamente.' })
  async create(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.create(dto, user.id);
  }

  @Get()
  @AdministratorUp()
  @ApiOperation({
    summary: 'Listar movimientos de stock',
    description:
      'Soporta filtrado por producto, tipo de movimiento y rango de fechas.',
  })
  @ApiOkResponse({ type: StockMovementDto, isArray: true })
  findAll(@Query() params: FindStockMovementsDto) {
    return this.service.findAll(params);
  }

  @Get('by-product/:productId')
  @AdministratorUp()
  @ApiOperation({
    summary: 'Historial de movimientos de un producto',
    description: 'Soporta filtrado por tipo de movimiento y rango de fechas.',
  })
  @ApiOkResponse({ type: StockMovementDto, isArray: true })
  @ApiNotFound()
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() params: FindStockMovementsDto,
  ) {
    return this.service.findByProduct(productId, params);
  }

  @Get(':id')
  @AdministratorUp()
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiOkResponse({ type: StockMovementDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}

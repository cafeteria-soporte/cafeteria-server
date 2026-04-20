import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { StockMovementsService } from '../services/stock-movements.service';
import { StockMovementDto } from '../dto/stock-movement.dto';
import { FindStockMovementsDto } from '../dto/in/find-stock-movements.dto';
import { AdministratorUp } from 'src/app/auth/decorators';
import { ApiNotFound } from 'src/shared/utils/swagger';

@ApiTags('Stock Movements')
@Controller('stock-movements')
export class StockMovementsController {
    constructor(private readonly service: StockMovementsService) {}

    @Get()
    @AdministratorUp()
    @ApiOperation({ summary: 'Listar movimientos de stock', description: 'Soporta filtrado por producto, tipo de movimiento y rango de fechas.' })
    @ApiOkResponse({ type: StockMovementDto, isArray: true })
    findAll(@Query() params: FindStockMovementsDto) {
        return this.service.findAll(params);
    }

    @Get('by-product/:productId')
    @AdministratorUp()
    @ApiOperation({ summary: 'Historial de movimientos de un producto', description: 'Soporta filtrado por tipo de movimiento y rango de fechas.' })
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

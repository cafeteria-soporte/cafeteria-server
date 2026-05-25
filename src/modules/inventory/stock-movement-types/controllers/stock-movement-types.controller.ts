import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CashierUp } from 'src/app/auth/decorators/roles.decorator';
import { ApiNotFound } from 'src/shared/utils/swagger';
import { StockMovementTypesService } from '../services/stock-movement-types.service';
import { StockMovementTypeDto } from '../dto/stock-movement-type.dto';
import { FindStockMovementTypesDto } from '../dto/in/find-stock-movement-types.dto';
import { FindAllStockMovementTypesResponseDto } from '../dto/out/find-all-stock-movement-types-response.dto';

@ApiTags('Stock Movement Types')
@Controller('stock-movement-types')
export class StockMovementTypesController {
  constructor(private readonly service: StockMovementTypesService) {}

  @CashierUp()
  @Get()
  @ApiOperation({ summary: 'Listar tipos de movimiento de stock paginados' })
  @ApiOkResponse({ type: FindAllStockMovementTypesResponseDto })
  findAll(
    @Query() params: FindStockMovementTypesDto,
  ): Promise<FindAllStockMovementTypesResponseDto> {
    return this.service.findAll(params);
  }

  @CashierUp()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de movimiento por ID' })
  @ApiOkResponse({ type: StockMovementTypeDto })
  @ApiNotFound()
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StockMovementTypeDto> {
    return this.service.findOne(id, {
      dto: StockMovementTypeDto,
      throwException: true,
    });
  }
}

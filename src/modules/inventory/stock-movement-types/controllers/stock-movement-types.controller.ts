import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockMovementTypesService } from '../services/stock-movement-types.service';

@ApiTags('Stock Movement Types')
@Controller('stock-movement-types')
export class StockMovementTypesController {
    constructor(private readonly service: StockMovementTypesService) {}
}

import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockMovementsService } from '../services/stock-movements.service';

@ApiTags('Stock Movements')
@Controller('stock-movements')
export class StockMovementsController {
    constructor(private readonly service: StockMovementsService) {}
}

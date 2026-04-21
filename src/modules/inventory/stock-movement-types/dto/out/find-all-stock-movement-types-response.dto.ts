import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { StockMovementTypeDto } from '../stock-movement-type.dto';

export class FindAllStockMovementTypesResponseDto extends PaginationResponseDto<StockMovementTypeDto> {
    @ApiProperty({ type: [StockMovementTypeDto] })
    declare data: StockMovementTypeDto[];
}

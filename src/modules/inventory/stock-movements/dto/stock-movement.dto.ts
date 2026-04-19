import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { StockMovementTypeDto } from '../../stock-movement-types/dto/stock-movement-type.dto';

export class StockMovementDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 3 })
    @DtoField()
    productId: number;

    @ApiProperty({ example: -1 })
    @DtoField()
    quantity: number;

    @ApiProperty({ example: 20 })
    @DtoField()
    stockBefore: number;

    @ApiProperty({ example: 19 })
    @DtoField()
    stockAfter: number;

    @ApiPropertyOptional({ example: 'Producto vencido' })
    @DtoField()
    reason: string | null;

    @ApiProperty({ type: () => StockMovementTypeDto })
    @DtoRelation(() => StockMovementTypeDto)
    movementType: StockMovementTypeDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { StockMovementTypeDto } from '../../stock-movement-types/dto/stock-movement-type.dto';
import { UserDto } from 'src/modules/user-management/users/dto/user.dto';

export class StockMovementDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 3, description: 'ID del producto afectado.' })
    @DtoField()
    productId: number;

    @ApiProperty({ example: 1, description: 'ID del usuario que registró el movimiento.' })
    @DtoField()
    userId: number;

    @ApiProperty({ example: -1, description: 'Positivo = entrada, negativo = salida.' })
    @DtoField()
    quantity: number;

    @ApiProperty({ example: 20, description: 'Stock del producto antes del movimiento.' })
    @DtoField()
    stockBefore: number;

    @ApiProperty({ example: 19, description: 'Stock del producto después del movimiento.' })
    @DtoField()
    stockAfter: number;

    @ApiPropertyOptional({ example: 'Producto vencido', description: 'Motivo. Obligatorio en movimientos tipo shrinkage.' })
    @DtoField()
    reason: string | null;

    @ApiProperty()
    @DtoField()
    createdAt: Date;

    @ApiProperty({ type: () => StockMovementTypeDto })
    @DtoRelation(() => StockMovementTypeDto)
    movementType: StockMovementTypeDto;

    @ApiProperty({ type: UserDto})
    @DtoRelation(() => UserDto)
    user: UserDto;
}

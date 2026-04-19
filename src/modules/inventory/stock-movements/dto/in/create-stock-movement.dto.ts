import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsNotEmpty as IsNotEmptyStr } from 'class-validator';

export class CreateStockMovementDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    productId: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    movementTypeId: number;

    @ApiProperty({ example: 10, description: 'Positivo = entrada, negativo = salida' })
    @IsInt()
    quantity: number;

    @ApiPropertyOptional({ example: 'Producto vencido' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    reason?: string;
}

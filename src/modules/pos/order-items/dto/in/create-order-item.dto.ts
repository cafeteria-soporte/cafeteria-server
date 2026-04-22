import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateOrderItemDto {
    @ApiProperty({ description: 'ID del producto', example: 3 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    productId: number;

    @ApiProperty({ description: 'Cantidad a agregar', example: 2 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

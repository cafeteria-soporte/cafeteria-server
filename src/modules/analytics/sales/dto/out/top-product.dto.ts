import { ApiProperty } from '@nestjs/swagger';

export class TopProductDto {
    @ApiProperty({ example: 2 })
    productId: number;

    @ApiProperty({ example: 'Café con leche' })
    name: string;

    @ApiProperty({ example: 'Bebidas' })
    category: string;

    @ApiProperty({ example: 120 })
    totalQuantity: number;

    @ApiProperty({ example: 1860.00 })
    totalRevenue: number;
}

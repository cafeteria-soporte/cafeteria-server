import { ApiProperty } from '@nestjs/swagger';

export class SalesByCategoryDto {
  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: 'Bebidas' })
  name: string;

  @ApiProperty({ example: 3200.0 })
  revenue: number;

  @ApiProperty({ example: 148 })
  orderCount: number;

  @ApiProperty({
    example: 64.5,
    description: 'Porcentaje sobre el ingreso total del período',
  })
  percentage: number;
}

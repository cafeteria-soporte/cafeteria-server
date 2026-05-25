import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty({ example: 1, description: 'ID del producto.' })
  @IsInt({ message: 'Product ID must be an integer.' })
  productId: number;

  @ApiProperty({ example: 1, description: 'ID del tipo de movimiento.' })
  @IsInt({ message: 'Movement type ID must be an integer.' })
  movementTypeId: number;

  @ApiProperty({
    example: -5,
    description: 'Positivo = entrada, negativo = salida.',
  })
  @IsInt({ message: 'Quantity must be an integer.' })
  quantity: number;

  @ApiPropertyOptional({
    example: 'Producto vencido',
    description: 'Motivo del movimiento. Obligatorio para tipo shrinkage.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Reason cannot be empty if provided.' })
  reason?: string;
}

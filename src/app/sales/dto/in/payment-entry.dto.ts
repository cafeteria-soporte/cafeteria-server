import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class PaymentEntryDto {
  @ApiProperty({
    description: 'ID del método de pago (1=cash, 2=card, 3=transfer)',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  paymentMethodId: number;

  @ApiProperty({ description: 'Monto a cobrar con este método', example: 50.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description:
      'Solo efectivo: monto físico entregado por el cliente (para calcular vuelto)',
    example: 100.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountTendered?: number;
}

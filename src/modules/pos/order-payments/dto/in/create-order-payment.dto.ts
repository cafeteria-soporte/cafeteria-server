import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateOrderPaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  paymentMethodId: number;

  @ApiPropertyOptional({ example: 100.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountTendered?: number;
}

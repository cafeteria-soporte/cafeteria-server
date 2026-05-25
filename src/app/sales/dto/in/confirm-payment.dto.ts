import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { PaymentEntryDto } from './payment-entry.dto';

export class ConfirmPaymentDto {
  @ApiProperty({
    description:
      'Lista de pagos. La suma de amount debe igualar el total de la orden. Permite pagos mixtos.',
    type: [PaymentEntryDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentEntryDto)
  payments: PaymentEntryDto[];
}

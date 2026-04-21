import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { PaymentMethodDto } from '../../payment-methods/dto/payment-method.dto'; // ✅ importas la del módulo

export class OrderPaymentDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  id: number;

  @ApiProperty({ example: 1 })
  @DtoField()
  userOrderId: number;

  @ApiProperty({ example: 1 })
  @DtoField()
  paymentMethodId: number;

  @ApiProperty({ example: 50.0 })
  @DtoField()
  amount: number;

  @ApiPropertyOptional({ example: 100.0 })
  @DtoField()
  amountTendered: number | null;

  @ApiProperty({ type: () => PaymentMethodDto })
  @DtoRelation(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { PaymentMethodDto } from '../../payment-methods/dto/payment-method.dto';

export class OrderPaymentDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 45.50 })
    @DtoField()
    amount: number;

    @ApiPropertyOptional({ example: 50.00 })
    @DtoField()
    amountTendered: number | null;

    @ApiProperty({ type: () => PaymentMethodDto })
    @DtoRelation(() => PaymentMethodDto)
    paymentMethod: PaymentMethodDto;
}

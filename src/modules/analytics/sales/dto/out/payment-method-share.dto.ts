import { ApiProperty } from '@nestjs/swagger';

export class PaymentMethodShareDto {
    @ApiProperty({ example: 'cash' })
    method: string;

    @ApiProperty({ example: 42 })
    orderCount: number;

    @ApiProperty({ example: 46.7 })
    percentage: number;
}

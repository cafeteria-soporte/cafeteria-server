import { ApiProperty } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class OrderItemDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    userOrderId: number;

    @ApiProperty({ example: 3 })
    @DtoField()
    productId: number;

    @ApiProperty({ example: 2 })
    @DtoField()
    quantity: number;

    @ApiProperty({ example: 15.50 })
    @DtoField()
    unitPrice: number;

    @ApiProperty({ example: 31.00 })
    @DtoField()
    subtotal: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class PaymentMethodDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'cash' })
    @DtoField()
    name: string;
}

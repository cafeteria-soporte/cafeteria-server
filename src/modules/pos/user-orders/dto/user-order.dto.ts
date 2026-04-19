import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class UserOrderDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'REC-000001' })
    @DtoField()
    receiptNumber: string;

    @ApiProperty({ example: 45.50 })
    @DtoField()
    total: number;

    @ApiProperty({ example: 'open', enum: ['open', 'paid', 'voided'] })
    @DtoField()
    status: string;

    @ApiPropertyOptional({ example: 'Error de ingreso' })
    @DtoField()
    voidReason: string | null;

    @ApiProperty()
    @DtoField()
    createdAt: Date;
}

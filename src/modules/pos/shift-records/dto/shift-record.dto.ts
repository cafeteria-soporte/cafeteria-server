import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class ShiftRecordDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 200.00 })
    @DtoField()
    initialFund: number;

    @ApiPropertyOptional({ example: 450.00 })
    @DtoField()
    declaredAmount: number | null;

    @ApiPropertyOptional({ example: 455.00 })
    @DtoField()
    expectedAmount: number | null;

    @ApiPropertyOptional({ example: -5.00 })
    @DtoField()
    discrepancy: number | null;

    @ApiProperty({ example: 'open', enum: ['open', 'closed'] })
    @DtoField()
    status: string;

    @ApiProperty({ example: false })
    @DtoField()
    discrepancyAlert: boolean;

    @ApiProperty()
    @DtoField()
    openedAt: Date;

    @ApiPropertyOptional()
    @DtoField()
    closedAt: Date | null;
}

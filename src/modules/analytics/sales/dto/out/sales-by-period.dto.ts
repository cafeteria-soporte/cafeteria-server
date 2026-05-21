import { ApiProperty } from '@nestjs/swagger';

export class SalesByPeriodDto {
    @ApiProperty({ example: '2026-05-01' })
    period: string;

    @ApiProperty({ example: 1250.00 })
    revenue: number;

    @ApiProperty({ example: 43 })
    orderCount: number;

    @ApiProperty({ example: 29.07 })
    avgTicket: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ShiftsFilterDto {
    @ApiPropertyOptional({ example: '2026-05-01', description: 'Fecha de inicio (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({ example: '2026-05-31', description: 'Fecha de fin (YYYY-MM-DD), inclusiva' })
    @IsOptional()
    @IsDateString()
    to?: string;
}

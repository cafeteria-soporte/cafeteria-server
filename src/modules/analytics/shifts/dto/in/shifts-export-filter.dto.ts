import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ShiftsFilterDto } from './shifts-filter.dto';

export enum ExportFormat {
    PDF = 'pdf',
    CSV = 'csv',
}

export class ShiftsExportFilterDto extends ShiftsFilterDto {
    @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV })
    @IsOptional()
    @IsEnum(ExportFormat)
    format?: ExportFormat = ExportFormat.CSV;
}

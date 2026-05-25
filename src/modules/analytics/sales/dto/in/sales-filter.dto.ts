import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class SalesFilterDto {
  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Fecha de inicio (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-05-31',
    description: 'Fecha de fin (YYYY-MM-DD), inclusiva',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: GroupBy,
    default: GroupBy.DAY,
    description: 'Agrupación temporal para by-period',
  })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy = GroupBy.DAY;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Límite de resultados para top-products',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SalesExportFilterDto extends SalesFilterDto {
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.CSV;
}

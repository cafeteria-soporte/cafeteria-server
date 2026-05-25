import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindShiftRecordsDto extends PaginationParamsDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de cajero', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cashierId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado. Valores: open, closed',
    enum: ['open', 'closed'],
  })
  @IsOptional()
  @IsIn(['open', 'closed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio ISO 8601 (openedAt >= from)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin ISO 8601 (openedAt <= to)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class InventoryFilterDto {
  @ApiPropertyOptional({ example: 'csv' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-24' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({ example: 'sale' })
  @IsOptional()
  @IsString()
  movementType?: string;
}

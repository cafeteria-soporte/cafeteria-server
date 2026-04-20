import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindStockMovementsDto extends PaginationParamsDto {
    @ApiPropertyOptional({ example: 3, description: 'Filtrar por producto.' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    productId?: number;

    @ApiPropertyOptional({ example: 1, description: 'Filtrar por tipo de movimiento.' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    movementTypeId?: number;

    @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha de inicio (ISO 8601).' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha de fin (ISO 8601).' })
    @IsOptional()
    @IsDateString()
    to?: string;
}

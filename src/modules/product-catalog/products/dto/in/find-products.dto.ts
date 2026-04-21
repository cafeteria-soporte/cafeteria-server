import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationParamsDto } from 'src/shared';

export class FindProductsDto extends PaginationParamsDto {
    @ApiPropertyOptional({ example: 'café', description: 'Filtrar por nombre (búsqueda parcial)' })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    name?: string;

    @ApiPropertyOptional({ example: true, description: 'Filtrar por estado activo/inactivo' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID de categoría' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    categoryId?: number;
}

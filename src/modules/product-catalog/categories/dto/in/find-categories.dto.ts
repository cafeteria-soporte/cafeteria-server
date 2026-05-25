import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindCategoriesDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    example: 'beb',
    description: 'Filtrar por nombre (búsqueda parcial)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar por estado activo/inactivo',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  active?: boolean;
}

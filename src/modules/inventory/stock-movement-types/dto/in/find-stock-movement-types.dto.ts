import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindStockMovementTypesDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    example: 'sale',
    description:
      'Filtrar por nombre. Valores posibles: `goods_receipt`, `manual_adjustment`, `shrinkage`, `sale`, `sale_void`.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

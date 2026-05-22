import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindRolesDto extends PaginationParamsDto {
    @ApiPropertyOptional({
        example: 'admin',
        description: 'Filtrar por nombre. Valores posibles: `root`, `administrator`, `cashier`.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;
}

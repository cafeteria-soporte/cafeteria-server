import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindUsersDto extends PaginationParamsDto {
    @ApiPropertyOptional({ example: true, description: 'Filtrar por estado activo/inactivo.' })
    @IsOptional()
    @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({ example: 2, description: 'Filtrar por rol (1=root, 2=administrator, 3=cashier).' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    roleId?: number;
}

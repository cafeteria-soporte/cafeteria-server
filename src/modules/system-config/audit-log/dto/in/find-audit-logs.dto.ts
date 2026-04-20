import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindAuditLogsDto extends PaginationParamsDto {
    @ApiPropertyOptional({
        example: 'login',
        description: 'Filtrar por acción. Valores válidos: `login`, `logout`, `login_failed`, `user_created`, `user_deactivated`, `password_changed`, `price_changed`, `stock_adjusted`, `shrinkage_recorded`, `sale_paid`, `sale_voided`, `shift_opened`, `shift_closed`, `settings_changed`.',
    })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({
        example: 'auth',
        description: 'Filtrar por módulo. Valores válidos: `auth`, `users`, `products`, `inventory`, `shifts`, `orders`, `payments`, `settings`.',
    })
    @IsOptional()
    @IsString()
    module?: string;

    @ApiPropertyOptional({ example: 3, description: 'Filtrar por ID de usuario' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId?: number;

    @ApiPropertyOptional({ example: 'jperez', description: 'Filtrar por nombre de usuario (snapshot)' })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha inicio (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha fin (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    to?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional } from 'class-validator';

/**
 * DTO para parámetros de paginación en query strings.
 * Se extiende en los DTOs de búsqueda de cada módulo.
 *
 * ¿Por qué @Type(() => Number)?
 *   Los query params HTTP llegan como strings al servidor (?page=2 → '2').
 *   @Type(() => Number) le dice a class-transformer que convierta ese string a Number.
 *   Esto funciona junto con ValidationPipe({ transform: true }) en main.ts.
 *   Sin @Type(), page y limit llegarían como strings y las validaciones @IsInt() fallarían.
 *
 * ¿Por qué page: number = 1 (propiedad con valor por defecto)?
 *   Si el cliente no manda ?page=..., la propiedad se inicializa con 1.
 *   @IsOptional() permite que la validación pase cuando el campo no está en el query.
 *   El resultado: siempre tienes page y limit con valores numéricos válidos.
 *
 * @example
 *   // DTOs de feature extienden este:
 *   export class FindAllUsersParamsDto extends PaginationParamsDto {
 *       @IsOptional() @IsString() name?: string;
 *   }
 *   // GET /users?page=2&limit=5&name=Juan
 *   // findAll(@Query() params: FindAllUsersParamsDto)
 */
export class PaginationParamsDto {
    @ApiPropertyOptional({
        description: 'Número de la página (empieza en 1). Default: 1.',
        example: 2,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "The 'page' parameter must be an integer." })
    @Min(1, { message: "The 'page' parameter must be greater than or equal to 1." })
    page: number = 1;

    @ApiPropertyOptional({
        description: 'Cantidad de resultados por página. Default: 10.',
        example: 20,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: "The 'limit' parameter must be an integer." })
    @Min(1, { message: "The 'limit' parameter must be greater than or equal to 1." })
    limit: number = 10;
}

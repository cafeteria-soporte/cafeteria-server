import { ApiProperty } from '@nestjs/swagger';

/**
 * Formato estándar de todas las respuestas de error de la API.
 *
 * Este DTO refleja exactamente lo que HttpExceptionFilter devuelve:
 *   { statusCode, error, message, path, timestamp }
 *
 * Úsalo en Swagger como type general cuando el endpoint puede fallar
 * con múltiples códigos de error distintos y quieres documentar solo
 * la estructura. Para documentar el código de error ESPECÍFICO de cada
 * caso, usa el decorator @ApiErrorResponse() de swagger-response.utils.ts.
 *
 * @example
 *   // Cuando el error code específico no importa para la documentación:
 *   @ApiNotFoundResponse({ type: ErrorResponseDto })
 *
 *   // Cuando sí importa (recomendado):
 *   @ApiErrorResponse(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'El usuario no fue encontrado.')
 */
export class ErrorResponseDto {
    @ApiProperty({
        description: 'Código HTTP del error',
        example: 404,
    })
    statusCode: number;

    @ApiProperty({
        description: 'Código de error machine-readable. Los domain errors usan SCREAMING_SNAKE_CASE.',
        example: 'NOT_FOUND',
        examples: {
            generic:          { value: 'NOT_FOUND',          summary: 'Error genérico de NestJS' },
            domain:           { value: 'USER_NOT_FOUND',     summary: 'Error de dominio específico' },
            auth:             { value: 'INVALID_TOKEN',      summary: 'Error de autenticación' },
            permission:       { value: 'PERMISSION_DENIED',  summary: 'Error de autorización' },
        },
    })
    error: string;

    @ApiProperty({
        description: 'Mensaje legible para el usuario o lista de errores de validación',
        oneOf: [
            { type: 'string',  example: 'El usuario no fue encontrado.' },
            { type: 'array', items: { type: 'string' }, example: ['name must be a string'] },
        ],
    })
    message: string | string[];

    @ApiProperty({
        description: 'Ruta del endpoint que generó el error',
        example: '/api/users/1',
    })
    path: string;

    @ApiProperty({
        description: 'Fecha y hora del error en formato ISO 8601',
        example: '2024-01-01T00:00:00.000Z',
    })
    timestamp: string;
}

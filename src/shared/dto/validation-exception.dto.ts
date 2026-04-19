import { ApiProperty } from '@nestjs/swagger';

/**
 * Formato de error 400 cuando el ValidationPipe rechaza el body/query.
 *
 * ValidationPipe genera message como array de strings — uno por cada campo inválido.
 * Este DTO hereda la misma estructura base de ErrorResponseDto pero tipifica
 * message como string[] para ser explícito en Swagger.
 *
 * @example Respuesta cuando faltan campos requeridos o tienen tipos incorrectos:
 *   {
 *     "statusCode": 400,
 *     "error": "BAD_REQUEST",
 *     "message": ["title must be a string", "title should not be empty"],
 *     "path": "/api/examples",
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
 */
export class ValidationExceptionDto {
    @ApiProperty({ example: 400 })
    statusCode: number;

    @ApiProperty({ example: 'BAD_REQUEST' })
    error: string;

    @ApiProperty({
        description: 'Lista de campos inválidos — uno por cada falla de validación',
        type: [String],
        example: ['title must be a string', 'title should not be empty'],
    })
    message: string[];

    @ApiProperty({ example: '/api/examples' })
    path: string;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    timestamp: string;
}

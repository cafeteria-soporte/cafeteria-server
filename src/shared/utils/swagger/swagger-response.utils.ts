import { applyDecorators } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto, ValidationExceptionDto } from 'src/shared/dto';

/**
 * Decorators de Swagger para documentar respuestas de error.
 *
 * Uso directo en el controller — sin argumentos, sin repetir formatos:
 *
 *   @Get(':id')
 *   @ApiOkResponse({ type: ExampleDto })
 *   @ApiNotFound()
 *   @ApiUnauthorized()
 *   findOne(@Param('id', ParseIntPipe) id: number) { ... }
 *
 *   @Post()
 *   @ApiCreatedResponse({ type: ExampleDto })
 *   @ApiValidationError()
 *   @ApiUnauthorized()
 *   create(@Body() dto: CreateDto) { ... }
 *
 * Cada decorator documenta el schema completo de ErrorResponseDto
 * (statusCode, error, message, path, timestamp) y la descripción de qué
 * significa ese status en este contexto de la API.
 *
 * El campo `error` siempre está presente pero varía por endpoint
 * (ej. USER_NOT_FOUND, ORDER_NOT_FOUND son ambos 404).
 * Documentar el código exacto es responsabilidad del endpoint si el consumer
 * lo necesita — estos decorators documentan el FORMATO, no el valor específico.
 */

/** 404 — El recurso solicitado no existe o no está disponible. */
export const ApiNotFound = () =>
  applyDecorators(
    ApiNotFoundResponse({
      description: 'El recurso solicitado no fue encontrado.',
      type: ErrorResponseDto,
    }),
  );

/** 409 — Ya existe un registro con los mismos datos únicos (ej. email duplicado). */
export const ApiConflict = () =>
  applyDecorators(
    ApiConflictResponse({
      description: 'Ya existe un registro con esos datos.',
      type: ErrorResponseDto,
    }),
  );

/** 401 — Token JWT inválido, expirado o ausente. */
export const ApiUnauthorized = () =>
  applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Token inválido o expirado.',
      type: ErrorResponseDto,
    }),
  );

/** 403 — El usuario está autenticado pero no tiene permisos para esta acción. */
export const ApiForbidden = () =>
  applyDecorators(
    ApiForbiddenResponse({
      description: 'No tienes permiso para realizar esta acción.',
      type: ErrorResponseDto,
    }),
  );

/**
 * 400 — El body o los query params no pasaron la validación del ValidationPipe.
 * El `message` es un array con un error por cada campo inválido.
 */
export const ApiValidationError = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Datos de entrada inválidos.',
      type: ValidationExceptionDto,
    }),
  );

/** 422 — Los datos son válidos en formato pero no pueden procesarse (ej. stock insuficiente). */
export const ApiUnprocessableEntity = () =>
  applyDecorators(
    ApiUnprocessableEntityResponse({
      description: 'Los datos no pueden procesarse en el estado actual.',
      type: ErrorResponseDto,
    }),
  );

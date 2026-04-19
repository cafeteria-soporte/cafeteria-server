/**
 * Guía de excepciones para este template.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Nivel 1: Excepciones genéricas → usa built-ins de @nestjs/common│
 * └─────────────────────────────────────────────────────────────────┘
 *   Para errores simples donde el mensaje es suficiente:
 *
 *   throw new NotFoundException('El recurso no fue encontrado.');
 *   throw new BadRequestException('El email ya está en uso.');
 *   throw new UnauthorizedException('Token inválido o expirado.');
 *   throw new ForbiddenException('No tienes permiso para esta acción.');
 *   throw new ConflictException('Ya existe un registro con ese valor.');
 *
 *   Respuesta: { statusCode: 404, error: 'NOT_FOUND', message: '...', path, timestamp }
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Nivel 2: Domain exceptions → error code machine-readable        │
 * └─────────────────────────────────────────────────────────────────┘
 *   Cuando el frontend necesita distinguir errores del MISMO status HTTP
 *   y actuar diferente según el error específico:
 *
 *   // En modules/mi-modulo/exceptions/mi-entidad-not-found.exception.ts:
 *   export class MiEntidadNotFoundException extends NotFoundException {
 *       constructor() {
 *           super({ message: 'Mi entidad no fue encontrada.', error: 'MI_ENTIDAD_NOT_FOUND' });
 *       }
 *   }
 *
 *   // Uso en el servicio:
 *   throw new MiEntidadNotFoundException();
 *
 *   // Respuesta:
 *   { statusCode: 404, error: 'MI_ENTIDAD_NOT_FOUND', message: '...', path, timestamp }
 *
 *   El frontend puede switchear sobre el error code:
 *   switch (err.error) {
 *       case 'USER_NOT_FOUND':  router.push('/login'); break;
 *       case 'ORDER_NOT_FOUND': showModal('Orden no encontrada'); break;
 *   }
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Convención de nombres para error codes                          │
 * └─────────────────────────────────────────────────────────────────┘
 *   ENTIDAD_ACCION  →  USER_NOT_FOUND, ORDER_NOT_FOUND, ROLE_NOT_FOUND
 *   ENTIDAD_ESTADO  →  DISH_NOT_AVAILABLE, DISH_STOCK_EXCEEDED
 *   ACCION_CONTEXTO →  DUPLICATE_ITEM_IN_ORDER, INCORRECT_CREDENTIALS
 *   SIEMPRE en SCREAMING_SNAKE_CASE en inglés.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ ¿Dónde van las domain exceptions?                               │
 * └─────────────────────────────────────────────────────────────────┘
 *   Dentro del módulo que las necesita:
 *     modules/users/exceptions/user-not-found.exception.ts
 *     modules/orders/exceptions/order-not-found.exception.ts
 *   NO aquí en shared/ — las excepciones de dominio son propias de cada módulo.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Ver ejemplo funcionando en:                                     │
 * └─────────────────────────────────────────────────────────────────┘
 *   modules/example/exceptions/example-not-found.exception.ts
 *   modules/example/example.service.ts → throw new ExampleNotFoundException()
 */

// Este barrel existe para excepciones shared (si alguna vez las necesitas).
// Las domain exceptions van en su propio módulo (modules/X/exceptions/).


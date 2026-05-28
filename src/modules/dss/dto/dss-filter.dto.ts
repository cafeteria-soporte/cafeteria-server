import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

/**
 * Filtros globales del Dashboard DSS.
 * Todos los parámetros son opcionales; sin filtros se usa el estado actual y los últimos 30 días.
 */
export class DssFilterDto {
  @ApiPropertyOptional({
    example: '2026-05-01',
    description:
      'Inicio del período analizado. Formato ISO 8601: YYYY-MM-DD. ' +
      'Afecta el rango de órdenes en cross-selling, matriz BCG, horas muertas y ' +
      'el ranking de eficiencia de cajeros. ' +
      'Si se omite, no se aplica límite inferior de fecha.',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-05-27',
    description:
      'Fin del período analizado (inclusivo). Formato ISO 8601: YYYY-MM-DD. ' +
      'Si se omite, no se aplica límite superior de fecha.',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'all',
    description:
      "ID numérico de la categoría a filtrar (ej. '2'), o 'all' para todas las categorías. " +
      'Reservado para versiones futuras; actualmente los endpoints procesan siempre todas las categorías.',
  })
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'all',
    description:
      "ID numérico del turno a analizar (shift_record_id), o 'all' para todos los turnos. " +
      'Reservado para versiones futuras; actualmente los endpoints no filtran por turno específico.',
  })
  @IsOptional()
  shift?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description:
      'Modo crisis. Cuando es true, los umbrales de riesgo se vuelven más sensibles: ' +
      'el score de fatiga se interpreta con un techo más bajo (60 en lugar de 80), ' +
      'lo que hace que la alerta se dispare antes. ' +
      "Pasar 'true' o 'false' como string — el backend lo convierte automáticamente a booleano.",
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  crisisMode?: boolean = false;
}

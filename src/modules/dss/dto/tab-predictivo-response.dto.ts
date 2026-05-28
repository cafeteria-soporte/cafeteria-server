import { ApiProperty } from '@nestjs/swagger';

export class CriticalStockDto {
  @ApiProperty({
    example: 'Croissant',
    description: 'Nombre del producto con stock bajo (current_stock ≤ min_stock × 3).',
  })
  productName: string;

  @ApiProperty({
    example: 12,
    description:
      'Cantidad de unidades disponibles en este momento (products.current_stock). ' +
      'Valor en tiempo real, no filtrado por rango de fechas.',
  })
  currentStock: number;

  @ApiProperty({
    example: 2.5,
    nullable: true,
    description:
      'Tiempo Estimado de Agotamiento (TEA) en horas. ' +
      'Fórmula: current_stock ÷ (unidades_vendidas_hoy ÷ horas_desde_primera_venta_hoy). ' +
      'Null si no hubo ventas hoy (no es posible calcular la tasa horaria). ' +
      'Un valor de 2.5 significa que el stock se agotará en ~2 horas y 30 minutos.',
  })
  teaHours: number | null;
}

export class InventoryPredictionsDto {
  @ApiProperty({
    type: [CriticalStockDto],
    description:
      'Productos cuyo stock actual es menor o igual a 3 veces el stock mínimo configurado. ' +
      'Ordenados por TEA ascendente (los más urgentes primero). ' +
      'Productos sin ventas hoy aparecen al final con teaHours=null.',
  })
  criticalStock: CriticalStockDto[];
}

export class ExpectedShrinkageDto {
  @ApiProperty({
    example: 'Sándwich Frío',
    description: 'Nombre del producto con historial de mermas en este día de la semana.',
  })
  productName: string;

  @ApiProperty({
    example: 15,
    description:
      'Cantidad promedio de unidades que se esperan perder hoy por merma (vencimiento, rotura, etc.). ' +
      'Calculado como el promedio de stock_movements con tipo "shrinkage" ' +
      'registrados en el mismo día de la semana que hoy (histórico completo).',
  })
  expectedLossQty: number;

  @ApiProperty({
    example: 'alta',
    enum: ['alta', 'media', 'baja'],
    description:
      'Nivel de urgencia basado en expectedLossQty: ' +
      '"alta" ≥ 10 unidades | "media" 5–9 unidades | "baja" < 5 unidades.',
  })
  urgency: string;
}

export class OperationsForecastDto {
  @ApiProperty({
    example: '10:00',
    nullable: true,
    description:
      'Hora de inicio de la franja con mayor volumen de órdenes histórico (últimos 30 días). ' +
      'Formato HH:MM (24 h). Null si no hay datos suficientes.',
  })
  peakHourStart: string | null;

  @ApiProperty({
    example: '11:00',
    nullable: true,
    description:
      'Hora de fin de la franja pico (siempre peakHourStart + 1 hora). ' +
      'Formato HH:MM (24 h). Null si peakHourStart es null.',
  })
  peakHourEnd: string | null;

  @ApiProperty({
    example: 'Bebidas Frías',
    nullable: true,
    description:
      'Categoría con mayor crecimiento en ventas esta semana vs la semana anterior. ' +
      'Calculado como (ingresos_esta_semana − ingresos_semana_anterior) ÷ ingresos_semana_anterior. ' +
      'Null si no hay ventas en alguna de las dos semanas para comparar.',
  })
  growingCategory: string | null;
}

export class TabPredictivoResponseDto {
  @ApiProperty({
    type: InventoryPredictionsDto,
    description: 'Predicciones de inventario crítico con TEA por producto.',
  })
  inventoryPredictions: InventoryPredictionsDto;

  @ApiProperty({
    type: [ExpectedShrinkageDto],
    description:
      'Mermas esperadas para hoy basadas en historial del mismo día de la semana. ' +
      'Array vacío si no hay mermas históricas registradas para este día.',
  })
  expectedShrinkage: ExpectedShrinkageDto[];

  @ApiProperty({
    type: OperationsForecastDto,
    description: 'Pronóstico operacional: hora pico y tendencia de categorías.',
  })
  operationsForecast: OperationsForecastDto;
}

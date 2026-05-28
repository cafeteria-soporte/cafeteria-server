import { ApiProperty } from '@nestjs/swagger';

export class CriticalStockDto {
  @ApiProperty({
    example: 'Croissant',
    description: 'Nombre del producto con stock bajo (current_stock ≤ min_stock × 3).',
  })
  productName: string;

  @ApiProperty({
    example: 12,
    description: 'Unidades disponibles en tiempo real (products.current_stock).',
  })
  currentStock: number;

  @ApiProperty({
    example: 2.5,
    nullable: true,
    description:
      'Tiempo Estimado de Agotamiento en horas. ' +
      'Fórmula: current_stock ÷ (unidades_vendidas_hoy ÷ horas_desde_primera_venta_hoy). ' +
      'Null si no hubo ventas hoy.',
  })
  teaHours: number | null;
}

export class InventoryPredictionsDto {
  @ApiProperty({
    type: [CriticalStockDto],
    description:
      'Productos con current_stock ≤ min_stock × 3, ordenados por TEA ascendente. ' +
      'Los que tienen teaHours=null aparecen al final.',
  })
  criticalStock: CriticalStockDto[];
}

export class ExpectedShrinkageDto {
  @ApiProperty({ example: 'Sándwich Frío' })
  productName: string;

  @ApiProperty({
    example: 15,
    description:
      'Promedio histórico de unidades perdidas por merma en el mismo día de la semana.',
  })
  expectedLossQty: number;

  @ApiProperty({
    example: 'alta',
    enum: ['alta', 'media', 'baja'],
    description: '"alta" ≥10 unidades | "media" 5–9 | "baja" <5.',
  })
  urgency: string;
}

export class OperationsForecastDto {
  @ApiProperty({ example: '10:00', nullable: true })
  peakHourStart: string | null;

  @ApiProperty({ example: '11:00', nullable: true })
  peakHourEnd: string | null;

  @ApiProperty({
    example: 'Bebidas Frías',
    nullable: true,
    description: 'Categoría con mayor crecimiento porcentual esta semana vs la anterior.',
  })
  growingCategory: string | null;
}

export class StockTrendPointDto {
  @ApiProperty({
    example: '2026-05-22',
    description: 'Fecha del punto de la serie (YYYY-MM-DD).',
  })
  date: string;

  @ApiProperty({
    example: 'Lun',
    description: 'Etiqueta del día en español para el eje X del gráfico (Lun, Mar, Mié, Jue, Vie, Sáb, Dom).',
  })
  dayLabel: string;

  @ApiProperty({
    example: 18,
    description:
      'Stock promedio entre todos los productos activos al cierre de ese día. ' +
      'Calculado como AVG(último stock_after por producto en ese día).',
  })
  avgStock: number;

  @ApiProperty({
    example: 4,
    description:
      'Total de unidades perdidas por merma (shrinkage) en todos los productos ese día.',
  })
  totalShrinkage: number;
}

export class TabPredictivoResponseDto {
  @ApiProperty({ type: InventoryPredictionsDto })
  inventoryPredictions: InventoryPredictionsDto;

  @ApiProperty({
    type: [ExpectedShrinkageDto],
    description: 'Mermas esperadas para hoy. Array vacío si no hay historial de mermas este día de la semana.',
  })
  expectedShrinkage: ExpectedShrinkageDto[];

  @ApiProperty({ type: OperationsForecastDto })
  operationsForecast: OperationsForecastDto;

  @ApiProperty({
    type: [StockTrendPointDto],
    description:
      'Serie temporal de los últimos 7 días para graficar la tendencia de stock y mermas. ' +
      'Solo incluye días con al menos un movimiento de stock registrado.',
  })
  stockTrend: StockTrendPointDto[];
}

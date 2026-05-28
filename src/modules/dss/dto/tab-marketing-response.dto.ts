import { ApiProperty } from '@nestjs/swagger';

export class CrossSellingDto {
  @ApiProperty({
    example: 'Café Americano',
    description: 'Producto base (el que tiene mayor cantidad total de órdenes entre el par).',
  })
  baseProduct: string;

  @ApiProperty({
    example: 'Croissant',
    description: 'Producto que aparece junto al producto base con mayor frecuencia.',
  })
  matchedProduct: string;

  @ApiProperty({
    example: 72.0,
    description:
      'Porcentaje de afinidad. Fórmula: (órdenes_con_ambos_productos ÷ órdenes_totales_del_producto_base) × 100. ' +
      'Un valor de 72 significa que el 72% de las veces que se vende el producto base, ' +
      'también se vende el producto complementario en el mismo ticket. ' +
      'Solo incluye pares que coinciden en al menos 2 órdenes.',
  })
  affinityPct: number;
}

export class MenuPerformanceDto {
  @ApiProperty({
    example: 'Capuchino',
    description: 'Nombre del producto.',
  })
  productName: string;

  @ApiProperty({
    example: 'estrella',
    enum: ['estrella', 'vaca', 'interrogante', 'zombie'],
    description:
      'Clasificación BCG del producto según volumen de unidades vendidas e ingresos generados ' +
      'en el período filtrado. ' +
      '"estrella": alto volumen Y altos ingresos → promover activamente. ' +
      '"vaca": alto volumen PERO bajos ingresos → revisar precio o margen. ' +
      '"interrogante": bajo volumen PERO altos ingresos → potencial desaprovechado, considerar promoción. ' +
      '"zombie": bajo volumen Y bajos ingresos → evaluar eliminar del menú. ' +
      'El umbral entre "alto" y "bajo" es el promedio de todos los productos en el período.',
  })
  matrixType: string;

  @ApiProperty({
    example: 6750.0,
    description:
      'Ingresos totales en Bs generados por este producto en el período (sum de order_items.subtotal).',
  })
  revenueBs: number;
}

export class DeadHourDto {
  @ApiProperty({
    example: '15:00',
    description: 'Hora de inicio de la franja muerta. Formato HH:MM (24 h).',
  })
  hourStart: string;

  @ApiProperty({
    example: '16:00',
    description: 'Hora de fin de la franja muerta (siempre hourStart + 1 hora). Formato HH:MM (24 h).',
  })
  hourEnd: string;

  @ApiProperty({
    example: 'Postres',
    description: 'Categoría de producto que registra ventas mínimas en esta franja horaria.',
  })
  affectedCategory: string;
}

export class HeatmapInsightsDto {
  @ApiProperty({
    type: [DeadHourDto],
    description:
      'Franjas horarias donde una categoría registra menos del 30% de su promedio histórico de ventas por hora. ' +
      'Útil para diseñar promociones o happy hours en esos horarios. ' +
      'Array vacío si todas las franjas tienen actividad normal.',
  })
  deadHours: DeadHourDto[];
}

export class PriceSensitivityDto {
  @ApiProperty({
    example: 'Capuchino',
    nullable: true,
    description:
      'Producto con mayor impacto de ventas tras el último cambio de precio registrado en audit_log. ' +
      'Null si no hay cambios de precio registrados en el historial.',
  })
  productName: string | null;

  @ApiProperty({
    example: 25.0,
    nullable: true,
    description:
      'Variación porcentual de ventas (unidades) comparando los 7 días previos al cambio de precio ' +
      'vs los 7 días posteriores. ' +
      'Positivo = caída de ventas (el cliente rechazó el cambio). ' +
      'Negativo = aumento de ventas (el cliente respondió bien). ' +
      'Ejemplo: 25 significa que las ventas cayeron un 25% tras el cambio. ' +
      'Null si no hay datos suficientes o no hubo cambios de precio.',
  })
  salesDropPct: number | null;

  @ApiProperty({
    example: 2.0,
    nullable: true,
    description:
      'Diferencia en Bs entre el precio nuevo y el anterior (nuevo − anterior). ' +
      'Positivo = subida de precio. Negativo = bajada de precio. ' +
      'Null si no hay cambios de precio registrados.',
  })
  priceChangeBs: number | null;
}

export class TabMarketingResponseDto {
  @ApiProperty({
    type: [CrossSellingDto],
    description:
      'Top 10 pares de productos con mayor afinidad de compra conjunta. ' +
      'Ordenados por affinityPct descendente.',
  })
  crossSellingAffinity: CrossSellingDto[];

  @ApiProperty({
    type: [MenuPerformanceDto],
    description:
      'Clasificación BCG de todos los productos con ventas en el período. ' +
      'Ordenados por revenueBs descendente.',
  })
  menuPerformanceMatrix: MenuPerformanceDto[];

  @ApiProperty({
    type: HeatmapInsightsDto,
    description: 'Análisis de franjas horarias con baja actividad por categoría.',
  })
  heatmapInsights: HeatmapInsightsDto;

  @ApiProperty({
    type: PriceSensitivityDto,
    description:
      'Sensibilidad al precio del producto más impactado por el último cambio de precio registrado.',
  })
  priceSensitivity: PriceSensitivityDto;
}

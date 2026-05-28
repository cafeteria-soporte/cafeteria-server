import { ApiProperty } from '@nestjs/swagger';

export class CashierEfficiencyDto {
  @ApiProperty({
    example: 'Ana López',
    description: 'Nombre completo del cajero (campo full_name del usuario).',
  })
  cashierName: string;

  @ApiProperty({
    example: 98,
    description:
      'Puntuación de eficiencia del cajero. Escala 0–100. ' +
      'Fórmula: 100 − (suma_descuadres_absolutos / total_ventas × 1000). ' +
      'Un score de 100 significa cero descuadre en arqueos. ' +
      'Se reduce 1 punto por cada 0.1% de descuadre sobre el total vendido. ' +
      'Mínimo 0. Solo considera turnos cerrados dentro del rango de fechas del filtro.',
  })
  efficiencyScore: number;
}

export class ShiftStatusDto {
  @ApiProperty({
    example: true,
    description: 'Indica si hay un turno con status="open" en este momento.',
  })
  isOpen: boolean;

  @ApiProperty({
    example: 'Carlos Mamani',
    nullable: true,
    description:
      'Nombre completo del cajero que tiene el turno abierto. ' +
      'Null cuando isOpen es false.',
  })
  cashierName: string | null;

  @ApiProperty({
    example: 3500,
    description:
      'Monto total en efectivo (Bs) acumulado en el turno activo. ' +
      'Suma de order_payments.amount donde payment_method = "cash" ' +
      'y las órdenes pertenecen al turno abierto. ' +
      '0 cuando no hay turno abierto.',
  })
  cashAccumulationBs: number;

  @ApiProperty({
    example: 85,
    description:
      'Score de riesgo de fatiga del cajero activo. Escala 0–100. ' +
      'Fórmula: MÍNIMO(100, horas_activas × 8 + pagos_cash_consecutivos × 3). ' +
      'horas_activas: horas transcurridas desde shift_records.opened_at. ' +
      'pagos_cash_consecutivos: cantidad de las últimas 10 órdenes del turno que fueron 100% en efectivo. ' +
      'Con crisisMode=true el umbral de alerta baja de 80 a 60. ' +
      '0 cuando no hay turno abierto.',
  })
  fatigueRiskScore: number;
}

export class HolisticKpisDto {
  @ApiProperty({
    example: 250.5,
    description:
      'Costo de oportunidad estimado en Bs por productos actualmente con stock = 0. ' +
      'Fórmula por producto: horas_sin_stock × tasa_ventas_por_hora × precio_venta. ' +
      'horas_sin_stock: tiempo transcurrido desde el último stock_movement con stock_after = 0. ' +
      'tasa_ventas_por_hora: unidades vendidas en los últimos 30 días ÷ horas de operación. ' +
      '0 si todos los productos tienen stock disponible.',
  })
  opportunityCostBs: number;

  @ApiProperty({
    type: [CashierEfficiencyDto],
    description:
      'Ranking de cajeros activos ordenado por efficiencyScore descendente. ' +
      'Incluye todos los cajeros con role_id=3 y active=true. ' +
      'El rango de fechas del filtro (startDate/endDate) aplica a los turnos que se consideran. ' +
      'Sin filtro, considera todos los turnos cerrados históricos.',
  })
  cashierEfficiencyRanking: CashierEfficiencyDto[];
}

export class TabPrincipalResponseDto {
  @ApiProperty({
    type: ShiftStatusDto,
    description: 'Estado en tiempo real del turno activo.',
  })
  shiftStatus: ShiftStatusDto;

  @ApiProperty({
    type: HolisticKpisDto,
    description:
      'KPIs holísticos que cruzan múltiples dimensiones (inventario, caja y personal).',
  })
  holisticKpis: HolisticKpisDto;
}

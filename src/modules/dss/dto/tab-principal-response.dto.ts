import { ApiProperty } from '@nestjs/swagger';

export class CashierBreakdownDto {
  @ApiProperty({
    example: 95,
    description:
      'Ingresos del cajero relativos al que más vendió en el período. ' +
      'Fórmula: (ingresos_cajero / max_ingresos_grupo) × 100.',
  })
  salesScore: number;

  @ApiProperty({
    example: 93,
    description:
      'Precisión en arqueos. Igual que efficiencyScore: ' +
      'MAX(0, 100 − Σ|discrepancia| / Σventas × 1000).',
  })
  accuracyScore: number;

  @ApiProperty({
    example: 90,
    description:
      'Velocidad de atención: órdenes por hora de turno del cajero, ' +
      'normalizadas contra el más rápido del grupo. ' +
      'Fórmula: (órdenes/hora_cajero / max_órdenes/hora_grupo) × 100.',
  })
  speedScore: number;

  @ApiProperty({
    example: 94,
    description:
      'Calidad de manejo de efectivo: porcentaje de turnos sin alerta de descuadre ' +
      '(discrepancy_alert = false). ' +
      'Fórmula: turnos_sin_alerta / total_turnos × 100.',
  })
  cashHandlingScore: number;

  @ApiProperty({
    example: 92,
    description:
      'Constancia: turnos trabajados relativos al promedio del grupo de cajeros. ' +
      'Fórmula: MÍNIMO(100, turnos_cajero / promedio_turnos_grupo × 100).',
  })
  attendanceScore: number;
}

export class CashierEfficiencyDto {
  @ApiProperty({
    example: 'Ana López',
    description: 'Nombre completo del cajero (campo full_name del usuario).',
  })
  cashierName: string;

  @ApiProperty({
    example: 98,
    description:
      'Puntuación global de eficiencia (0–100). ' +
      'Fórmula: MAX(0, 100 − Σ|discrepancia| / Σventas × 1000). ' +
      'Solo considera turnos cerrados dentro del rango de fechas del filtro.',
  })
  efficiencyScore: number;

  @ApiProperty({
    type: CashierBreakdownDto,
    description: 'Desglose por dimensión para gráfico radar.',
  })
  breakdown: CashierBreakdownDto;
}

export class CashAccumulationPointDto {
  @ApiProperty({
    example: '13:00',
    description: 'Hora de inicio de la franja (inicio de hora completa). Formato HH:MM.',
  })
  hour: string;

  @ApiProperty({
    example: 1200,
    description:
      'Efectivo acumulado en caja hasta esa hora (Bs). ' +
      'Incluye el fondo inicial del turno + todos los pagos cash cobrados hasta ese momento. ' +
      'Fórmula: initial_fund + SUM acumulado de pagos en efectivo por hora.',
  })
  amountBs: number;
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
    description: 'Nombre completo del cajero con turno abierto. Null cuando isOpen es false.',
  })
  cashierName: string | null;

  @ApiProperty({
    example: 3500,
    description:
      'Monto total en efectivo (Bs) acumulado en el turno activo. ' +
      'Suma de order_payments.amount donde payment_method = "cash". 0 si no hay turno abierto.',
  })
  cashAccumulationBs: number;

  @ApiProperty({
    example: 85,
    description:
      'Score de riesgo de fatiga (0–100). ' +
      'Fórmula: MÍNIMO(100, horas_activas × 8 + pagos_cash_consecutivos × 3). ' +
      'Con crisisMode=true el umbral de alerta baja de 80 a 60. 0 si no hay turno abierto.',
  })
  fatigueRiskScore: number;

  @ApiProperty({
    type: [CashAccumulationPointDto],
    description:
      'Serie temporal del efectivo acumulado en caja durante el turno activo, agrupado por hora. ' +
      'Útil para graficar la curva de riesgo de efectivo a lo largo del día. ' +
      'Array vacío si no hay turno abierto o si no hay pagos en efectivo registrados.',
  })
  cashAccumulationHistory: CashAccumulationPointDto[];
}

export class HolisticKpisDto {
  @ApiProperty({
    example: 250.5,
    description:
      'Costo de oportunidad estimado (Bs) por productos actualmente con stock = 0. ' +
      'Fórmula: Σ (horas_sin_stock × tasa_ventas/hora × precio_venta). 0 si todo tiene stock.',
  })
  opportunityCostBs: number;

  @ApiProperty({
    type: [CashierEfficiencyDto],
    description:
      'Ranking de cajeros activos por efficiencyScore descendente. ' +
      'Incluye desglose por dimensión para gráfico radar.',
  })
  cashierEfficiencyRanking: CashierEfficiencyDto[];
}

export class TabPrincipalResponseDto {
  @ApiProperty({ type: ShiftStatusDto, description: 'Estado en tiempo real del turno activo.' })
  shiftStatus: ShiftStatusDto;

  @ApiProperty({
    type: HolisticKpisDto,
    description: 'KPIs holísticos que cruzan inventario, caja y personal.',
  })
  holisticKpis: HolisticKpisDto;
}

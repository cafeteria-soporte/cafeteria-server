import { ApiProperty } from '@nestjs/swagger';

class FinancialDetail {
    @ApiProperty({ example: 500.00, description: 'Fondo inicial del turno' })
    initialFund: number;

    @ApiProperty({ example: 3250.50, description: 'Monto esperado calculado por el sistema', nullable: true })
    expectedAmount: number | null;

    @ApiProperty({ example: 3200.00, description: 'Monto declarado por el cajero en el arqueo ciego', nullable: true })
    declaredAmount: number | null;

    @ApiProperty({ example: 50.50, description: 'Diferencia (expected - declared). Positivo = faltante, Negativo = sobrante', nullable: true })
    discrepancy: number | null;

    @ApiProperty({ example: true, description: 'Indica si la discrepancia supera el umbral de alerta' })
    discrepancyAlert: boolean;
}

class LossReason {
    @ApiProperty({ example: 'Producto dañado', description: 'Motivo de anulación' })
    reason: string;

    @ApiProperty({ example: 2, description: 'Cantidad de órdenes anuladas con este motivo' })
    count: number;

    @ApiProperty({ example: 80.00, description: 'Suma total anulada con este motivo' })
    totalAmount: number;
}

class LossesDetail {
    @ApiProperty({ example: 3, description: 'Total de órdenes anuladas en el turno' })
    totalVoidedOrders: number;

    @ApiProperty({ example: 125.00, description: 'Monto total anulado en el turno' })
    totalVoidedAmount: number;

    @ApiProperty({ type: [LossReason], description: 'Desglose por motivo de anulación' })
    reasons: LossReason[];
}

class PaymentMethodDetail {
    @ApiProperty({ example: 1, description: 'ID del método de pago' })
    paymentMethodId: number;

    @ApiProperty({ example: 'Efectivo', description: 'Nombre del método de pago' })
    paymentMethodName: string;

    @ApiProperty({ example: 25, description: 'Cantidad de pagos con este método' })
    count: number;

    @ApiProperty({ example: 1800.00, description: 'Monto total recaudado con este método' })
    totalAmount: number;

    @ApiProperty({ example: 55.4, description: 'Porcentaje que representa sobre el total recaudado' })
    percentage: number;
}

class PaymentsDetail {
    @ApiProperty({ example: 3250.50, description: 'Total recaudado en el turno' })
    totalCollected: number;

    @ApiProperty({ type: [PaymentMethodDetail], description: 'Desglose por método de pago' })
    methods: PaymentMethodDetail[];
}

export class ShiftSummaryDto {
    @ApiProperty({ example: 5, description: 'ID del turno' })
    shiftId: number;

    @ApiProperty({ example: 3, description: 'ID del cajero' })
    cashierId: number;

    @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del cajero' })
    cashierName: string;

    @ApiProperty({ example: 'jperez', description: 'Nombre de usuario del cajero' })
    cashierUsername: string;

    @ApiProperty({ example: '2026-05-15T08:00:00.000Z', description: 'Inicio del turno' })
    openedAt: string;

    @ApiProperty({ example: '2026-05-15T17:00:00.000Z', description: 'Cierre del turno' })
    closedAt: string;

    @ApiProperty({ type: FinancialDetail, description: 'Descuadre financiero del arqueo' })
    financial: FinancialDetail;

    @ApiProperty({ type: LossesDetail, description: 'Análisis de pérdidas por anulaciones' })
    losses: LossesDetail;

    @ApiProperty({ type: PaymentsDetail, description: 'Composición de ingresos por método de pago' })
    payments: PaymentsDetail;
}

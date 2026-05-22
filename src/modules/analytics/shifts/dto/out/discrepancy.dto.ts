import { ApiProperty } from '@nestjs/swagger';

export class DiscrepancyDto {
    @ApiProperty({ example: 5, description: 'ID del turno' })
    shiftRecordId: number;

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

    @ApiProperty({ example: 500.00, description: 'Fondo inicial' })
    initialFund: number;

    @ApiProperty({ example: 3250.50, description: 'Monto esperado calculado por el sistema', nullable: true })
    expectedAmount: number | null;

    @ApiProperty({ example: 3200.00, description: 'Monto declarado por el cajero al cerrar', nullable: true })
    declaredAmount: number | null;

    @ApiProperty({ example: 50.50, description: 'Diferencia entre monto esperado y declarado', nullable: true })
    discrepancy: number | null;

    @ApiProperty({ example: true, description: 'Indica si la discrepancia supera el umbral de alerta' })
    discrepancyAlert: boolean;
}

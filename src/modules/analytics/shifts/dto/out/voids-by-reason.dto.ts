import { ApiProperty } from '@nestjs/swagger';

export class VoidsByReasonDto {
    @ApiProperty({ example: 'Producto dañado', description: 'Motivo de anulación' })
    reason: string;

    @ApiProperty({ example: 15, description: 'Cantidad de órdenes anuladas con este motivo' })
    count: number;

    @ApiProperty({ example: 450.00, description: 'Suma total de las órdenes anuladas' })
    totalVoided: number;

    @ApiProperty({ example: 42.9, description: 'Porcentaje sobre el total de anulaciones' })
    percentage: number;
}

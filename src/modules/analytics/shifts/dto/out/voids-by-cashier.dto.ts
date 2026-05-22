import { ApiProperty } from '@nestjs/swagger';

export class VoidsByCashierDto {
    @ApiProperty({ example: 2, description: 'ID del cajero que anuló la orden' })
    cashierId: number;

    @ApiProperty({ example: 'jperez', description: 'Nombre de usuario del cajero' })
    cashierName: string;

    @ApiProperty({ example: 12, description: 'Cantidad de órdenes anuladas por este cajero' })
    count: number;

    @ApiProperty({ example: 380.00, description: 'Suma total de las órdenes anuladas' })
    totalVoided: number;
}

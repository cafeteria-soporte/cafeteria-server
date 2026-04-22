import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserOrderDto {
    @ApiProperty({ description: 'ID del turno abierto al que pertenece la orden', example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    shiftRecordId: number;
}

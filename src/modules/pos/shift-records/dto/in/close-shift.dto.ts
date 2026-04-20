import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseShiftDto {
  @ApiProperty({ example: 450.0, description: 'Monto declarado al cierre' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  declaredAmount: number;
}

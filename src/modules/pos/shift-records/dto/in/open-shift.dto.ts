import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ example: 200.0, description: 'Fondo inicial del turno' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  initialFund: number;
}

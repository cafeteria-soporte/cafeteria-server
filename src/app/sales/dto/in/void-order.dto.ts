import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VoidOrderDto {
  @ApiProperty({
    description: 'Motivo de la anulación (obligatorio)',
    example: 'Error en el producto ingresado',
  })
  @IsString()
  @MinLength(5)
  reason: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class StockMovementTypeDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  id: number;

  @ApiProperty({ example: 'sale' })
  @DtoField()
  name: string;
}

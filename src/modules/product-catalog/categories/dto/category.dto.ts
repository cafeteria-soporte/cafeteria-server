import { ApiProperty } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class CategoryDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  id: number;

  @ApiProperty({ example: 'Bebidas' })
  @DtoField()
  name: string;

  @ApiProperty({ example: true })
  @DtoField()
  active: boolean;
}

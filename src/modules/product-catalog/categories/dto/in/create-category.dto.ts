import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEmail,
  MinLength,
  IsInt,
  IsIn,
  IsOptional,
} from 'class-validator';
import { RolesEnum } from 'src/shared/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez García', maxLength: 150 })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required.' })
  @MaxLength(150, { message: 'Full name must not exceed 150 characters.' })
  fullName: string;

  @ApiProperty({ example: 'jperez', maxLength: 50 })
  @IsString()
  @IsNotEmpty({ message: 'Username is required.' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters.' })
  username: string;

  @ApiPropertyOptional({ example: 'juan.perez@cafeteria.com', maxLength: 150 })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters.' })
  email?: string;

  @ApiProperty({ example: 'temporal123', minLength: 8, maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters.' })
  password: string;

  @ApiProperty({
    example: 3,
    description: '2 = Administrador, 3 = Cajero',
    enum: [RolesEnum.ADMINISTRATOR, RolesEnum.CASHIER],
  })
  @IsInt({ message: 'Role ID must be an integer.' })
  @IsIn([RolesEnum.ADMINISTRATOR, RolesEnum.CASHIER], {
    message: 'Role ID must be 2 (administrator) or 3 (cashier).',
  })
  roleId: number;
}

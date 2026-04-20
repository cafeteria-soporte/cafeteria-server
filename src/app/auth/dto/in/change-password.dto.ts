import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'temporal123', description: 'Contraseña actual.' })
    @IsString()
    @IsNotEmpty({ message: 'Current password is required.' })
    currentPassword: string;

    @ApiProperty({ example: 'nuevaClave456', minLength: 8, maxLength: 20, description: 'Nueva contraseña.' })
    @IsString()
    @IsNotEmpty({ message: 'New password is required.' })
    @MinLength(8, { message: 'New password must be at least 8 characters.' })
    @MaxLength(20, { message: 'New password must not exceed 20 characters.' })
    newPassword: string;
}

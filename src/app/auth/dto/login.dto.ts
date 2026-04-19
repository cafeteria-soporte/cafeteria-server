import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'jperez' })
    @IsString()
    @IsNotEmpty({ message: 'Username is required.' })
    @MaxLength(50, { message: 'Username must not exceed 50 characters.' })
    username: string;

    @ApiProperty({ example: 'contraseña123' })
    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    password: string;
}

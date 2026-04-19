import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Refresh token recibido en el último login, register o refresh exitoso.',
    })
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required.' })
    refreshToken: string;
}

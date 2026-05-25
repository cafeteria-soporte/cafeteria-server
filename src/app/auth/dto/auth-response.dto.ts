import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from 'src/modules/user-management/users/dto/user.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'JWT de acceso (JWT_TIME_EXPIRE). Envíalo en cada request como Authorization: Bearer <token>.',
  })
  accessToken: string;

  @ApiProperty({
    example: true,
    description:
      'Si es true, el usuario debe cambiar su contraseña antes de usar el sistema.',
  })
  requiresPwdChange: boolean;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

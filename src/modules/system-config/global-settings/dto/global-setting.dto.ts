import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class GlobalSettingDto {
  @ApiProperty({ example: 'max_login_attempts' })
  @DtoField()
  key: string;

  @ApiProperty({ example: '5' })
  @DtoField()
  value: string;

  @ApiPropertyOptional({
    example: 'Intentos máximos antes de bloquear la cuenta',
  })
  @DtoField()
  description: string | null;

  @ApiProperty()
  @DtoField()
  updatedAt: Date;
}

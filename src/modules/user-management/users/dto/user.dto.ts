import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { RoleDto } from '../../roles/dto/role.dto';

export class UserDto {
  @ApiProperty({ example: 1, type: Number })
  @DtoField()
  id: number;

  @ApiProperty({ example: 'jperez', maxLength: 50 })
  @DtoField()
  username: string;

  @ApiProperty({ example: 'Juan Pérez García', maxLength: 150 })
  @DtoField()
  fullName: string;

  @ApiPropertyOptional({
    example: 'juan.perez@cafeteria.com',
    maxLength: 150,
    nullable: true,
  })
  @DtoField()
  email: string | null;

  @ApiProperty({ example: true })
  @DtoField()
  active: boolean;

  @ApiProperty({ type: RoleDto })
  @DtoRelation(() => RoleDto)
  role: RoleDto;
}

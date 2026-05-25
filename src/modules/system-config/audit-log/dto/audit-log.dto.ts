import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class AuditLogDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  id: number;

  @ApiPropertyOptional({ example: 'jperez' })
  @DtoField()
  usernameSnapshot: string | null;

  @ApiPropertyOptional({ example: 'cashier' })
  @DtoField()
  roleSnapshot: string | null;

  @ApiProperty({ example: 'sale_paid' })
  @DtoField()
  action: string;

  @ApiProperty({ example: 'POS' })
  @DtoField()
  module: string;

  @ApiPropertyOptional({ example: 'user_orders' })
  @DtoField()
  affectedEntity: string | null;

  @ApiPropertyOptional({ example: 42 })
  @DtoField()
  entityId: number | null;

  @ApiPropertyOptional()
  @DtoField()
  previousValue: string | null;

  @ApiPropertyOptional()
  @DtoField()
  newValue: string | null;

  @ApiProperty()
  @DtoField()
  createdAt: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { UserDto } from 'src/modules/user-management/users/dto/user.dto';

export class UserOrderDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  id: number;

  @ApiProperty({ example: 1 })
  @DtoField()
  shiftRecordId: number;

  @ApiProperty({ example: 1 })
  @DtoField()
  cashierId: number;

  @ApiProperty({ example: 'REC-000001' })
  @DtoField()
  receiptNumber: string;

  @ApiProperty({ example: 45.5 })
  @DtoField()
  total: number;

  @ApiProperty({ example: 'open', enum: ['open', 'paid', 'voided'] })
  @DtoField()
  status: string;

  @ApiPropertyOptional({ example: 'Error de ingreso' })
  @DtoField()
  voidReason: string | null;

  @ApiProperty()
  @DtoField()
  createdAt: Date;

  @ApiProperty({ type: () => UserDto })
  @DtoRelation(() => UserDto)
  cashier: UserDto;
}

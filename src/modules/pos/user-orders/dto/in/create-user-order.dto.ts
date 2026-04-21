import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  shiftRecordId: number;

  @ApiProperty({ example: 'TICKET-001' })
  @IsString()
  @IsNotEmpty()
  receiptNumber: string;
}

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateUserOrderDto } from './create-user-order.dto';

export class UpdateUserOrderDto extends PartialType(CreateUserOrderDto) {
  @ApiPropertyOptional({ example: 'paid', enum: ['open', 'paid', 'voided'] })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'paid', 'voided'])
  status?: string;

  @ApiPropertyOptional({ example: 'Error de digitación' })
  @IsOptional()
  @IsString()
  voidReason?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { DtoField } from 'src/shared';

export class RoleDto {
    @ApiProperty({ example: 2 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'administrator', enum: ['root', 'administrator', 'cashier'] })
    @DtoField()
    name: string;
}
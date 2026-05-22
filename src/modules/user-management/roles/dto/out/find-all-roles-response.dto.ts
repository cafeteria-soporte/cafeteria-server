import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { RoleDto } from '../role.dto';

export class FindAllRolesResponseDto extends PaginationResponseDto<RoleDto> {
    @ApiProperty({ type: [RoleDto] })
    declare data: RoleDto[];
}

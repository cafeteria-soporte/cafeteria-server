import { PaginationResponseDto } from 'src/shared';
import { UserDto } from '../user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllUsersResponseDto extends PaginationResponseDto<UserDto> {
  @ApiProperty({
    description: 'users',
    type: [UserDto],
  })
  declare data: UserDto[];
}

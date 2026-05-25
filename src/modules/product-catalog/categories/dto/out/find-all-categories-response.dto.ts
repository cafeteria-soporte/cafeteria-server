import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { CategoryDto } from '../category.dto';

export class FindAllCategoriesResponseDto extends PaginationResponseDto<CategoryDto> {
  @ApiProperty({ type: [CategoryDto] })
  declare data: CategoryDto[];
}

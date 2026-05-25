import { extend } from 'joi';
import { PaginationResponseDto } from 'src/shared';
import { ProductDto } from '../product.dto';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllProductsResponseDto extends PaginationResponseDto<ProductDto> {
  @ApiProperty({
    description: 'Products',
    type: [ProductDto],
  })
  declare data: ProductDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { ProductDto } from 'src/modules/product-catalog/products/dto/product.dto';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @DtoField()
  userOrderId: number;

  @ApiProperty({ example: 3 })
  @DtoField()
  productId: number;

  @ApiProperty({ example: 2 })
  @DtoField()
  quantity: number;

  @ApiProperty({ example: 15.5 })
  @DtoField()
  unitPrice: number;

  @ApiProperty({ example: 31.0 })
  @DtoField()
  subtotal: number;

  @ApiProperty({ type: () => ProductDto })
  @DtoRelation(() => ProductDto)
  product: ProductDto;
}

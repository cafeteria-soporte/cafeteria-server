import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly service: ProductsService) {}
}

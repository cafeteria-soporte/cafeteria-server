import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/in/create-product.dto';
import { UpdateProductDto } from '../dto/in/update-product.dto';
import { ProductDto } from '../dto/product.dto';
import { AdministratorUp, CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import { FindAllProductsResponseDto } from '../dto/out/find-all-products-response.dto';
import { FindProductsDto } from '../dto/in/find-products.dto';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('Catalog - Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @AdministratorUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiCreatedResponse({ type: ProductDto })
  create(@CurrentUser() currentUser: AuthUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(dto, currentUser);
  }

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar todos los productos activos' })
  @ApiOkResponse({ type: FindAllProductsResponseDto })
  findAll(@Query() params: FindProductsDto) {
    return this.productsService.findAll(params);
  }

  @Get(':id')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiOkResponse({ type: ProductDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id, { dto: ProductDto, throwException: true });
  }

  @Patch(':id')
  @AdministratorUp()
  @ApiOkResponse({ type: ProductDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @AdministratorUp()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser, // ✅
  ) {
    return this.productsService.remove(id, currentUser);
  }
}

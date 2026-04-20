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
import { PaginationParamsDto } from 'src/shared';

@ApiTags('Catalog - Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @AdministratorUp() // solo admin
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiCreatedResponse({ type: ProductDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @CashierUp()
  @ApiOperation({ summary: 'Listar todos los productos activos' })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  findAll(@Query() pagination: PaginationParamsDto) {
    return this.productsService.findAll(pagination);
  }

  @Get(':id')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiOkResponse({ type: ProductDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @AdministratorUp()
  @ApiOperation({ summary: 'Actualizar datos de un producto' })
  @ApiOkResponse({ type: ProductDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @AdministratorUp()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar un producto (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

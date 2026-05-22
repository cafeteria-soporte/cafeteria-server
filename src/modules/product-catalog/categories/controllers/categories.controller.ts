import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AdministratorUp, CashierUp } from 'src/app/auth/decorators/roles.decorator';
import { ApiNotFound, ApiValidationError, ApiConflict } from 'src/shared/utils/swagger';
import { CategoriesService } from '../services/categories.service';
import { CategoryDto } from '../dto/category.dto';
import { CreateCategoryDto } from '../dto/in/create-category.dto';
import { UpdateCategoryDto } from '../dto/in/update-category.dto';
import { FindCategoriesDto } from '../dto/in/find-categories.dto';
import { FindAllCategoriesResponseDto } from '../dto/out/find-all-categories-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) {}

    @CashierUp()
    @Get()
    @ApiOperation({ summary: 'Listar categorías paginadas' })
    @ApiOkResponse({ type: FindAllCategoriesResponseDto })
    findAll(@Query() params: FindCategoriesDto): Promise<FindAllCategoriesResponseDto> {
        return this.service.findAll(params);
    }

    @CashierUp()
    @Get(':id')
    @ApiOperation({ summary: 'Obtener categoría por ID' })
    @ApiOkResponse({ type: CategoryDto })
    @ApiNotFound()
    findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryDto> {
        return this.service.findOne(id, { dto: CategoryDto, throwException: true }) as Promise<CategoryDto>;
    }

    @AdministratorUp()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear categoría' })
    @ApiCreatedResponse({ type: CategoryDto })
    @ApiValidationError()
    @ApiConflict()
    create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
        return this.service.create(dto);
    }

    @AdministratorUp()
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar nombre o estado activo de una categoría' })
    @ApiOkResponse({ type: CategoryDto })
    @ApiNotFound()
    @ApiValidationError()
    @ApiConflict()
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.service.update(id, dto);
    }
}

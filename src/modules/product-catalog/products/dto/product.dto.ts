import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { CategoryDto } from '../../categories/dto/category.dto';

export class ProductDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'Café con leche' })
    @DtoField()
    name: string;

    @ApiPropertyOptional({ example: 'Café espresso con leche entera' })
    @DtoField()
    description: string | null;

    @ApiProperty({ example: 15.50 })
    @DtoField()
    salePrice: number;

    @ApiProperty({ example: 20 })
    @DtoField()
    currentStock: number;

    @ApiProperty({ example: 5 })
    @DtoField()
    minStock: number;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/cafe.jpg' })
    @DtoField()
    imageUrl: string | null;

    @ApiProperty({ example: true })
    @DtoField()
    active: boolean;

    @ApiProperty({ type: () => CategoryDto })
    @DtoRelation(() => CategoryDto)
    category: CategoryDto;
}

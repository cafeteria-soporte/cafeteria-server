import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) {}
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
    private readonly repo: DtoRepository<Category>;

    constructor(
        @InjectRepository(Category)
        private readonly rawRepo: Repository<Category>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

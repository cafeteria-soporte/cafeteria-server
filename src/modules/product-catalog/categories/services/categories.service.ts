import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { DtoRepository, FindOptions } from 'src/shared';
import { Category } from '../entities/category.entity';
import { CategoryDto } from '../dto/category.dto';
import { CreateCategoryDto } from '../dto/in/create-category.dto';
import { UpdateCategoryDto } from '../dto/in/update-category.dto';
import { FindCategoriesDto } from '../dto/in/find-categories.dto';
import { FindAllCategoriesResponseDto } from '../dto/out/find-all-categories-response.dto';
import { CategoryNotFoundException, CategoryNameConflictException } from '../exceptions';

@Injectable()
export class CategoriesService {
    private readonly repo: DtoRepository<Category>;

    constructor(
        @InjectRepository(Category)
        private readonly rawRepo: Repository<Category>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(params: FindCategoriesDto): Promise<FindAllCategoriesResponseDto> {
        const where: Record<string, any> = {};
        if (params.name   !== undefined) where['name']   = ILike(`%${params.name}%`);
        if (params.active !== undefined) where['active'] = params.active;

        return this.repo.findPaginated({
            dto:        CategoryDto,
            pagination: params,
            where,
            order:      { name: 'ASC' },
        }) as Promise<FindAllCategoriesResponseDto>;
    }

    async findOne<T = CategoryDto>(id: number, options: FindOptions<T> = { dto: CategoryDto as any, throwException: true }): Promise<T | null> {
        const result = await this.repo.findOne({ dto: options.dto, where: { id } });
        if (!result && options.throwException !== false) throw new CategoryNotFoundException();
        return result;
    }

    async create(dto: CreateCategoryDto): Promise<CategoryDto> {
        const existing = await this.rawRepo.findOne({ where: { name: dto.name } });
        if (existing) throw new CategoryNameConflictException();

        const category = this.rawRepo.create({ name: dto.name.trim(), active: dto.active ?? true });
        const saved = await this.rawRepo.save(category);
        return this.findOne(saved.id) as Promise<CategoryDto>;
    }

    async update(id: number, dto: UpdateCategoryDto): Promise<CategoryDto> {
        await this.findOne(id);

        if (dto.name !== undefined) {
            const conflict = await this.rawRepo.findOne({ where: { name: dto.name } });
            if (conflict && conflict.id !== id) throw new CategoryNameConflictException();
        }

        await this.rawRepo.update(id, {
            ...(dto.name   !== undefined && { name: dto.name.trim() }),
            ...(dto.active !== undefined && { active: dto.active }),
        });

        return this.findOne(id) as Promise<CategoryDto>;
    }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, Repository } from 'typeorm';
import { DtoRepository, FindOptions, MutationOptions } from 'src/shared';
import { Product } from '../entities/product.entity';
import { ProductDto } from '../dto/product.dto';
import { CreateProductDto } from '../dto/in/create-product.dto';
import { UpdateProductDto } from '../dto/in/update-product.dto';
import { FindProductsDto } from '../dto/in/find-products.dto';
import { FindAllProductsResponseDto } from '../dto/out/find-all-products-response.dto';
import { ProductNotFoundException } from '../exceptions';
import { CategoriesService } from '../../categories/services/categories.service';
import { CategoryDto } from '../../categories/dto/category.dto';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction, AuditModule } from 'src/modules/system-config/audit-log/enums';
import { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

const ROLE_NAMES: Record<number, string> = { 1: 'root', 2: 'administrator', 3: 'cashier' };

@Injectable()
export class ProductsService {
    private readonly repo: DtoRepository<Product>;
    private readonly rawRepo: Repository<Product>;

    constructor(
        @InjectRepository(Product) rawRepo: Repository<Product>,
        private readonly categoriesService: CategoriesService,
        private readonly auditLog: AuditLogService,
    ) {
        this.repo = new DtoRepository(rawRepo);
        this.rawRepo = rawRepo;
    }

    async findAll(params: FindProductsDto): Promise<FindAllProductsResponseDto> {
        const where: Record<string, any> = {};
        if (params.name       !== undefined) where['name']       = ILike(`%${params.name}%`);
        if (params.active     !== undefined) where['active']     = params.active;
        if (params.categoryId !== undefined) where['categoryId'] = params.categoryId;

        return this.repo.findPaginated({
            dto:        ProductDto,
            pagination: params,
            where,
            order:      { name: 'ASC' },
        }) as Promise<FindAllProductsResponseDto>;
    }

    async findOne<T = ProductDto>(id: number, options: FindOptions<T> = { dto: ProductDto as any, throwException: true }): Promise<T | null> {
        const result = await this.repo.findOne({ dto: options.dto, where: { id } });
        if (!result && options.throwException !== false) throw new ProductNotFoundException();
        return result;
    }

    async create(dto: CreateProductDto, actingUser: AuthUser): Promise<ProductDto> {
        await this.categoriesService.findOne(dto.categoryId, { dto: CategoryDto, throwException: true });

        const product = this.rawRepo.create({
            categoryId:  dto.categoryId,
            name:        dto.name.trim(),
            description: dto.description ?? null,
            salePrice:   dto.salePrice,
            minStock:    dto.minStock  ?? 0,
            imageUrl:    dto.imageUrl  ?? null,
            active:      dto.active    ?? true,
        });
        await this.rawRepo.save(product);

        await this.auditLog.create({
            action:           AuditAction.PRODUCT_CREATED,
            module:           AuditModule.PRODUCTS,
            userId:           actingUser.id,
            usernameSnapshot: actingUser.username,
            roleSnapshot:     ROLE_NAMES[actingUser.roleId],
            affectedEntity:   'products',
            entityId:         product.id,
            newValue:         dto.name,
        });

        const result = await this.repo.findOne({ dto: ProductDto, where: { id: product.id } });
        if (!result) throw new InternalServerErrorException('Product could not be retrieved after creation.');
        return result;
    }

    async update(id: number, dto: UpdateProductDto, actingUser: AuthUser): Promise<ProductDto> {
        const old = await this.findOne(id) as ProductDto;

        if (dto.categoryId !== undefined) {
            await this.categoriesService.findOne(dto.categoryId, { dto: CategoryDto, throwException: true });
        }

        await this.rawRepo.update(id, {
            ...(dto.categoryId  !== undefined && { categoryId:  dto.categoryId }),
            ...(dto.name        !== undefined && { name:        dto.name.trim() }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.salePrice   !== undefined && { salePrice:   dto.salePrice }),
            ...(dto.minStock    !== undefined && { minStock:     dto.minStock }),
            ...(dto.imageUrl    !== undefined && { imageUrl:     dto.imageUrl }),
            ...(dto.active      !== undefined && { active:       dto.active }),
        });

        if (dto.salePrice !== undefined && dto.salePrice !== old.salePrice) {
            await this.auditLog.create({
                action:           AuditAction.PRICE_CHANGED,
                module:           AuditModule.PRODUCTS,
                userId:           actingUser.id,
                usernameSnapshot: actingUser.username,
                roleSnapshot:     ROLE_NAMES[actingUser.roleId],
                affectedEntity:   'products',
                entityId:         id,
                previousValue:    old.salePrice.toString(),
                newValue:         dto.salePrice.toString(),
            });
        }

        return this.findOne(id) as Promise<ProductDto>;
    }

    async remove(id: number, actingUser: AuthUser): Promise<void> {
        await this.findOne(id);
        await this.rawRepo.update(id, { active: false });

        await this.auditLog.create({
            action:           AuditAction.PRODUCT_DEACTIVATED,
            module:           AuditModule.PRODUCTS,
            userId:           actingUser.id,
            usernameSnapshot: actingUser.username,
            roleSnapshot:     ROLE_NAMES[actingUser.roleId],
            affectedEntity:   'products',
            entityId:         id,
        });
    }

    async findLowStock(): Promise<ProductDto[]> {
        const entities = await this.rawRepo.createQueryBuilder('p')
            .where('p.active = true')
            .andWhere('p.current_stock <= p.min_stock')
            .orderBy('p.name', 'ASC')
            .getMany();

        return Promise.all(entities.map(e => this.repo.findOne({ dto: ProductDto, where: { id: e.id } })))
            .then(results => results.filter(Boolean) as ProductDto[]);
    }

    async findCurrentStock(productId: number, options?: MutationOptions): Promise<number> {
        const manager: EntityManager = options?.manager ?? this.rawRepo.manager;
        const product = await manager.findOne(Product, {
            where: { id: productId },
            select: { id: true, currentStock: true },
        });
        if (!product) throw new ProductNotFoundException();
        return product.currentStock;
    }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  DtoRepository,
  MutationOptions,
  PaginationParamsDto,
  PaginationResponseDto,
} from 'src/shared';
import { Product } from '../entities/product.entity';
import { ProductDto } from '../dto/product.dto';
import { CreateProductDto } from '../dto/in/create-product.dto';
import { UpdateProductDto } from '../dto/in/update-product.dto';
import { ProductNotFoundException } from '../exceptions';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import {
  AuditAction,
  AuditModule,
} from 'src/modules/system-config/audit-log/enums';
import { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@Injectable()
export class ProductsService {
  private readonly repo: DtoRepository<Product>;
  private readonly rawRepo: Repository<Product>;

  constructor(
    @InjectRepository(Product) rawRepo: Repository<Product>,
    private readonly auditLog: AuditLogService,
  ) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async create(
    dto: CreateProductDto,
    currentUser: AuthUser,
  ): Promise<ProductDto> {
    const product = this.rawRepo.create(dto);
    await this.rawRepo.save(product);

    await this.auditLog.create({
      action: AuditAction.PRODUCT_CREATED,
      module: AuditModule.PRODUCTS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: currentUser.roleId.toString(),
      affectedEntity: 'Product',
      entityId: product.id,
      previousValue: null,
      newValue: dto.name,
    });

    const result = await this.repo.findOne({
      dto: ProductDto,
      where: { id: product.id },
    });
    if (!result)
      throw new InternalServerErrorException(
        'Product could not be retrieved after creation.',
      );
    return result;
  }

  async findAll(
    pagination: PaginationParamsDto,
  ): Promise<PaginationResponseDto<ProductDto>> {
    return this.repo.findPaginated({
      dto: ProductDto,
      pagination,
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ProductDto> {
    const product = await this.repo.findOne({ dto: ProductDto, where: { id } });
    if (!product) throw new ProductNotFoundException();
    return product;
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    currentUser: AuthUser,
  ): Promise<ProductDto> {
    const old = await this.findOne(id);

    await this.rawRepo.update(id, dto);

    if (dto.salePrice !== undefined && dto.salePrice !== old.salePrice) {
      await this.auditLog.create({
        action: AuditAction.PRICE_CHANGED,
        module: AuditModule.PRODUCTS,
        userId: currentUser.id,
        usernameSnapshot: currentUser.username,
        roleSnapshot: currentUser.roleId.toString(),
        affectedEntity: 'Product',
        entityId: id,
        previousValue: old.salePrice.toString(),
        newValue: dto.salePrice.toString(),
      });
    }

    return this.findOne(id);
  }

  async remove(id: number, currentUser: AuthUser): Promise<void> {
    await this.findOne(id);

    await this.rawRepo.update(id, { active: false });

    await this.auditLog.create({
      action: AuditAction.PRODUCT_DEACTIVATED,
      module: AuditModule.PRODUCTS,
      userId: currentUser.id,
      usernameSnapshot: currentUser.username,
      roleSnapshot: currentUser.roleId.toString(),
      affectedEntity: 'Product',
      entityId: id,
      previousValue: 'active',
      newValue: 'inactive',
    });
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

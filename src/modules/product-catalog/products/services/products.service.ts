import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class ProductsService {
  private readonly repo: DtoRepository<Product>;
  private readonly rawRepo: Repository<Product>;

  constructor(@InjectRepository(Product) rawRepo: Repository<Product>) {
    this.repo = new DtoRepository(rawRepo);
    this.rawRepo = rawRepo;
  }

  async create(dto: CreateProductDto): Promise<ProductDto> {
    const product = this.rawRepo.create(dto);
    await this.rawRepo.save(product);

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

  async update(id: number, dto: UpdateProductDto): Promise<ProductDto> {
    await this.findOne(id);
    await this.rawRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.rawRepo.update(id, { active: false });
  }

  async findCurrentStock(productId: number, options?: MutationOptions): Promise<number> {
    const manager = options?.manager ?? this.rawRepo.manager;
    const product = await manager.findOne(Product, {
      where: { id: productId },
      select: { id: true, currentStock: true },
    });
    if (!product) throw new ProductNotFoundException();
    return product.currentStock;
  }
}

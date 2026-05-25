import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { DtoRepository, FindOptions } from 'src/shared';
import { Role } from '../entities/role.entity';
import { RoleDto } from '../dto/role.dto';
import { FindRolesDto } from '../dto/in/find-roles.dto';
import { FindAllRolesResponseDto } from '../dto/out/find-all-roles-response.dto';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';

@Injectable()
export class RolesService {
  private readonly repo: DtoRepository<Role>;

  constructor(
    @InjectRepository(Role)
    private readonly rawRepo: Repository<Role>,
  ) {
    this.repo = new DtoRepository(rawRepo);
  }

  async findAll(params: FindRolesDto): Promise<FindAllRolesResponseDto> {
    const where: Record<string, any> = {};
    if (params.name !== undefined) where['name'] = ILike(`%${params.name}%`);

    return this.repo.findPaginated({
      dto: RoleDto,
      pagination: params,
      where,
      order: { id: 'ASC' },
    }) as Promise<FindAllRolesResponseDto>;
  }

  async findOne<T = RoleDto>(
    id: number,
    options: FindOptions<T> = { dto: RoleDto as any, throwException: true },
  ): Promise<T | null> {
    const result = await this.repo.findOne({ dto: options.dto, where: { id } });
    if (!result && options.throwException !== false)
      throw new RoleNotFoundException();
    return result;
  }
}

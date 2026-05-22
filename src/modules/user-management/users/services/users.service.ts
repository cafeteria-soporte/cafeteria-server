import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { DtoRepository, FindOptions, PaginationResponseDto } from 'src/shared';
import {
    UserNotFoundException,
    UsernameAlreadyTakenException,
    CannotDeactivateSelfException,
    InsufficientRoleException,
} from '../exceptions';
import { CreateUserDto } from '../dto/in/create-user.dto';
import { FindUsersDto } from '../dto/in/find-users.dto';
import { UserAuthDto } from '../dto/user-auth.dto';
import { UserDto } from '../dto/user.dto';
import { hashPassword } from 'src/shared/utils/crypto.util';
import { RolesService } from '../../roles/services/roles.service';
import { RoleDto } from '../../roles/dto/role.dto';

@Injectable()
export class UsersService {
    private readonly repo: DtoRepository<User>;

    constructor(
        @InjectRepository(User)
        private readonly rawRepo: Repository<User>,
        private readonly rolesService: RolesService,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(params: FindUsersDto): Promise<PaginationResponseDto<UserDto>> {
        return this.repo.findPaginated({
            dto:        UserDto,
            pagination: params,
            where: {
                ...(params.active !== undefined && { active: params.active }),
                ...(params.roleId !== undefined && { roleId: params.roleId }),
            },
            order: { id: 'ASC' },
        });
    }

    async findOneById<T>(id: number, options: FindOptions<T>): Promise<T | null> {
        const user = await this.repo.findOne({ dto: options.dto, where: { id } });
        if (options.throwException && !user) throw new UserNotFoundException();
        return user;
    }

    async findOneByUsername<T>(username: string, options: FindOptions<T>): Promise<T | null> {
        const user = await this.repo.findOne({ dto: options.dto, where: { username } });
        if (options.throwException && !user) throw new UserNotFoundException();
        return user;
    }

    async create<T>(data: CreateUserDto, createdById: number | null, dto: new () => T): Promise<T> {
        await this.rolesService.findOne(data.roleId, { dto: RoleDto, throwException: true });

        const exists = await this.findOneByUsername(data.username.trim(), {
            throwException: false,
            dto: UserAuthDto,
        });
        if (exists) throw new UsernameAlreadyTakenException();

        const user        = new User();
        user.fullName     = data.fullName.trim();
        user.username     = data.username.trim();
        user.email        = data.email?.trim() ?? null;
        user.passwordHash = await hashPassword(data.password);
        user.roleId       = data.roleId;
        user.createdById  = createdById;

        const saved = await this.rawRepo.save(user);
        return (await this.findOneById(saved.id, { throwException: false, dto }))!;
    }

    async updatePassword(userId: number, newHash: string, requiresPwdChange: boolean): Promise<void> {
        await this.rawRepo.update(userId, { passwordHash: newHash, requiresPwdChange });
    }

    async deactivate(targetId: number, actorId: number, actorRoleId: number): Promise<void> {
        if (actorId === targetId) throw new CannotDeactivateSelfException();

        const target = await this.findOneById(targetId, { dto: UserDto, throwException: true });
        if (actorRoleId >= target!.role.id) throw new InsufficientRoleException();

        await this.rawRepo.update(targetId, { active: false });
    }

    async updateLoginAttempts(userId: number, failedAttempts: number, lockedUntil: Date | null): Promise<void> {
        await this.rawRepo.update(userId, { failedAttempts, lockedUntil });
    }

    async resetLoginAttempts(userId: number): Promise<void> {
        await this.rawRepo.update(userId, { failedAttempts: 0, lockedUntil: null });
    }
}

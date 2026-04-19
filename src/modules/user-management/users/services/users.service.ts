import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { DtoRepository, FindOptions } from 'src/shared';
import { UserNotFoundException, UsernameAlreadyTakenException } from '../exceptions';
import { CreateUserDto } from '../dto/in/create-user.dto';
import { UserAuthDto } from '../dto/user-auth.dto';
import { hashPassword } from 'src/shared/utils/crypto.util';

@Injectable()
export class UsersService {
    private readonly repo: DtoRepository<User>;

    constructor(
        @InjectRepository(User)
        private readonly rawRepo: Repository<User>,
    ) {
        this.repo = new DtoRepository(rawRepo);
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
        const exists = await this.findOneByUsername(data.username.trim(), {
            throwException: false,
            dto: UserAuthDto,
        });
        if (exists) throw new UsernameAlreadyTakenException();

        const user = new User();
        user.fullName = data.fullName.trim();
        user.username = data.username.trim();
        user.email = data.email?.trim() ?? null;
        user.passwordHash = await hashPassword(data.password);
        user.roleId = data.roleId;
        user.createdById = createdById;

        const saved = await this.rawRepo.save(user);
        return (await this.findOneById(saved.id, { throwException: false, dto }))!;
    }

    async updateLoginAttempts(userId: number, failedAttempts: number, lockedUntil: Date | null): Promise<void> {
        await this.rawRepo.update(userId, { failedAttempts, lockedUntil });
    }

    async resetLoginAttempts(userId: number): Promise<void> {
        await this.rawRepo.update(userId, { failedAttempts: 0, lockedUntil: null });
    }
}

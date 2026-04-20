import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ChangePasswordDto } from '../dto/in/change-password.dto';
import { JwtPayload } from '../strategies/jwt.strategy';
import { comparePassword, hashPassword } from 'src/shared/utils/crypto.util';
import { UsersService } from 'src/modules/user-management/users/services/users.service';
import { FindOptions } from 'src/shared';
import { UserAuthDto } from 'src/modules/user-management/users/dto/user-auth.dto';
import { UserDto } from 'src/modules/user-management/users/dto/user.dto';
import { CreateUserDto } from 'src/modules/user-management/users/dto/in/create-user.dto';
import { InvalidCredentialsException, AccountLockedException, AccountInactiveException, IncorrectPasswordException } from '../exceptions';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 30 * 60 * 1000;

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginDto): Promise<AuthResponseDto> {
        const opts: FindOptions<UserAuthDto> = { throwException: false, dto: UserAuthDto };
        const user = await this.usersService.findOneByUsername(dto.username, opts);

        if (!user) throw new InvalidCredentialsException();
        if (!user.active) throw new AccountInactiveException();
        if (user.lockedUntil && user.lockedUntil > new Date()) throw new AccountLockedException();

        const passwordMatch = await comparePassword(dto.password, user.passwordHash);

        if (!passwordMatch) {
            const newAttempts = user.failedAttempts + 1;
            const lockedUntil = newAttempts >= MAX_LOGIN_ATTEMPTS
                ? new Date(Date.now() + LOCK_DURATION_MS)
                : null;
            await this.usersService.updateLoginAttempts(user.id, newAttempts, lockedUntil);
            throw new InvalidCredentialsException();
        }

        await this.usersService.resetLoginAttempts(user.id);

        const payload: JwtPayload = {
            sub:               user.id,
            username:          user.username,
            roleId:            user.role.id,
            requiresPwdChange: user.requiresPwdChange,
        };

        const userDtoOpts: FindOptions<UserDto> = { throwException: false, dto: UserDto };

        return {
            accessToken:       this.jwtService.sign(payload),
            requiresPwdChange: user.requiresPwdChange,
            user:              (await this.usersService.findOneById(user.id, userDtoOpts))!,
        };
    }

    async register(dto: CreateUserDto, createdById: number): Promise<UserDto> {
        return this.usersService.create(dto, createdById, UserDto);
    }

    async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
        const opts: FindOptions<UserAuthDto> = { throwException: true, dto: UserAuthDto };
        const user = await this.usersService.findOneById(userId, opts);

        const match = await comparePassword(dto.currentPassword, user!.passwordHash);
        if (!match) throw new IncorrectPasswordException();

        const newHash = await hashPassword(dto.newPassword);
        await this.usersService.updatePassword(userId, newHash, false);
    }

    async logout(): Promise<void> { }
}

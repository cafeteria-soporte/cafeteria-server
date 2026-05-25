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
import {
  InvalidCredentialsException,
  AccountLockedException,
  AccountInactiveException,
  IncorrectPasswordException,
} from '../exceptions';
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';
import { AuthUser } from '../strategies/jwt.strategy';
import { GlobalSettingsService } from 'src/modules/system-config/global-settings/services/global-settings.service';

const ROLE_NAMES: Record<number, string> = {
  1: 'root',
  2: 'administrator',
  3: 'cashier',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditLog: AuditLogService,
    private readonly globalSettings: GlobalSettingsService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const opts: FindOptions<UserAuthDto> = {
      throwException: false,
      dto: UserAuthDto,
    };
    const user = await this.usersService.findOneByUsername(dto.username, opts);

    if (!user) {
      await this.auditLog.create({
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
        usernameSnapshot: dto.username,
      });
      throw new InvalidCredentialsException();
    }

    if (!user.active) throw new AccountInactiveException();
    if (user.lockedUntil && user.lockedUntil > new Date())
      throw new AccountLockedException();

    const passwordMatch = await comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatch) {
      const maxAttemptsStr =
        await this.globalSettings.findValueByKey('max_login_attempts');
      const sessionTimeoutStr = await this.globalSettings.findValueByKey(
        'session_timeout_minutes',
      );
      const maxAttempts = parseInt(maxAttemptsStr ?? '5', 10);
      const lockMs = parseInt(sessionTimeoutStr ?? '30', 10) * 60 * 1000;
      const newAttempts = user.failedAttempts + 1;
      const lockedUntil =
        newAttempts >= maxAttempts ? new Date(Date.now() + lockMs) : null;
      await this.usersService.updateLoginAttempts(
        user.id,
        newAttempts,
        lockedUntil,
      );
      await this.auditLog.create({
        userId: user.id,
        usernameSnapshot: user.username,
        roleSnapshot: user.role.name,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
      });
      throw new InvalidCredentialsException();
    }

    await this.usersService.resetLoginAttempts(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roleId: user.role.id,
      requiresPwdChange: user.requiresPwdChange,
    };

    await this.auditLog.create({
      userId: user.id,
      usernameSnapshot: user.username,
      roleSnapshot: user.role.name,
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
    });

    const userDtoOpts: FindOptions<UserDto> = {
      throwException: false,
      dto: UserDto,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      requiresPwdChange: user.requiresPwdChange,
      user: await this.usersService.findOneById(user.id, userDtoOpts),
    };
  }

  async register(
    dto: CreateUserDto,
    createdById: number,
    actingUser: AuthUser,
  ): Promise<UserDto> {
    const created = await this.usersService.create(dto, createdById, UserDto);
    await this.auditLog.create({
      userId: actingUser.id,
      usernameSnapshot: actingUser.username,
      roleSnapshot: ROLE_NAMES[actingUser.roleId],
      action: AuditAction.USER_CREATED,
      module: AuditModule.USERS,
      affectedEntity: 'users',
      entityId: created.id,
      newValue: created.username,
    });
    return created;
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
    actingUser: AuthUser,
  ): Promise<void> {
    const opts: FindOptions<UserAuthDto> = {
      throwException: true,
      dto: UserAuthDto,
    };
    const user = await this.usersService.findOneById(userId, opts);

    const match = await comparePassword(dto.currentPassword, user.passwordHash);
    if (!match) throw new IncorrectPasswordException();

    const newHash = await hashPassword(dto.newPassword);
    await this.usersService.updatePassword(userId, newHash, false);

    await this.auditLog.create({
      userId: actingUser.id,
      usernameSnapshot: actingUser.username,
      roleSnapshot: ROLE_NAMES[actingUser.roleId],
      action: AuditAction.PASSWORD_CHANGED,
      module: AuditModule.AUTH,
      affectedEntity: 'users',
      entityId: userId,
    });
  }

  async logout(actingUser: AuthUser): Promise<void> {
    await this.auditLog.create({
      userId: actingUser.id,
      usernameSnapshot: actingUser.username,
      roleSnapshot: ROLE_NAMES[actingUser.roleId],
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
    });
  }
}

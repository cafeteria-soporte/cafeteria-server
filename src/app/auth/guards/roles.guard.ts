import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRol = this.reflector.getAllAndOverride<number>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRol === undefined) return true;

    const { user }: { user: AuthUser } = context.switchToHttp().getRequest();

    if (!user) return true;

    if (user.roleId <= requiredRol) return true;

    throw new ForbiddenException({
      message: 'You do not have permission to perform this action.',
      error: 'FORBIDDEN',
    });
  }
}

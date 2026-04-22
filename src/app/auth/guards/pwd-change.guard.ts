import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './jwt-auth.guard';
import { AuthUser } from '../strategies/jwt.strategy';

const CHANGE_PASSWORD_PATH = '/auth/change-password';

@Injectable()
export class PwdChangeGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest<{ user?: AuthUser; path: string }>();
        const user: AuthUser | undefined = request.user;

        if (!user) return true;

        if (user.requiresPwdChange && request.path !== CHANGE_PASSWORD_PATH) {
            throw new ForbiddenException({
                message: 'You must change your password before accessing this resource.',
                error: 'PASSWORD_CHANGE_REQUIRED',
            });
        }

        return true;
    }
}

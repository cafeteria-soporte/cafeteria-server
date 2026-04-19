import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from '../config/jwt.config';

export interface JwtPayload {
    sub: number;
    username: string;
    roleId: number;
    requiresPwdChange: boolean;
}

export interface AuthUser {
    id: number;
    username: string;
    roleId: number;
    requiresPwdChange: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(jwtConfig: JwtConfig) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConfig.secret,
        });
    }

    validate(payload: JwtPayload): AuthUser {
        return {
            id:                payload.sub,
            username:          payload.username,
            roleId:            payload.roleId,
            requiresPwdChange: payload.requiresPwdChange,
        };
    }
}

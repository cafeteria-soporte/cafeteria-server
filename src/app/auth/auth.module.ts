import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfig } from './config/jwt.config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PwdChangeGuard } from './guards/pwd-change.guard';
import { UsersModule } from 'src/modules/user-management/users/users.module';
import { GlobalSettingsModule } from 'src/modules/system-config/global-settings/global-settings.module';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            extraProviders: [JwtConfig],
            inject: [JwtConfig],
            useFactory: (cfg: JwtConfig) => ({
                secret: cfg.secret,
                signOptions: { expiresIn: cfg.expiresIn as any },
            }),
        }),
        UsersModule,
        GlobalSettingsModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PwdChangeGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        JwtConfig,
        AuthService,
        JwtStrategy,
    ],
    controllers: [AuthController],
    exports: [JwtStrategy, PassportModule],
})
export class AuthModule { }

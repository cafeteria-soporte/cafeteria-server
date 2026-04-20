import { Controller, Post, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ChangePasswordDto } from '../dto/in/change-password.dto';
import { CreateUserDto } from 'src/modules/user-management/users/dto/in/create-user.dto';
import { UserDto } from 'src/modules/user-management/users/dto/user.dto';
import { Public } from '../decorators';
import { AdministratorUp, CashierUp } from '../decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ApiValidationError, ApiUnauthorized, ApiConflict } from 'src/shared/utils/swagger';
import type { AuthUser } from '../strategies/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiOkResponse({ type: AuthResponseDto })
    @ApiValidationError()
    @ApiUnauthorized()
    async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @AdministratorUp()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Crear usuario', description: 'Solo administradores y root. El usuario se crea con requires_pwd_change = true.' })
    @ApiCreatedResponse({ type: UserDto })
    @ApiValidationError()
    @ApiConflict()
    async register(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser): Promise<UserDto> {
        return this.authService.register(dto, user.id);
    }

    @CashierUp()
    @Patch('change-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Cambiar contraseña propia',
        description: 'El usuario cambia su propia contraseña. Después del cambio requires_pwd_change queda en false.',
    })
    @ApiNoContentResponse({ description: 'Contraseña actualizada.' })
    @ApiValidationError()
    @ApiUnauthorized()
    async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser('id') userId: number): Promise<void> {
        return this.authService.changePassword(userId, dto);
    }

    @CashierUp()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Cerrar sesión', description: 'El accessToken expira por sí solo. Requiere Authorization: Bearer <token>.' })
    @ApiNoContentResponse({ description: 'Sesión cerrada.' })
    @ApiUnauthorized()
    async logout(): Promise<void> {
        return this.authService.logout();
    }
}

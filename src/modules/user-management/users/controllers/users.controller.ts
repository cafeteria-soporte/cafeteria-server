import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UserDto } from '../dto/user.dto';
import { FindUsersDto } from '../dto/in/find-users.dto';
import { AdministratorUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ApiNotFound, ApiValidationError } from 'src/shared/utils/swagger';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';
import { FindAllUsersResponseDto } from '../dto/out/find-all-users-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @AdministratorUp()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Soporta filtrado por estado activo y rol.',
  })
  @ApiOkResponse({ type: FindAllUsersResponseDto })
  findAll(@Query() params: FindUsersDto) {
    return this.usersService.findAll(params);
  }

  @Get(':id')
  @AdministratorUp()
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id, {
      dto: UserDto,
      throwException: true,
    });
  }

  @Patch(':id/deactivate')
  @AdministratorUp()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desactivar cuenta de usuario',
    description:
      'Solo se puede desactivar usuarios con rol inferior al propio. No se puede desactivar la propia cuenta.',
  })
  @ApiNoContentResponse({ description: 'Cuenta desactivada.' })
  @ApiNotFound()
  @ApiValidationError()
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.deactivate(id, actor.id, actor.roleId);
  }
}

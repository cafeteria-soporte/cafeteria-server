import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AdministratorUp } from 'src/app/auth/decorators/roles.decorator';
import { ApiNotFound } from 'src/shared/utils/swagger';
import { RolesService } from '../services/roles.service';
import { RoleDto } from '../dto/role.dto';
import { FindRolesDto } from '../dto/in/find-roles.dto';
import { FindAllRolesResponseDto } from '../dto/out/find-all-roles-response.dto';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @AdministratorUp()
    @Get()
    @ApiOperation({ summary: 'Listar roles paginados' })
    @ApiOkResponse({ type: FindAllRolesResponseDto })
    findAll(@Query() params: FindRolesDto): Promise<FindAllRolesResponseDto> {
        return this.rolesService.findAll(params);
    }

    @AdministratorUp()
    @Get(':id')
    @ApiOperation({ summary: 'Obtener rol por ID' })
    @ApiOkResponse({ type: RoleDto })
    @ApiNotFound()
    findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleDto> {
        return this.rolesService.findOne(id, { dto: RoleDto, throwException: true }) as Promise<RoleDto>;
    }
}

import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { RootOnly } from 'src/app/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { ApiNotFound, ApiValidationError } from 'src/shared/utils/swagger';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';
import { GlobalSettingsService } from '../services/global-settings.service';
import { GlobalSettingDto } from '../dto/global-setting.dto';
import { UpdateGlobalSettingDto } from '../dto/in/update-global-setting.dto';
import { FindGlobalSettingsDto } from '../dto/in/find-global-settings.dto';
import { FindAllGlobalSettingsResponseDto } from '../dto/out/find-all-global-settings-response.dto';

@ApiTags('Global Settings')
@Controller('global-settings')
export class GlobalSettingsController {
    constructor(private readonly service: GlobalSettingsService) {}

    @RootOnly()
    @Get()
    @ApiOperation({ summary: 'Listar configuraciones del sistema paginadas' })
    @ApiOkResponse({ type: FindAllGlobalSettingsResponseDto })
    findAll(@Query() params: FindGlobalSettingsDto): Promise<FindAllGlobalSettingsResponseDto> {
        return this.service.findAll(params);
    }

    @RootOnly()
    @Get(':key')
    @ApiOperation({ summary: 'Obtener una configuración por clave' })
    @ApiOkResponse({ type: GlobalSettingDto })
    @ApiNotFound()
    findOne(@Param('key') key: string): Promise<GlobalSettingDto> {
        return this.service.findOne(key, { dto: GlobalSettingDto, throwException: true }) as Promise<GlobalSettingDto>;
    }

    @RootOnly()
    @Patch(':key')
    @ApiOperation({
        summary: 'Actualizar una configuración',
        description: 'Solo root. Registra el cambio en audit log con valor anterior y nuevo.',
    })
    @ApiOkResponse({ type: GlobalSettingDto })
    @ApiNotFound()
    @ApiValidationError()
    update(
        @Param('key') key: string,
        @Body() dto: UpdateGlobalSettingDto,
        @CurrentUser() actingUser: AuthUser,
    ): Promise<GlobalSettingDto> {
        return this.service.update(key, dto, actingUser);
    }
}

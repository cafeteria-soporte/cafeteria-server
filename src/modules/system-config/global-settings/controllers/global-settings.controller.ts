import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalSettingsService } from '../services/global-settings.service';

@ApiTags('Global Settings')
@Controller('global-settings')
export class GlobalSettingsController {
    constructor(private readonly service: GlobalSettingsService) {}
}

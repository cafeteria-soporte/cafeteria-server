import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalSetting } from './entities/global-setting.entity';
import { GlobalSettingsService } from './services/global-settings.service';
import { GlobalSettingsController } from './controllers/global-settings.controller';

@Module({
    imports: [TypeOrmModule.forFeature([GlobalSetting])],
    controllers: [GlobalSettingsController],
    providers: [GlobalSettingsService],
    exports: [GlobalSettingsService],
})
export class GlobalSettingsModule {}

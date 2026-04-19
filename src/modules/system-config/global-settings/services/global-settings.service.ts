import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { GlobalSetting } from '../entities/global-setting.entity';

@Injectable()
export class GlobalSettingsService {
    private readonly repo: DtoRepository<GlobalSetting>;

    constructor(
        @InjectRepository(GlobalSetting)
        private readonly rawRepo: Repository<GlobalSetting>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}

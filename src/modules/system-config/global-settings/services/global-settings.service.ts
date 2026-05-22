import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, ILike, Repository } from 'typeorm';
import { DtoRepository, FindOptions } from 'src/shared';
import { GlobalSetting } from '../entities/global-setting.entity';
import { GlobalSettingDto } from '../dto/global-setting.dto';
import { UpdateGlobalSettingDto } from '../dto/in/update-global-setting.dto';
import { FindGlobalSettingsDto } from '../dto/in/find-global-settings.dto';
import { FindAllGlobalSettingsResponseDto } from '../dto/out/find-all-global-settings-response.dto';
import { SettingNotFoundException } from '../exceptions/setting-not-found.exception';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { AuditAction } from '../../audit-log/enums/audit-action.enum';
import { AuditModule } from '../../audit-log/enums/audit-module.enum';
import { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

const ROLE_NAMES: Record<number, string> = { 1: 'root', 2: 'administrator', 3: 'cashier' };

@Injectable()
export class GlobalSettingsService {
    private readonly repo: DtoRepository<GlobalSetting>;

    constructor(
        @InjectRepository(GlobalSetting)
        private readonly rawRepo: Repository<GlobalSetting>,
        private readonly auditLog: AuditLogService,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(params: FindGlobalSettingsDto): Promise<FindAllGlobalSettingsResponseDto> {
        const where: Record<string, any> = {};
        if (params.key !== undefined) where['key'] = ILike(`%${params.key}%`);

        return this.repo.findPaginated({
            dto:        GlobalSettingDto,
            pagination: params,
            where,
            order:      { key: 'ASC' },
        }) as Promise<FindAllGlobalSettingsResponseDto>;
    }

    async findOne<T = GlobalSettingDto>(key: string, options: FindOptions<T> = { dto: GlobalSettingDto as any, throwException: true }): Promise<T | null> {
        const result = await this.repo.findOne({ dto: options.dto, where: { key } });
        if (!result && options.throwException !== false) throw new SettingNotFoundException(key);
        return result;
    }

    async findValueByKey(key: string): Promise<string | null> {
        const setting = await this.rawRepo.findOne({ where: { key }, select: { key: true, value: true } });
        return setting?.value ?? null;
    }

    async incrementReceiptNumber(manager: EntityManager): Promise<string> {
        const setting = await manager.findOne(GlobalSetting, {
            where: { key: 'next_receipt_number' },
            lock:  { mode: 'pessimistic_write' },
        });
        if (!setting) throw new SettingNotFoundException('next_receipt_number');

        const prefix = await manager.findOne(GlobalSetting, { where: { key: 'receipt_prefix' } });
        const currentNumber = parseInt(setting.value, 10);
        const receiptNumber = `${prefix?.value ?? ''}${String(currentNumber).padStart(6, '0')}`;

        await manager.update(GlobalSetting, { key: 'next_receipt_number' }, { value: String(currentNumber + 1) });
        return receiptNumber;
    }

    async update(key: string, dto: UpdateGlobalSettingDto, actingUser: AuthUser): Promise<GlobalSettingDto> {
        const current = await this.repo.findOne({ dto: GlobalSettingDto, where: { key } });
        if (!current) throw new SettingNotFoundException(key);

        await this.rawRepo.update({ key }, { value: dto.value, updatedById: actingUser.id });

        await this.auditLog.create({
            action:           AuditAction.SETTINGS_CHANGED,
            module:           AuditModule.SETTINGS,
            userId:           actingUser.id,
            usernameSnapshot: actingUser.username,
            roleSnapshot:     ROLE_NAMES[actingUser.roleId],
            affectedEntity:   'global_settings',
            previousValue:    current.value,
            newValue:         dto.value,
        });

        return (await this.findOne(key))!;
    }
}

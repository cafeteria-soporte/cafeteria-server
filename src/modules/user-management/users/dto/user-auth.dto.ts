import { DtoField, DtoRelation } from 'src/shared';
import { RoleDto } from '../../roles/dto/role.dto';

export class UserAuthDto {
    @DtoField()
    id: number;

    @DtoField()
    username: string;

    @DtoField()
    passwordHash: string;

    @DtoField()
    active: boolean;

    @DtoField()
    failedAttempts: number;

    @DtoField()
    requiresPwdChange: boolean;

    @DtoField()
    lockedUntil: Date | null;

    @DtoRelation(() => RoleDto)
    role: RoleDto;
}

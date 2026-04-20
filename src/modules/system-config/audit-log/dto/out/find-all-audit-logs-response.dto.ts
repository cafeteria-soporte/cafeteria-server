import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { AuditLogDto } from '../audit-log.dto';

export class FindAllAuditLogsResponseDto extends PaginationResponseDto<AuditLogDto> {
    @ApiProperty({ type: [AuditLogDto] })
    declare data: AuditLogDto[];
}

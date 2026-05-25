import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { RootOnly } from 'src/app/auth/decorators/roles.decorator';
import { AuditLogService } from '../services/audit-log.service';
import { FindAuditLogsDto } from '../dto/in/find-audit-logs.dto';
import { FindAllAuditLogsResponseDto } from '../dto/out/find-all-audit-logs-response.dto';

@ApiTags('Audit Log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @RootOnly()
  @Get()
  @ApiOperation({
    summary: 'Listar logs de auditoría',
    description:
      'Solo root. Devuelve todos los eventos auditados con filtros y paginación.',
  })
  @ApiOkResponse({ type: FindAllAuditLogsResponseDto })
  async findAll(
    @Query() params: FindAuditLogsDto,
  ): Promise<FindAllAuditLogsResponseDto> {
    return this.auditLogService.findAll(params);
  }
}

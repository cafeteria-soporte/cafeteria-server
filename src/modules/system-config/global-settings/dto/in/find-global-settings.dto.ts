import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationParamsDto } from 'src/shared';

export class FindGlobalSettingsDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    example: 'max_login',
    description:
      'Filtrar por clave (búsqueda parcial). Claves existentes: `cash_discrepancy_threshold`, `session_timeout_minutes`, `max_login_attempts`, `receipt_prefix`, `next_receipt_number`, `alerts_email`, `notify_pos`, `notify_inventory`, `notify_shifts`, `notify_users`.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  key?: string;
}

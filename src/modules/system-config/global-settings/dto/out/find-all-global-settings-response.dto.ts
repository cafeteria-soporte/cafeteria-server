import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { GlobalSettingDto } from '../global-setting.dto';

export class FindAllGlobalSettingsResponseDto extends PaginationResponseDto<GlobalSettingDto> {
  @ApiProperty({ type: [GlobalSettingDto] })
  declare data: GlobalSettingDto[];
}

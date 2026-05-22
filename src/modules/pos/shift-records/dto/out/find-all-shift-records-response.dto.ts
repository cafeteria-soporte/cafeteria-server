import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from 'src/shared';
import { ShiftRecordDto } from '../shift-record.dto';

export class FindAllShiftRecordsResponseDto extends PaginationResponseDto<ShiftRecordDto> {
    @ApiProperty({ type: [ShiftRecordDto] })
    declare data: ShiftRecordDto[];
}

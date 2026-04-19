import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShiftRecordsService } from '../services/shift-records.service';

@ApiTags('Shift Records')
@Controller('shift-records')
export class ShiftRecordsController {
    constructor(private readonly service: ShiftRecordsService) {}
}

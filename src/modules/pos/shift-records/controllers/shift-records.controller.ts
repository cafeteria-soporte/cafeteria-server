import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ShiftRecordsService } from '../services/shift-records.service';
import { OpenShiftDto } from '../dto/in/open-shift.dto';
import { CloseShiftDto } from '../dto/in/close-shift.dto';
import { ShiftRecordDto } from '../dto/shift-record.dto';
import { CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';

@ApiTags('POS - Shift Records')
@Controller('shift-records')
export class ShiftRecordsController {
  constructor(private readonly shiftService: ShiftRecordsService) {}

  @Post('open')
  @CashierUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir caja con fondo inicial' })
  @ApiCreatedResponse({ type: ShiftRecordDto })
  open(@CurrentUser('id') userId: number, @Body() dto: OpenShiftDto) {
    return this.shiftService.openShift(userId, dto);
  }

  @Post('close')
  @CashierUp()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cierre de turno ciego' })
  @ApiOkResponse({ description: 'Turno cerrado con resultado de discrepancia' })
  close(@CurrentUser('id') userId: number, @Body() dto: CloseShiftDto) {
    return this.shiftService.closeShift(userId, dto);
  }
}

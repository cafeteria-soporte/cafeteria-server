import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ShiftRecordsService } from '../services/shift-records.service';
import { OpenShiftDto } from '../dto/in/open-shift.dto';
import { CloseShiftDto } from '../dto/in/close-shift.dto';
import { FindShiftRecordsDto } from '../dto/in/find-shift-records.dto';
import { ShiftRecordDto } from '../dto/shift-record.dto';
import { FindAllShiftRecordsResponseDto } from '../dto/out/find-all-shift-records-response.dto';
import { AdministratorUp, CashierUp } from 'src/app/auth/decorators';
import { CurrentUser } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@ApiTags('POS - Shift Records')
@Controller('shift-records')
export class ShiftRecordsController {
  constructor(private readonly shiftService: ShiftRecordsService) {}

  @Get()
  @AdministratorUp()
  @ApiOperation({ summary: 'Listar todos los turnos (Admin+) con filtros opcionales' })
  @ApiOkResponse({ type: FindAllShiftRecordsResponseDto })
  findAll(@Query() params: FindShiftRecordsDto) {
    return this.shiftService.findAll(params);
  }

  @Get('mine')
  @CashierUp()
  @ApiOperation({ summary: 'Listar mis turnos (cajero autenticado)' })
  @ApiOkResponse({ type: FindAllShiftRecordsResponseDto })
  findMine(@CurrentUser() currentUser: AuthUser, @Query() params: FindShiftRecordsDto) {
    return this.shiftService.findAllMine(currentUser.id, params);
  }

  @Get('mine/current')
  @CashierUp()
  @ApiOperation({ summary: 'Obtener el turno abierto actualmente (si existe)' })
  @ApiOkResponse({ type: ShiftRecordDto })
  findMyCurrent(@CurrentUser() currentUser: AuthUser) {
    return this.shiftService.findMyCurrent(currentUser.id);
  }

  @Get(':id')
  @AdministratorUp()
  @ApiOperation({ summary: 'Obtener un turno por ID (Admin+)' })
  @ApiOkResponse({ type: ShiftRecordDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftService.findOne(id);
  }

  @Post('open')
  @CashierUp()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir caja con fondo inicial' })
  @ApiCreatedResponse({ type: ShiftRecordDto })
  open(@CurrentUser() currentUser: AuthUser, @Body() dto: OpenShiftDto) {
    return this.shiftService.openShift(currentUser, dto);
  }

  @Post('close')
  @CashierUp()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cierre de turno ciego (el cajero no ve el monto esperado)' })
  @ApiOkResponse({ description: 'Turno cerrado. Devuelve si hubo alerta de descuadre.' })
  close(@CurrentUser() currentUser: AuthUser, @Body() dto: CloseShiftDto) {
    return this.shiftService.closeShift(currentUser, dto);
  }
}

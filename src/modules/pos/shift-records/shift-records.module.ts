import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftRecord } from './entities/shift-record.entity';
import { ShiftRecordsService } from './services/shift-records.service';
import { ShiftRecordsController } from './controllers/shift-records.controller';
import { UserOrdersModule } from '../user-orders/user-orders.module';
import { GlobalSettingsModule } from 'src/modules/system-config/global-settings/global-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftRecord]),
    forwardRef(() => UserOrdersModule),
    GlobalSettingsModule,
  ],
  controllers: [ShiftRecordsController],
  providers: [ShiftRecordsService],
  exports: [ShiftRecordsService],
})
export class ShiftRecordsModule {}

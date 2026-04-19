import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftRecord } from './entities/shift-record.entity';
import { ShiftRecordsService } from './services/shift-records.service';
import { ShiftRecordsController } from './controllers/shift-records.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ShiftRecord])],
    controllers: [ShiftRecordsController],
    providers: [ShiftRecordsService],
    exports: [ShiftRecordsService],
})
export class ShiftRecordsModule {}

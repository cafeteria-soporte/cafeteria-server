import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGlobalSettingDto {
    @ApiProperty({ example: '5' })
    @IsString()
    @IsNotEmpty()
    value: string;
}

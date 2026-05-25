import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RootOnly } from 'src/app/auth/decorators';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Post('migrations/apply')
  @RootOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aplicar migraciones de esquema pendientes (Root only)',
    description:
      'Hace receipt_number nullable en user_orders para permitir crear órdenes antes de confirmar pago.',
  })
  @ApiOkResponse({
    schema: { example: { applied: ['receipt_number_nullable'] } },
  })
  async applyMigrations() {
    const applied: string[] = [];

    const [{ count }] = await this.dataSource.query<[{ count: string }]>(
      `SELECT COUNT(*) AS count
             FROM information_schema.columns
             WHERE table_name = 'user_orders'
               AND column_name = 'receipt_number'
               AND is_nullable = 'YES'`,
    );

    if (Number(count) === 0) {
      await this.dataSource.query(
        `ALTER TABLE user_orders ALTER COLUMN receipt_number DROP NOT NULL`,
      );
      applied.push('receipt_number_nullable');
    }

    return {
      applied: applied.length ? applied : ['none — already up to date'],
    };
  }
}

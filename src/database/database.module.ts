import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';

/**
 * DatabaseModule — configura TypeORM y expone DataSource para transacciones.
 *
 * Para usar transacciones en un servicio:
 *   constructor(@InjectDataSource() private readonly dataSource: DataSource) {}
 *
 *   await this.dataSource.transaction(async (manager) => {
 *       await this.usersService.create(dto, { manager });
 *       await this.ordersService.create(orderDto, { manager });
 *   });
 *
 * Los servicios aceptan MutationOptions.manager para operar dentro de una transacción:
 *   async create(dto: CreateDto, options?: MutationOptions): Promise<Dto> {
 *       const repo = options?.manager?.getRepository(Entity) ?? this.rawRepo;
 *       ...
 *   }
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // extraProviders: TypeOrmModule.forRootAsync crea un TypeOrmCoreModule interno
      // que no tiene acceso a los providers de DatabaseModule. extraProviders le
      // provee DatabaseConfig directamente. Sus dependencias (ConfigService, AppConfig)
      // están disponibles porque AppConfigModule es @Global().
      extraProviders: [DatabaseConfig],
      inject: [DatabaseConfig],
      useFactory: (db: DatabaseConfig) => ({
        type: db.type as any,
        host: db.host,
        port: db.port,
        username: db.username,
        password: db.password,
        database: db.database,
        autoLoadEntities: true,
        synchronize: true,
        logging: db.logging,
        ssl: db.ssl ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
  providers: [DatabaseConfig],
  // DataSource se exporta automáticamente cuando TypeOrmModule es @Global,
  // pero al ser module-scoped lo hacemos explícito para claridad.
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

import 'dotenv/config';
import { types } from 'pg';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfig } from './config/services/app.config';
import { getEnvSettings } from './config/helpers/environment';
import { getCorsOptions } from './config/helpers/cors';
import { setupSwagger } from './config/helpers/swagger';
import { logServerStatus } from './config/helpers/logger';
import { JwtConfig } from './app/auth/config/jwt.config';
import { DatabaseConfig } from './database/config/database.config';
import { HttpExceptionFilter } from './shared/filters';

types.setTypeParser(20, Number);

async function bootstrap() {
  const { logger, swagger } = getEnvSettings(process.env.NODE_ENV);

  const app = await NestFactory.create(AppModule, { logger });

  const cfg = app.get(AppConfig);

  app.setGlobalPrefix(cfg.apiPrefix);

  if (swagger) {
    setupSwagger(app, {
      title: 'Cafeteria Server documentation',
      description: 'Documentación API',
      version: '1.0',
      path: 'api/cafeteria/docs',
    });
  }

  app.enableCors(getCorsOptions(cfg.domainFrontend));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(cfg.port);

  const jwtCfg = app.get(JwtConfig, { strict: false });
  const dbCfg = app.get(DatabaseConfig, { strict: false });

  logServerStatus(cfg, 'Cafeteria Server', {
    swagger: swagger,
    docsPath: 'api/cafeteria/docs',
    jwtActive: jwtCfg.isActive,
    dbLogs: dbCfg.logging,
    cors: cfg.domainFrontend,
    database: `${dbCfg.host}:${dbCfg.port}/${dbCfg.database}`,
    logLevels: logger,
  });
}
bootstrap();

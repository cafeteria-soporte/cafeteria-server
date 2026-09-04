import 'dotenv/config';

import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl:
    process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,

  entities: ['src/**/*.entity.ts'],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,

  logging: false,
});

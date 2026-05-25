import { LogLevel } from '@nestjs/common';
import { EnvironmentEnum } from 'src/shared/enums';

interface EnvSettings {
  logger: LogLevel[];
  swagger: boolean;
}

/**
 * Ajustes que varían por ambiente: nivel de logs y si Swagger está activo.
 * No son variables de entorno — son decisiones fijas por ambiente.
 */
export const environmentSettings: Record<string, EnvSettings> = {
  [EnvironmentEnum.PRODUCTION]: {
    logger: ['error'],
    swagger: false,
  },
  [EnvironmentEnum.DEVELOPMENT]: {
    logger: ['error', 'warn', 'log'],
    swagger: true,
  },
  [EnvironmentEnum.TEST]: {
    logger: ['error'],
    swagger: true,
  },
  [EnvironmentEnum.DEBUG]: {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    swagger: true,
  },
};

export function getEnvSettings(nodeEnv?: string): EnvSettings {
  return environmentSettings[nodeEnv ?? EnvironmentEnum.DEVELOPMENT];
}

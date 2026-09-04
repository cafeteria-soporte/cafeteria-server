import * as Joi from 'joi';
import { EnvironmentEnum } from 'src/shared/enums';

export const envValidation = Joi.object({
  NODE_ENV: Joi.string()
    .valid(...Object.values(EnvironmentEnum))
    .default(EnvironmentEnum.DEVELOPMENT),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  DOMAIN_FRONTEND: Joi.string().default('*'),

  DB_TYPE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_LOGS: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),

  ACTIVE_JWT: Joi.boolean().default(true),
  JWT_SECRET: Joi.string().required(),
  JWT_TIME_EXPIRE: Joi.string().default('8h'),

  MAILER_TRANSPORT: Joi.string().valid('smtp', 'api').default('smtp'),
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().default('"No Reply" <noreply@example.com>'),
  MAILER_API_URL: Joi.string().uri().optional(),
  MAILER_API_KEY: Joi.string().optional(),
  MAILER_FROM: Joi.string().optional(),

  WEBSOCKET_NAMESPACE: Joi.string().default('app'),
});

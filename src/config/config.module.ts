import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './services/app.config';
import { envValidation } from './env.validation';

const CONFIG_PROVIDERS = [AppConfig];

/**
 * Módulo global de configuración.
 *
 * Se importa UNA sola vez en AppModule — nunca en módulos de feature.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ @Global() vs ConfigModule.forRoot({ isGlobal: true })           │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Son dos cosas distintas:
 *
 * ConfigModule.forRoot({ isGlobal: true })
 *   → Hace que ConfigService (el servicio interno de NestJS) esté disponible
 *     en toda la app sin reimportar ConfigModule en cada módulo.
 *
 * @Global() en AppConfigModule
 *   → Hace que los providers de ESTE módulo (AppConfig, DatabaseConfig, JwtConfig)
 *     estén disponibles en toda la app sin reimportar AppConfigModule.
 *
 * Sin @Global(), cualquier servicio que quiera inyectar AppConfig tendría que
 * poner AppConfigModule en los imports de su propio módulo. Con @Global() basta
 * con tenerlo en AppModule una sola vez.
 *
 * ¿Cuándo NO usar @Global()?
 *   Cuando la config es específica de un plugin (SmtpConfig, ApiMailerConfig).
 *   Esas configuraciones solo las necesita su propio adaptador — van dentro
 *   de su propio módulo (SmtpMailerModule, ApiMailerModule), no aquí.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ envValidation (Joi schema)                                      │
 * └─────────────────────────────────────────────────────────────────┘
 *   ConfigModule.forRoot({ validationSchema }) ejecuta el schema de Joi
 *   ANTES de que cualquier módulo se inicialice. Si falta una variable
 *   requerida o tiene tipo incorrecto, la app arroja un error en el
 *   bootstrap y NO arranca. Falla rápido, falla obvio.
 *
 * Para agregar una nueva config GLOBAL (necesaria en toda la app):
 *   1. Crea src/config/services/mi-config.ts con la clase @Injectable
 *   2. Agrégala a CONFIG_PROVIDERS
 *   3. Agrega sus variables a env.validation.ts
 *
 * Para configuración de módulos específicos (auth, database, plugins, etc.):
 *   → No va aquí. Cada módulo declara su propio Config en su providers[].
 *   → Ejemplo: JwtConfig vive en AuthModule, DatabaseConfig en DatabaseModule.
 *   → Si el módulo se elimina, su config desaparece con él.
 */
@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal:         true,      // ConfigService disponible en toda la app
            envFilePath:      '.env',    // ruta al archivo de variables de entorno
            validationSchema: envValidation, // Joi valida y tipifica las variables
        }),
    ],
    providers: CONFIG_PROVIDERS,
    exports:   CONFIG_PROVIDERS, // exportar = disponibles globalmente gracias a @Global()
})
export class AppConfigModule {}

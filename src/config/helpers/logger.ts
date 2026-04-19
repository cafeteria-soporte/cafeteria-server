import { LogLevel } from '@nestjs/common';
import { AppConfig } from '../services/app.config';
import { EnvironmentEnum } from 'src/shared/enums';

// ── Códigos ANSI ──────────────────────────────────────────────────────────────
const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    red:    '\x1b[31m',
    green:  '\x1b[32m',
    yellow: '\x1b[33m',
    cyan:   '\x1b[36m',
    white:  '\x1b[37m',
};

const ENV_COLOR: Record<string, string> = {
    [EnvironmentEnum.PRODUCTION]:  C.red,
    [EnvironmentEnum.DEVELOPMENT]: C.green,
    [EnvironmentEnum.TEST]:        C.yellow,
    [EnvironmentEnum.DEBUG]:       C.cyan,
};

// Badges de estado
const OK   = `${C.green}✔${C.reset}`;
const FAIL = `${C.red}✘${C.reset}`;
const WARN = `${C.yellow}⚠${C.reset}`;

// ── Helpers de formato ────────────────────────────────────────────────────────

/** Largo real del string sin contar los códigos ANSI */
function vis(s: string): number {
    return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

/** Rellena con espacios a la derecha respetando el largo visible */
function rpad(s: string, w: number): string {
    return s + ' '.repeat(Math.max(0, w - vis(s)));
}

/** Centra un string respetando el largo visible */
function center(s: string, w: number): string {
    const l = Math.floor((w - vis(s)) / 2);
    const r = w - vis(s) - l;
    return ' '.repeat(l) + s + ' '.repeat(r);
}

// ── Interfaz de opciones ──────────────────────────────────────────────────────

export interface ServerBannerOptions {
    /** true si Swagger está activo en este ambiente */
    swagger:   boolean;
    /** Ruta de la documentación (ej. 'api/docs') */
    docsPath:  string;
    /** true si ACTIVE_JWT es true (o si es producción) */
    jwtActive: boolean;
    /** true si DB_LOGS=true está activo */
    dbLogs:    boolean;
    /** Valor de DOMAIN_FRONTEND ('*' en desarrollo) */
    cors:      string;
    /** String de conexión legible: 'host:port/database' */
    database:  string;
    /** Niveles de log activos en este ambiente */
    logLevels: LogLevel[];
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Imprime el banner de arranque del servidor con estado dinámico por ambiente.
 *
 * Secciones:
 *   Info     → ambiente, puerto, URL base de la API
 *   Features → estado de Swagger, JWT, DB Logs y CORS (✔/✘/⚠ dinámicos)
 *   Conexión → string de BD y niveles de log activos
 *
 * Los ✔/✘/⚠ cambian según el valor real del .env — no son estáticos.
 * En producción: JWT siempre activo, Swagger siempre apagado, ambiente en rojo.
 *
 * @param cfg     AppConfig inyectado desde el DI container
 * @param appName Nombre del proyecto (personalizable en main.ts)
 * @param opts    Estado dinámico del servidor al arrancar
 */
export function logServerStatus(cfg: AppConfig, appName: string, opts: ServerBannerOptions): void {
    const color   = ENV_COLOR[cfg.nodeEnv] ?? C.green;
    const baseUrl = `http://localhost:${cfg.port}`;
    const apiUrl  = `${baseUrl}/${cfg.apiPrefix}`;

    // ── Sección Info ──────────────────────────────────────────────────────────
    const infoRows: [string, string][] = [
        ['Environment', `${color}${C.bold}${cfg.nodeEnv.toUpperCase()}${C.reset}`],
        ['Port',        `${color}${cfg.port}${C.reset}`],
        ['URL',         `${color}${apiUrl}${C.reset}`],
    ];

    // ── Sección Features (estado dinámico) ────────────────────────────────────
    const corsDisplay = opts.cors === '*'
        ? `${WARN} ${C.yellow}All origins${C.reset} ${C.dim}(*)${C.reset}`
        : `${OK} ${opts.cors}`;

    const featureRows: [string, string][] = [
        ['Swagger', opts.swagger
            ? `${OK} ${C.cyan}${baseUrl}/${opts.docsPath}${C.reset}`
            : `${FAIL} ${C.dim}Disabled${C.reset}`],

        ['JWT Auth', opts.jwtActive
            ? `${OK} ${C.green}Active${C.reset}`
            : `${WARN} ${C.yellow}Bypassed${C.reset} ${C.dim}(ACTIVE_JWT=false)${C.reset}`],

        ['DB Logs', opts.dbLogs
            ? `${OK} ${C.green}Enabled${C.reset}`
            : `${FAIL} ${C.dim}Disabled${C.reset}`],

        ['CORS', corsDisplay],
    ];

    // ── Sección Conexión ──────────────────────────────────────────────────────
    const connRows: [string, string][] = [
        ['Database',  `${C.dim}${opts.database}${C.reset}`],
        ['Log Level', `${C.dim}${opts.logLevels.join(', ')}${C.reset}`],
    ];

    // ── Cálculo de anchos ─────────────────────────────────────────────────────
    const allRows = [...infoRows, ...featureRows, ...connRows];

    const LABEL_W = Math.max(...allRows.map(([l]) => l.length));
    const VALUE_W = Math.max(
        vis(`${C.bold}${C.white}${appName}${C.reset}`) + 2,
        ...allRows.map(([, v]) => vis(v)),
    );

    // Layout: │  label(LABEL_W)  │  value(VALUE_W)  │
    //         ├──(LABEL_W+4)──┬──(VALUE_W+4)──┤
    const L_DASHES = '─'.repeat(LABEL_W + 4);
    const R_DASHES = '─'.repeat(VALUE_W + 4);
    const FULL_W   = LABEL_W + VALUE_W + 9; // left_dashes + │ + right_dashes

    // ── Constructores de líneas ───────────────────────────────────────────────
    const titleStr = `${C.bold}${C.white}${appName}${C.reset}`;

    const line = (l: string, m: string, r: string) =>
        `  ${C.dim}${l}${L_DASHES}${m}${R_DASHES}${r}${C.reset}`;

    const row = (label: string, value: string) =>
        `  ${C.dim}│${C.reset}  ${C.dim}${label.padEnd(LABEL_W)}${C.reset}  ${C.dim}│${C.reset}  ${rpad(value, VALUE_W)}  ${C.dim}│${C.reset}`;

    // ── Imprimir banner ───────────────────────────────────────────────────────
    console.log();
    console.log(`  ${C.dim}┌${'─'.repeat(FULL_W)}┐${C.reset}`);
    console.log(`  ${C.dim}│${C.reset}${center(titleStr, FULL_W)}${C.dim}│${C.reset}`);
    console.log(line('├', '┬', '┤'));
    for (const [l, v] of infoRows)    console.log(row(l, v));
    console.log(line('├', '┼', '┤'));
    for (const [l, v] of featureRows) console.log(row(l, v));
    console.log(line('├', '┼', '┤'));
    for (const [l, v] of connRows)    console.log(row(l, v));
    console.log(`  ${C.dim}└${L_DASHES}┴${R_DASHES}┘${C.reset}`);
    console.log();
}

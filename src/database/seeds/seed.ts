import 'dotenv/config';

import { AppDataSource } from '../config/data-source';
import { hashPassword } from '../../shared/utils/crypto.util';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function seedRoles(): Promise<void> {
  const roles = [
    { role_id: 1, name: 'root' },
    { role_id: 2, name: 'administrator' },
    { role_id: 3, name: 'cashier' },
  ];

  for (const role of roles) {
    const existing = await AppDataSource.query<{ role_id: number }[]>(
      `SELECT role_id FROM roles WHERE role_id = $1 LIMIT 1`,
      [role.role_id],
    );
    if (existing.length === 0) {
      await AppDataSource.query(
        `INSERT INTO roles (role_id, name) VALUES ($1, $2)`,
        [role.role_id, role.name],
      );
      console.log(`  ${GREEN}✔  Rol creado:${RESET} ${role.name}`);
    } else {
      console.log(
        `  ${YELLOW}⚠  Rol ya existe:${RESET} ${role.name} — saltando.`,
      );
    }
  }
}

async function seedRootUser(): Promise<void> {
  const username = process.env.SEED_ROOT_USERNAME ?? 'root';
  const password = process.env.SEED_ROOT_PASSWORD ?? 'root1234';

  const existing = await AppDataSource.query<{ user_id: number }[]>(
    `SELECT user_id FROM users WHERE username = $1 LIMIT 1`,
    [username],
  );

  if (existing.length > 0) {
    const hashed = await hashPassword(password);
    await AppDataSource.query(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL, password_hash = $2 WHERE username = $1`,
      [username, hashed],
    );
    console.log(
      `  ${YELLOW}⚠  Usuario root ya existe${RESET} (${username}) — reseteando bloqueo y contraseña.`,
    );
    return;
  }

  const hashed = await hashPassword(password);

  await AppDataSource.query(
    `INSERT INTO users (username, full_name, password_hash, role_id, requires_pwd_change)
         VALUES ($1, $2, $3, $4, $5)`,
    [username, 'Root', hashed, 1, false],
  );

  console.log(
    `  ${GREEN}✔  Usuario root creado${RESET} → ${BOLD}${username}${RESET}`,
  );
  console.log(`  ${YELLOW}⚠  Cambia la contraseña root en producción.${RESET}`);
}

async function seed(): Promise<void> {
  console.log(`\n${CYAN}${BOLD}▶  Iniciando seed...${RESET}\n`);

  await AppDataSource.initialize();
  console.log(`  ${GREEN}✔  Conexión a la base de datos establecida${RESET}`);

  try {
    await seedRoles();
    await seedRootUser();

    console.log(`\n${GREEN}${BOLD}✔  Seed completado.${RESET}\n`);
  } catch (error) {
    console.error(`\n${RED}${BOLD}✘  Error durante el seed:${RESET}`, error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();

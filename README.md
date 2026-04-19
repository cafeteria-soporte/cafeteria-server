# TPS Cafetería — Backend NestJS

Sistema de procesamiento transaccional para una cafetería comercial. El backend expone una API REST con autenticación JWT, control de roles y registro de auditoría, diseñado para evolucionar hacia un DSS conforme avance el semestre.

---

## Requisitos

- Node.js 20+
- PostgreSQL 15+ (base de datos inicializada con `db-cafeteria/init.sql`)
- Un archivo `.env` en la raíz del proyecto (ver `.env.example`)

---

## Iniciar el proyecto

```bash
npm install
npm run start:dev     # desarrollo con hot-reload
npm run start:prod    # producción
npm run seed          # cargar datos iniciales (root user, roles)
```

La API queda disponible en `http://localhost:3000/api`.  
La documentación Swagger está en `http://localhost:3000/api/docs`.

---

## Estructura de carpetas

```
src/
├── app/              # Módulos de aplicación (auth, health)
├── database/         # Configuración TypeORM, entidades base, seeds
├── modules/          # Todos los módulos de dominio, agrupados por área
│   ├── user-management/     (roles, users)
│   ├── product-catalog/     (categories, products)
│   ├── inventory/           (stock-movement-types, stock-movements)
│   ├── pos/                 (payment-methods, shift-records, user-orders, order-items, order-payments)
│   └── system-config/       (global-settings, audit-log)
└── shared/           # Utilidades reutilizables entre módulos
```

Dentro de cada módulo la estructura es siempre:

```
mi-modulo/
├── controllers/
├── dto/
│   └── in/           # DTOs de entrada (body de requests)
├── entities/
├── exceptions/
├── services/
└── mi-modulo.module.ts
```

---

## Autenticación y sesión

El sistema usa **JWT de acceso** sin refresh tokens. El token dura 8 horas (una jornada laboral completa). Cuando expira, el usuario vuelve a hacer login.

**Login** (`POST /auth/login`):

```json
{ "username": "admin", "password": "temporal123" }
```

Respuesta:

```json
{
  "accessToken": "eyJ...",
  "requiresPwdChange": false,
  "user": { "id": 1, "username": "admin", ... }
}
```

**Swagger:** para probar endpoints protegidos, hacé click en el botón **Authorize** arriba a la derecha y pegá el token. El token se envía automáticamente en todos los requests siguientes.

---

## Sistema de roles

Hay tres roles con jerarquía numérica: menor número = más privilegios.

| Rol | ID | Puede hacer |
|---|---|---|
| `root` | 1 | Todo + crear admins + ver logs completos |
| `administrator` | 2 | Gestionar cajeros, productos, inventario, reportes |
| `cashier` | 3 | POS, apertura/cierre de turno, consulta de stock |

### Decoradores de roles

Se aplican sobre el método del controller. Cubren tanto la guard de JWT como la de roles, y agregan la respuesta 403 en Swagger automáticamente.

```typescript
import { RootOnly, AdministratorUp, CashierUp } from 'src/app/auth/decorators';

@RootOnly()         // solo root
@AdministratorUp()  // administrator o root
@CashierUp()        // cualquier usuario autenticado
```

Para endpoints públicos (sin token):

```typescript
import { Public } from 'src/app/auth/decorators';

@Public()
@Post('login')
```

### Obtener el usuario autenticado en el controller

```typescript
import { CurrentUser } from 'src/shared';
import { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

@Get('mi-perfil')
@CashierUp()
getProfile(@CurrentUser() user: AuthUser) {
    // user.id, user.username, user.roleId, user.requiresPwdChange
}

@Post('crear')
@AdministratorUp()
crear(@CurrentUser('id') userId: number, @Body() dto: CreateUserDto) {
    // solo el id del usuario autenticado
}
```

---

## Patrón DtoRepository

`DtoRepository<E>` es la capa de acceso a datos del proyecto. Envuelve el `Repository<E>` de TypeORM y devuelve DTOs directamente en lugar de entidades.

**Por qué existe:** evita que los servicios manejen entidades crudas con campos sensibles o innecesarios. El DTO define exactamente qué se expone, y el repositorio construye automáticamente el `SELECT` y los `JOIN` a partir de los decoradores del DTO.

### Cómo usarlo en un servicio

```typescript
import { DtoRepository } from 'src/shared';

@Injectable()
export class ProductsService {
    private readonly repo: DtoRepository<Product>;

    constructor(@InjectRepository(Product) rawRepo: Repository<Product>) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(): Promise<ProductDto[]> {
        return this.repo.find({ dto: ProductDto });
    }

    async findOne(id: number): Promise<ProductDto | null> {
        return this.repo.findOne({ dto: ProductDto, where: { id } });
    }

    async findPaginated(params: PaginationParamsDto): Promise<PaginationResponseDto<ProductDto>> {
        return this.repo.findPaginated({ dto: ProductDto, pagination: params });
    }
}
```

### Métodos disponibles

| Método | Descripción |
|---|---|
| `findOne({ dto, where, ... })` | Un registro o `null` |
| `find({ dto, where, order, ... })` | Array de registros |
| `findAndCount({ dto, ... })` | `[registros, total]` |
| `findPaginated({ dto, pagination, ... })` | Objeto con `data` y `meta` |

Todos aceptan las mismas opciones que `FindOneOptions` / `FindManyOptions` de TypeORM, **excepto** `select` y `relations` — esos los genera automáticamente el repositorio.

### FindOptions\<T\>

Cuando el servicio necesita ser genérico y el llamador decide qué DTO usar:

```typescript
import { FindOptions } from 'src/shared';

async findOneById<T>(id: number, options: FindOptions<T>): Promise<T | null> {
    const result = await this.repo.findOne({ dto: options.dto, where: { id } });
    if (options.throwException && !result) throw new ProductNotFoundException();
    return result;
}

// Llamada desde otro servicio:
const product = await productsService.findOneById(id, {
    dto: ProductDto,
    throwException: true,
});
```

Esto es útil cuando el mismo método puede devolver un DTO público (`ProductDto`) o uno interno con más campos.

---

## Decoradores de DTO

Los DTOs usan dos decoradores propios que le dicen al repositorio qué campos y relaciones incluir en la consulta SQL.

### @DtoField()

Marca un campo escalar. El repositorio lo incluye en el `SELECT`.

```typescript
import { DtoField } from 'src/shared';

export class ProductDto {
    @ApiProperty() @DtoField() id: number;
    @ApiProperty() @DtoField() name: string;
    @ApiProperty() @DtoField() salePrice: number;
    @ApiProperty() @DtoField() active: boolean;
}
```

### @DtoRelation()

Marca una relación. El repositorio hace el `JOIN` automáticamente y transforma la relación al DTO indicado.

```typescript
export class ProductDto {
    @ApiProperty() @DtoField() id: number;
    @ApiProperty() @DtoField() name: string;

    @ApiProperty({ type: () => CategoryDto })
    @DtoRelation(() => CategoryDto)
    category: CategoryDto;
}
```

**Regla importante:** todo campo que quieras que aparezca en la respuesta debe tener `@DtoField()` o `@DtoRelation()`. Sin el decorador, el campo no se consulta ni se expone, aunque exista en la entidad.

---

## Entidades base

En `src/database/entities/base.entity.ts` hay tres clases abstractas para las columnas de auditoría. Elegí la que corresponde según las columnas reales de la tabla en la base de datos:

| Clase | Columnas que agrega | Cuándo usar |
|---|---|---|
| `BaseCreated` | `created_at` | Registros inmutables (audit_log, stock_movements) |
| `BaseCreatedUpdated` | `created_at`, `updated_at` | La mayoría de las tablas editables |
| `BaseEntitySoftDelete` | `created_at`, `updated_at`, `deleted_at` | Tablas con soft delete |

```typescript
import { BaseCreatedUpdated } from 'src/database/entities/base.entity';

@Entity('products')
export class Product extends BaseCreatedUpdated {
    @PrimaryGeneratedColumn({ name: 'product_id', type: 'int' })
    id: number;
    // ...
}
```

Si la tabla no tiene ninguna columna de timestamp (catálogos fijos como `roles`, `payment_methods`), no extendas ninguna base.

---

## Paginación

Para endpoints que listan recursos:

**Controller:**

```typescript
import { PaginationParamsDto } from 'src/shared';

@Get()
@CashierUp()
@ApiOkResponse({ type: ProductDto, isArray: true })
findAll(@Query() pagination: PaginationParamsDto) {
    return this.service.findAll(pagination);
}
```

**Servicio:**

```typescript
async findAll(pagination: PaginationParamsDto): Promise<PaginationResponseDto<ProductDto>> {
    return this.repo.findPaginated({ dto: ProductDto, pagination });
}
```

**Respuesta:**

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}
```

El cliente envía `?page=2&limit=20` como query params. Defaults: `page=1`, `limit=10`.

---

## Manejo de errores

Todos los errores de dominio son clases que extienden las excepciones HTTP de NestJS. Se lanzan directamente desde el servicio.

```typescript
// exceptions/product-not-found.exception.ts
import { NotFoundException } from '@nestjs/common';

export class ProductNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Product not found.', error: 'PRODUCT_NOT_FOUND' });
    }
}
```

```typescript
// En el servicio:
if (!product) throw new ProductNotFoundException();
```

El filtro global `HttpExceptionFilter` convierte cualquier excepción HTTP en la forma estándar:

```json
{
  "statusCode": 404,
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product not found.",
  "path": "/api/products/99",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Exportá las excepciones del módulo desde `exceptions/index.ts`.

---

## Audit log

`AuditLogModule` es un módulo global. Podés inyectar `AuditLogService` en cualquier servicio sin importar nada extra en el módulo.

```typescript
constructor(private readonly auditLog: AuditLogService) {}

await this.auditLog.create({
    action: 'price_changed',
    module: 'products',
    userId: currentUser.id,
    usernameSnapshot: currentUser.username,
    roleSnapshot: 'administrator',
    previousValue: oldPrice.toString(),
    newValue: newPrice.toString(),
});
```

Las acciones válidas están definidas en la entidad `AuditLog` (campo `action`). No registres acciones fuera de esa lista.

---

## Agregar un endpoint nuevo — ejemplo completo

Objetivo: crear `GET /products` que lista productos activos con paginación.

**1. DTO de salida** (`dto/product.dto.ts`):

```typescript
export class ProductDto {
    @ApiProperty() @DtoField() id: number;
    @ApiProperty() @DtoField() name: string;
    @ApiProperty() @DtoField() salePrice: number;
    @ApiProperty() @DtoField() currentStock: number;
    @ApiProperty({ type: () => CategoryDto }) @DtoRelation(() => CategoryDto) category: CategoryDto;
}
```

**2. Servicio** (`services/products.service.ts`):

```typescript
async findAll(pagination: PaginationParamsDto): Promise<PaginationResponseDto<ProductDto>> {
    return this.repo.findPaginated({
        dto: ProductDto,
        pagination,
        where: { active: true },
        order: { name: 'ASC' },
    });
}
```

**3. Controller** (`controllers/products.controller.ts`):

```typescript
@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly service: ProductsService) {}

    @Get()
    @CashierUp()
    @ApiOkResponse({ type: ProductDto, isArray: true })
    findAll(@Query() pagination: PaginationParamsDto) {
        return this.service.findAll(pagination);
    }
}
```

El endpoint aparece automáticamente en Swagger en `/api/docs`.

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/cafeteria
JWT_SECRET=una-clave-secreta-larga
JWT_TIME_EXPIRE=8h
NODE_ENV=development
PORT=3000
```

Las variables se validan al arrancar con Joi. Si falta una requerida, el servidor no inicia y muestra qué falta.

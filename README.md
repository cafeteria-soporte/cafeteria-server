# TPS Cafetería — Backend NestJS

Sistema de procesamiento transaccional para una cafetería comercial. Esta guía explica desde cero cómo trabajar con la arquitectura del proyecto: qué herramientas hay disponibles, cómo se estructura un módulo, y cómo se ve un CRUD completo siguiendo las convenciones del proyecto.

---

## Tabla de contenidos

1. [Setup inicial](#1-setup-inicial)
2. [Estructura de carpetas](#2-estructura-de-carpetas)
3. [Autenticación y roles](#3-autenticación-y-roles)
4. [Cómo se ve un CRUD completo](#4-cómo-se-ve-un-crud-completo)
5. [DtoRepository — acceso a datos](#5-dtorepository--acceso-a-datos)
6. [@DtoField y @DtoRelation — decoradores de DTO](#6-dtofield-y-dtorelation--decoradores-de-dto)
7. [FindOptions\<T\> — servicios genéricos](#7-findoptionst--servicios-genéricos)
8. [Paginación](#8-paginación)
9. [Excepciones de dominio](#9-excepciones-de-dominio)
10. [Decoradores de Swagger para errores](#10-decoradores-de-swagger-para-errores)
11. [Entidades base](#11-entidades-base)
12. [Módulos existentes y sus servicios](#12-módulos-existentes-y-sus-servicios)
13. [Audit Log — registrar eventos](#13-audit-log--registrar-eventos)

---

## 1. Setup inicial

```bash
npm install
```

Crear el archivo `.env` en la raíz del proyecto (copiar de `.env.example`):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/cafeteria
JWT_SECRET=una-clave-secreta-larga
JWT_TIME_EXPIRE=8h
NODE_ENV=development
PORT=3000
```

```bash
npm run start:dev   # servidor con hot-reload
npm run seed        # inserta roles y usuario root inicial
```

La API corre en `http://localhost:3000/api`.  
Swagger UI en `http://localhost:3000/api/docs` — ahí se puede probar todo.

**Para autenticarse en Swagger:** hacé login con el endpoint `POST /auth/login`, copiá el `accessToken` de la respuesta, y pegalo en el botón **Authorize** arriba a la derecha. A partir de ahí todos los requests llevan el token automáticamente.

---

## 2. Estructura de carpetas

```
src/
├── app/                   # Módulos transversales de la aplicación
│   ├── auth/              # Login, registro, guards, JWT
│   └── health/            # Healthcheck del servidor
│
├── modules/               # Módulos de dominio, agrupados por área
│   ├── user-management/   → roles, users
│   ├── product-catalog/   → categories, products
│   ├── inventory/         → stock-movement-types, stock-movements
│   ├── pos/               → payment-methods, shift-records, user-orders, order-items, order-payments
│   └── system-config/     → global-settings, audit-log
│
├── shared/                # Utilidades reutilizables en todo el proyecto
│   ├── decorators/        → @CurrentUser()
│   ├── dto/               → PaginationParamsDto, PaginationResponseDto, FindOptions<T>
│   ├── enums/             → RolesEnum
│   ├── filters/           → HttpExceptionFilter (formato global de errores)
│   ├── orm/               → DtoRepository, @DtoField(), @DtoRelation()
│   └── utils/
│       ├── crypto.util    → hashPassword, comparePassword
│       └── swagger/       → ApiNotFound(), ApiValidationError(), etc.
│
└── database/
    ├── entities/          → BaseCreated, BaseCreatedUpdated, BaseEntitySoftDelete
    └── seeds/             → seed.ts
```

Dentro de cada módulo la estructura es siempre la misma:

```
mi-modulo/
├── controllers/
│   └── mi-modulo.controller.ts
├── dto/
│   ├── mi-recurso.dto.ts        # DTO de salida (respuesta)
│   └── in/
│       ├── create-mi-recurso.dto.ts
│       └── update-mi-recurso.dto.ts
├── entities/
│   └── mi-recurso.entity.ts
├── exceptions/
│   ├── mi-recurso-not-found.exception.ts
│   └── index.ts
├── services/
│   └── mi-modulo.service.ts
└── mi-modulo.module.ts
```

---

## 3. Autenticación y roles

Todos los endpoints requieren token JWT **por defecto**. Para excluir un endpoint del token se usa `@Public()`.

### Decoradores de roles

Se ponen sobre el método del controller. Cada uno verifica que el usuario tenga el rol indicado **o superior** (menor número = más privilegios: root=1, administrator=2, cashier=3).

```typescript
import { RootOnly, AdministratorUp, CashierUp, Public } from 'src/app/auth/decorators';

@RootOnly()         // solo root puede acceder
@AdministratorUp()  // administrator o root
@CashierUp()        // cualquier usuario autenticado (cashier, administrator, root)
@Public()           // sin token requerido
```

Estos decoradores también agregan automáticamente la respuesta 403 en Swagger.

### Obtener el usuario autenticado

En cualquier controller se puede inyectar el usuario del token con `@CurrentUser()`:

```typescript
import { CurrentUser } from 'src/shared';
import type { AuthUser } from 'src/app/auth/strategies/jwt.strategy';

// El objeto completo { id, username, roleId, requiresPwdChange }
@Get('mi-perfil')
@CashierUp()
getProfile(@CurrentUser() user: AuthUser) {
    return this.service.findProfile(user.id);
}

// Solo un campo específico
@Post()
@AdministratorUp()
create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: number) {
    return this.service.create(dto, userId);
}
```

`AuthUser` tiene estos campos: `id`, `username`, `roleId`, `requiresPwdChange`.

---

## 4. Cómo se ve un CRUD completo

Ejemplo real de principio a fin: módulo `products`.

### 4.1 Entidad

```typescript
// entities/product.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseCreatedUpdated } from 'src/database/entities/base.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product extends BaseCreatedUpdated {
    @PrimaryGeneratedColumn({ name: 'product_id', type: 'int' })
    id: number;

    @Column({ name: 'category_id', type: 'int' })
    categoryId: number;

    @Column({ name: 'name', type: 'varchar', length: 150 })
    name: string;

    @Column({ name: 'sale_price', type: 'decimal', precision: 10, scale: 2 })
    salePrice: number;

    @Column({ name: 'current_stock', type: 'int', default: 0 })
    currentStock: number;

    @Column({ name: 'min_stock', type: 'int', default: 0 })
    minStock: number;

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category?: Category;
}
```

**Regla:** el nombre de la columna en la base de datos (`name: 'sale_price'`) y el nombre en TypeScript (`salePrice`) pueden ser distintos — TypeORM mapea automáticamente.

### 4.2 DTO de salida

El DTO define **qué campos se devuelven** en la respuesta. Solo los campos con `@DtoField()` o `@DtoRelation()` se incluyen en el SELECT y en la respuesta JSON.

```typescript
// dto/product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DtoField, DtoRelation } from 'src/shared';
import { CategoryDto } from '../../categories/dto/category.dto';

export class ProductDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'Café con leche', maxLength: 150 })
    @DtoField()
    name: string;

    @ApiProperty({ example: 15.50 })
    @DtoField()
    salePrice: number;

    @ApiProperty({ example: 20 })
    @DtoField()
    currentStock: number;

    @ApiProperty({ example: 5 })
    @DtoField()
    minStock: number;

    @ApiProperty({ example: true })
    @DtoField()
    active: boolean;

    @ApiProperty({ type: () => CategoryDto })
    @DtoRelation(() => CategoryDto)
    category: CategoryDto;
}
```

### 4.3 DTOs de entrada

Los DTOs de entrada validan el body del request con `class-validator`.

```typescript
// dto/in/create-product.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
    @ApiProperty({ example: 1, description: 'ID de la categoría' })
    @IsInt()
    categoryId: number;

    @ApiProperty({ example: 'Café con leche', maxLength: 150 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @ApiProperty({ example: 15.50 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    salePrice: number;
}
```

```typescript
// dto/in/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

`PartialType` hace todos los campos opcionales y preserva las validaciones y los decoradores de Swagger.

### 4.4 Excepciones

```typescript
// exceptions/product-not-found.exception.ts
import { NotFoundException } from '@nestjs/common';

export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

export class ProductNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Product not found.', error: PRODUCT_NOT_FOUND });
    }
}
```

```typescript
// exceptions/index.ts
export * from './product-not-found.exception';
```

El formato es siempre el mismo: `message` es texto legible, `error` es `SCREAMING_SNAKE_CASE`. El filtro global `HttpExceptionFilter` convierte esto al formato estándar de respuesta.

### 4.5 Servicio

```typescript
// services/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtoRepository } from 'src/shared';
import { Product } from '../entities/product.entity';
import { ProductDto } from '../dto/product.dto';
import { CreateProductDto } from '../dto/in/create-product.dto';
import { UpdateProductDto } from '../dto/in/update-product.dto';
import { PaginationParamsDto, PaginationResponseDto } from 'src/shared';
import { ProductNotFoundException } from '../exceptions';

@Injectable()
export class ProductsService {
    private readonly repo: DtoRepository<Product>;

    constructor(
        @InjectRepository(Product)
        private readonly rawRepo: Repository<Product>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }

    async findAll(pagination: PaginationParamsDto): Promise<PaginationResponseDto<ProductDto>> {
        return this.repo.findPaginated({
            dto: ProductDto,
            pagination,
            where: { active: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: number): Promise<ProductDto> {
        const product = await this.repo.findOne({ dto: ProductDto, where: { id } });
        if (!product) throw new ProductNotFoundException();
        return product;
    }

    async create(data: CreateProductDto): Promise<ProductDto> {
        const product = new Product();
        product.categoryId = data.categoryId;
        product.name       = data.name.trim();
        product.salePrice  = data.salePrice;

        const saved = await this.rawRepo.save(product);
        return this.findOne(saved.id);
    }

    async update(id: number, data: UpdateProductDto): Promise<ProductDto> {
        await this.findOne(id); // lanza 404 si no existe
        await this.rawRepo.update(id, {
            ...(data.name       !== undefined && { name: data.name.trim() }),
            ...(data.salePrice  !== undefined && { salePrice: data.salePrice }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        });
        return this.findOne(id);
    }
}
```

**Puntos importantes:**
- El servicio **nunca devuelve entidades**, siempre DTOs.
- Para insertar y actualizar se usa `rawRepo` (el Repository de TypeORM). Para leer se usa `repo` (el DtoRepository).
- Después de un `save` se hace una segunda lectura con `findOne` para devolver el DTO completo con relaciones.

### 4.6 Controller

```typescript
// controllers/products.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { ProductDto } from '../dto/product.dto';
import { CreateProductDto } from '../dto/in/create-product.dto';
import { UpdateProductDto } from '../dto/in/update-product.dto';
import { PaginationParamsDto } from 'src/shared';
import { AdministratorUp, CashierUp } from 'src/app/auth/decorators';
import { ApiNotFound, ApiValidationError } from 'src/shared/utils/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly service: ProductsService) {}

    @Get()
    @CashierUp()
    @ApiOperation({ summary: 'Listar productos activos' })
    @ApiOkResponse({ type: ProductDto, isArray: true })
    findAll(@Query() pagination: PaginationParamsDto) {
        return this.service.findAll(pagination);
    }

    @Get(':id')
    @CashierUp()
    @ApiOperation({ summary: 'Obtener producto por ID' })
    @ApiOkResponse({ type: ProductDto })
    @ApiNotFound()
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    @AdministratorUp()
    @ApiOperation({ summary: 'Crear producto' })
    @ApiCreatedResponse({ type: ProductDto })
    @ApiValidationError()
    create(@Body() dto: CreateProductDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @AdministratorUp()
    @ApiOperation({ summary: 'Actualizar producto' })
    @ApiOkResponse({ type: ProductDto })
    @ApiNotFound()
    @ApiValidationError()
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
        return this.service.update(id, dto);
    }
}
```

**Puntos importantes:**
- `ParseIntPipe` convierte el `:id` de string a number y lanza 400 si no es un número.
- El controller **no tiene lógica**. Solo recibe el request, llama al servicio, y devuelve el resultado.
- Siempre documentar el tipo de respuesta exitosa con `@ApiOkResponse` o `@ApiCreatedResponse`.

### 4.7 Módulo

```typescript
// products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule {}
```

**Siempre poner `exports: [ProductsService]`** para que otros módulos puedan inyectar el servicio.

---

## 5. DtoRepository — acceso a datos

`DtoRepository<E>` es el repositorio de este proyecto. Envuelve el `Repository<E>` de TypeORM y devuelve DTOs directamente en lugar de entidades.

**Por qué existe:** con TypeORM normal tendrías que hacer `findOne()` y después convertir manualmente con `plainToInstance()`. `DtoRepository` hace eso automáticamente, además de construir el `SELECT` y los `JOIN` leyendo los decoradores del DTO — solo se consulta lo que el DTO declara exponer.

### Cómo inicializarlo

```typescript
@Injectable()
export class MiService {
    private readonly repo: DtoRepository<MiEntidad>;

    constructor(
        @InjectRepository(MiEntidad)
        private readonly rawRepo: Repository<MiEntidad>,
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}
```

Hay dos repositorios: `repo` (el DtoRepository) para lecturas, y `rawRepo` (TypeORM puro) para escrituras (`save`, `update`, `delete`).

### Métodos

#### `findOne` — un registro o null

```typescript
const product = await this.repo.findOne({
    dto: ProductDto,
    where: { id: 5 },
});
// Devuelve ProductDto | null
```

#### `find` — array de registros

```typescript
const products = await this.repo.find({
    dto: ProductDto,
    where: { active: true },
    order: { name: 'ASC' },
});
// Devuelve ProductDto[]
```

#### `findAndCount` — array + total (para paginación manual)

```typescript
const [products, total] = await this.repo.findAndCount({
    dto: ProductDto,
    where: { active: true },
    skip: 0,
    take: 10,
});
```

#### `findPaginated` — paginación automática

```typescript
const result = await this.repo.findPaginated({
    dto: ProductDto,
    pagination,            // PaginationParamsDto con page y limit
    where: { active: true },
    order: { createdAt: 'DESC' },
});
// Devuelve { data: ProductDto[], meta: { page, limit, total, pages } }
```

### Filtros y ordenamiento

Todos los métodos aceptan las mismas opciones de TypeORM (`where`, `order`, etc.), excepto `select` y `relations` que son manejados automáticamente por el repositorio.

```typescript
// Filtro por campo de relación
await this.repo.find({
    dto: ProductDto,
    where: { category: { id: 2 } },
});

// Ordenamiento múltiple
await this.repo.find({
    dto: ProductDto,
    order: { active: 'DESC', name: 'ASC' },
});

// Múltiples condiciones
await this.repo.find({
    dto: ProductDto,
    where: [
        { active: true, categoryId: 1 },
        { active: true, categoryId: 2 },
    ],
});
```

---

## 6. @DtoField y @DtoRelation — decoradores de DTO

Estos dos decoradores son la clave de cómo funciona el proyecto. Le dicen al `DtoRepository` qué columnas incluir en el `SELECT` y qué relaciones hacer `JOIN`.

### @DtoField()

Marca un campo escalar (número, string, boolean, Date). El repositorio lo incluye en el `SELECT`.

```typescript
import { DtoField } from 'src/shared';

export class ProductDto {
    @DtoField() id: number;
    @DtoField() name: string;
    @DtoField() salePrice: number;
    @DtoField() active: boolean;
    @DtoField() createdAt: Date;
}
```

### @DtoRelation()

Marca una relación con otra entidad. El repositorio hace el `JOIN` automáticamente y transforma la relación al DTO indicado (recursivamente).

```typescript
import { DtoRelation } from 'src/shared';

export class ProductDto {
    @DtoField() id: number;
    @DtoField() name: string;

    @DtoRelation(() => CategoryDto)   // recibe una función que devuelve el DTO de la relación
    category: CategoryDto;
}
```

Se usa la forma `() => CategoryDto` (función) en lugar de `CategoryDto` directamente para evitar referencias circulares cuando dos DTOs se referencian entre sí.

### Por qué todo campo del DTO necesita el decorador

Sin `@DtoField()` o `@DtoRelation()`, el campo **no aparece en la respuesta**, aunque exista en la entidad. Esto es intencional: el DTO es la lista explícita de lo que se expone.

```typescript
export class ProductDto {
    @DtoField() id: number;
    @DtoField() name: number;
    // salePrice sin @DtoField → NO se consulta, NO aparece en la respuesta
    salePrice: number;
}
```

### Combinar con @ApiProperty

En DTOs que se usan en endpoints, siempre combinar con `@ApiProperty` para que Swagger muestre el campo:

```typescript
export class ProductDto {
    @ApiProperty({ example: 1 })
    @DtoField()
    id: number;

    @ApiProperty({ example: 'Café con leche' })
    @DtoField()
    name: string;

    @ApiProperty({ type: () => CategoryDto })
    @DtoRelation(() => CategoryDto)
    category: CategoryDto;
}
```

Los DTOs internos que no se usan en endpoints (como `UserAuthDto` para la autenticación interna) no necesitan `@ApiProperty`.

---

## 7. FindOptions\<T\> — servicios genéricos

`FindOptions<T>` sirve cuando un método del servicio puede devolver distintos DTOs dependiendo de quién lo llame.

```typescript
export interface FindOptions<T> {
    dto: new () => T;
    throwException?: boolean;
}
```

### Cuándo usarlo

El caso más común: el mismo `findOne` puede devolver un DTO público para el controller, o un DTO interno con campos sensibles para otro servicio (como auth).

```typescript
// En el servicio:
async findOneById<T>(id: number, options: FindOptions<T>): Promise<T | null> {
    const result = await this.repo.findOne({ dto: options.dto, where: { id } });
    if (options.throwException && !result) throw new UserNotFoundException();
    return result;
}

// Desde el controller — devuelve UserDto (público):
const user = await this.usersService.findOneById(id, {
    dto: UserDto,
    throwException: true,
});

// Desde auth service — devuelve UserAuthDto (con passwordHash y campos de seguridad):
const user = await this.usersService.findOneById(id, {
    dto: UserAuthDto,
    throwException: false,
});
```

### Nota de TypeScript

Si TypeScript no puede inferir el tipo genérico, declararlo explícitamente:

```typescript
const opts: FindOptions<UserAuthDto> = { throwException: false, dto: UserAuthDto };
const user = await this.usersService.findOneByUsername(username, opts);
```

---

## 8. Paginación

### En el controller

```typescript
import { PaginationParamsDto } from 'src/shared';

@Get()
@CashierUp()
findAll(@Query() pagination: PaginationParamsDto) {
    return this.service.findAll(pagination);
}
```

El cliente manda los parámetros como query string: `GET /products?page=2&limit=20`.  
Si no manda nada, los defaults son `page=1`, `limit=10`.

### En el servicio

```typescript
import { PaginationParamsDto, PaginationResponseDto } from 'src/shared';

async findAll(pagination: PaginationParamsDto): Promise<PaginationResponseDto<ProductDto>> {
    return this.repo.findPaginated({ dto: ProductDto, pagination });
}
```

### Respuesta

```json
{
  "data": [
    { "id": 1, "name": "Café con leche", "salePrice": 15.50, ... },
    { "id": 2, "name": "Empanada", "salePrice": 8.00, ... }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

### Agregar filtros a la paginación

Extender `PaginationParamsDto` para agregar parámetros de búsqueda propios:

```typescript
import { PaginationParamsDto } from 'src/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindProductsDto extends PaginationParamsDto {
    @ApiPropertyOptional({ example: 'café' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    active?: boolean;
}
```

```typescript
// En el servicio, construir el where dinámicamente:
async findAll(params: FindProductsDto): Promise<PaginationResponseDto<ProductDto>> {
    return this.repo.findPaginated({
        dto: ProductDto,
        pagination: params,
        where: {
            ...(params.active !== undefined && { active: params.active }),
        },
        order: { name: 'ASC' },
    });
}
```

---

## 9. Excepciones de dominio

Todas las excepciones de dominio siguen el mismo patrón: extienden una excepción HTTP de NestJS y pasan un objeto `{ message, error }`.

```typescript
import { NotFoundException } from '@nestjs/common';

export const PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND';

export class ProductNotFoundException extends NotFoundException {
    constructor() {
        super({ message: 'Product not found.', error: PRODUCT_NOT_FOUND });
    }
}
```

El `HttpExceptionFilter` convierte cualquier excepción HTTP al formato estándar:

```json
{
  "statusCode": 404,
  "error": "PRODUCT_NOT_FOUND",
  "message": "Product not found.",
  "path": "/api/products/99",
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

### Clases base disponibles

| Clase NestJS | HTTP | Cuándo usar |
|---|---|---|
| `NotFoundException` | 404 | Recurso no encontrado |
| `ConflictException` | 409 | Duplicado (username, email, etc.) |
| `BadRequestException` | 400 | Datos inválidos por lógica de negocio |
| `ForbiddenException` | 403 | Sin permiso para esa acción específica |
| `UnauthorizedException` | 401 | No autenticado |
| `UnprocessableEntityException` | 422 | Datos válidos pero estado inválido (ej. turno ya cerrado) |

### Reglas de formato

- `message`: texto legible, puede tener espacios y minúsculas. Termina en punto.
- `error`: `SCREAMING_SNAKE_CASE`, resume el tipo de error. Sin artículos ni preposiciones.

```typescript
// Bien:
super({ message: 'Username already taken.', error: 'USERNAME_ALREADY_TAKEN' });

// Mal — error con espacios o minúsculas:
super({ message: 'Username already taken.', error: 'username already taken' });
super('Username already taken.');  // NestJS pone error: 'Not Found' — no usar
```

### Exportar desde index.ts

```typescript
// exceptions/index.ts
export * from './product-not-found.exception';
export * from './product-name-conflict.exception';
```

---

## 10. Decoradores de Swagger para errores

En `src/shared/utils/swagger` hay decoradores listos para documentar las respuestas de error en el controller, sin repetir código.

```typescript
import {
    ApiNotFound,
    ApiValidationError,
    ApiUnauthorized,
    ApiForbidden,
    ApiConflict,
    ApiUnprocessableEntity,
} from 'src/shared/utils/swagger';
```

Se aplican sobre el método del controller junto con los decoradores de respuesta exitosa:

```typescript
@Get(':id')
@CashierUp()
@ApiOperation({ summary: 'Obtener producto por ID' })
@ApiOkResponse({ type: ProductDto })       // respuesta exitosa
@ApiNotFound()                              // 404 si no existe
findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
}

@Post()
@AdministratorUp()
@ApiOperation({ summary: 'Crear producto' })
@ApiCreatedResponse({ type: ProductDto })  // 201 en éxito
@ApiValidationError()                       // 400 si el body no es válido
@ApiConflict()                              // 409 si ya existe
create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
}

@Patch(':id')
@AdministratorUp()
@ApiOperation({ summary: 'Actualizar producto' })
@ApiOkResponse({ type: ProductDto })
@ApiNotFound()
@ApiValidationError()
update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
}
```

---

## 11. Entidades base

En `src/database/entities/base.entity.ts` hay tres clases abstractas con columnas de auditoría de timestamp. Elegir según las columnas reales que tiene la tabla en la base de datos.

```typescript
import { BaseCreated, BaseCreatedUpdated, BaseEntitySoftDelete } from 'src/database/entities/base.entity';
```

| Clase | Columnas que agrega | Usar cuando |
|---|---|---|
| `BaseCreated` | `created_at` | Registros inmutables: `audit_log`, `stock_movements` |
| `BaseCreatedUpdated` | `created_at`, `updated_at` | La mayoría de tablas editables |
| `BaseEntitySoftDelete` | `created_at`, `updated_at`, `deleted_at` | Tablas con borrado lógico |

Si la tabla no tiene ningún timestamp (catálogos fijos como `roles`, `payment_methods`), no extender ninguna base.

```typescript
// Tabla con created_at y updated_at:
@Entity('products')
export class Product extends BaseCreatedUpdated { ... }

// Tabla solo con created_at (inmutable):
@Entity('stock_movements')
export class StockMovement extends BaseCreated { ... }

// Tabla sin timestamps (catálogo fijo):
@Entity('roles')
export class Role { ... }
```

---

## 12. Módulos existentes y sus servicios

Todos los módulos exportan su servicio. Para usar el servicio de otro módulo: importar el módulo en el `imports` del módulo propio e inyectar el servicio en el constructor.

```typescript
// En mi-modulo.module.ts:
@Module({
    imports: [
        TypeOrmModule.forFeature([MiEntidad]),
        ProductsModule,     // importar el módulo externo
    ],
    providers: [MiService],
    controllers: [MiController],
})
export class MiModule {}

// En mi-modulo.service.ts:
constructor(
    @InjectRepository(MiEntidad) rawRepo: Repository<MiEntidad>,
    private readonly productsService: ProductsService,   // inyectar el servicio
) {
    this.repo = new DtoRepository(rawRepo);
}
```

### Módulos disponibles

| Módulo | Servicio | Exporta |
|---|---|---|
| `RolesModule` | `RolesService` | Sí |
| `UsersModule` | `UsersService` | Sí |
| `CategoriesModule` | `CategoriesService` | Sí |
| `ProductsModule` | `ProductsService` | Sí |
| `StockMovementTypesModule` | `StockMovementTypesService` | Sí |
| `StockMovementsModule` | `StockMovementsService` | Sí |
| `PaymentMethodsModule` | `PaymentMethodsService` | Sí |
| `ShiftRecordsModule` | `ShiftRecordsService` | Sí |
| `UserOrdersModule` | `UserOrdersService` | Sí |
| `OrderItemsModule` | `OrderItemsService` | Sí |
| `OrderPaymentsModule` | `OrderPaymentsService` | Sí |
| `GlobalSettingsModule` | `GlobalSettingsService` | Sí |
| `AuditLogModule` | `AuditLogService` | Sí — **global**, no necesita importar el módulo |

### AuditLogService — módulo global

`AuditLogModule` está marcado como `@Global()`, lo que significa que `AuditLogService` se puede inyectar en cualquier servicio **sin importar el módulo**. Ver sección 13 para la guía completa.

---

## 13. Audit Log — registrar eventos

### Inyectar el servicio

`AuditLogModule` es `@Global()` — no hace falta agregarlo a `imports[]` del módulo propio.

```typescript
import { AuditLogService } from 'src/modules/system-config/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product) rawRepo: Repository<Product>,
        private readonly auditLog: AuditLogService,   // sin tocar el módulo
    ) {
        this.repo = new DtoRepository(rawRepo);
    }
}
```

### Firma de `create()`

```typescript
auditLog.create(data: CreateAuditLogDto): Promise<void>
```

### Campos de `CreateAuditLogDto`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `action` | `AuditAction` | **Sí** | Qué ocurrió (ver tabla abajo) |
| `module` | `AuditModule` | **Sí** | Módulo donde ocurrió (ver tabla abajo) |
| `userId` | `number \| null` | No | ID del usuario que ejecutó la acción. `null` si el usuario no existe (ej. login fallido con username inválido) |
| `usernameSnapshot` | `string \| null` | No | Username en el momento del evento. Snapshot — no cambia si el usuario se renombra |
| `roleSnapshot` | `string \| null` | No | Nombre del rol en el momento. Usar `ROLE_NAMES[actingUser.roleId]` |
| `affectedEntity` | `string \| null` | No | Nombre de la tabla afectada (`'users'`, `'products'`, etc.) |
| `entityId` | `number \| null` | No | ID del registro afectado |
| `previousValue` | `string \| null` | No | Valor anterior (para cambios de precio, configuración, etc.) |
| `newValue` | `string \| null` | No | Valor nuevo |
| `ip` | `string \| null` | No | IP del cliente (si se captura) |
| `device` | `string \| null` | No | User-agent o descripción del dispositivo |

### Valores de `AuditAction`

```typescript
import { AuditAction } from 'src/modules/system-config/audit-log/enums/audit-action.enum';
```

| Valor | Cuándo registrar |
|---|---|
| `AuditAction.LOGIN` | Login exitoso |
| `AuditAction.LOGOUT` | Cierre de sesión |
| `AuditAction.LOGIN_FAILED` | Credenciales inválidas |
| `AuditAction.USER_CREATED` | Se crea un nuevo usuario |
| `AuditAction.USER_DEACTIVATED` | Se desactiva una cuenta |
| `AuditAction.PASSWORD_CHANGED` | El usuario cambia su contraseña |
| `AuditAction.PRICE_CHANGED` | Se modifica el precio de un producto |
| `AuditAction.STOCK_ADJUSTED` | Ajuste manual de inventario |
| `AuditAction.SHRINKAGE_RECORDED` | Merma registrada |
| `AuditAction.SALE_PAID` | Venta confirmada y pagada |
| `AuditAction.SALE_VOIDED` | Venta anulada |
| `AuditAction.SHIFT_OPENED` | Apertura de turno de caja |
| `AuditAction.SHIFT_CLOSED` | Cierre de turno de caja |
| `AuditAction.SETTINGS_CHANGED` | Se modifica `global_settings` |

### Valores de `AuditModule`

```typescript
import { AuditModule } from 'src/modules/system-config/audit-log/enums/audit-module.enum';
```

| Valor | Módulo |
|---|---|
| `AuditModule.AUTH` | Login, logout, cambio de contraseña |
| `AuditModule.USERS` | Gestión de usuarios |
| `AuditModule.PRODUCTS` | Catálogo de productos |
| `AuditModule.INVENTORY` | Stock y movimientos |
| `AuditModule.SHIFTS` | Turnos de caja |
| `AuditModule.ORDERS` | Órdenes / ventas |
| `AuditModule.PAYMENTS` | Pagos |
| `AuditModule.SETTINGS` | Configuración global |

### Cómo obtener los datos del usuario que actúa

El controller recibe el usuario autenticado con `@CurrentUser()` y lo pasa al servicio:

```typescript
// Controller:
@Patch(':id/price')
@AdministratorUp()
async updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePriceDto,
    @CurrentUser() actingUser: AuthUser,   // <-- usuario del token
) {
    return this.service.updatePrice(id, dto, actingUser);
}

// Servicio:
const ROLE_NAMES: Record<number, string> = { 1: 'root', 2: 'administrator', 3: 'cashier' };

async updatePrice(id: number, dto: UpdatePriceDto, actingUser: AuthUser): Promise<ProductDto> {
    const product = await this.findOne(id);
    await this.rawRepo.update(id, { salePrice: dto.salePrice });

    await this.auditLog.create({
        action:           AuditAction.PRICE_CHANGED,
        module:           AuditModule.PRODUCTS,
        userId:           actingUser.id,
        usernameSnapshot: actingUser.username,
        roleSnapshot:     ROLE_NAMES[actingUser.roleId],
        affectedEntity:   'products',
        entityId:         id,
        previousValue:    product.salePrice.toString(),
        newValue:         dto.salePrice.toString(),
    });

    return this.findOne(id);
}
```

`AuthUser` viene del token JWT y tiene: `id`, `username`, `roleId`, `requiresPwdChange`. No tiene el nombre del rol — usar `ROLE_NAMES[actingUser.roleId]` para obtenerlo.

### Eventos sin usuario autenticado

Para `LOGIN_FAILED` con username inexistente, `userId` y las snapshots van en `null`:

```typescript
await this.auditLog.create({
    action:           AuditAction.LOGIN_FAILED,
    module:           AuditModule.AUTH,
    usernameSnapshot: dto.username,   // el username que intentó entrar
    userId:           null,           // no existe en la BD
    roleSnapshot:     null,
});
```

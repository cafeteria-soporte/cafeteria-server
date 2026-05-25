import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { RolesEnum } from 'src/shared';
import { ErrorResponseDto } from 'src/shared/dto';

export const ROLES_KEY = 'required_rol';

export const Roles = (requiredRol: number) =>
  SetMetadata(ROLES_KEY, requiredRol);

export const RootOnly = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, RolesEnum.ROOT),
    ApiForbiddenResponse({
      description: 'Se requiere rol root.',
      type: ErrorResponseDto,
    }),
  );

export const AdministratorUp = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, RolesEnum.ADMINISTRATOR),
    ApiForbiddenResponse({
      description: 'Se requiere rol administrador o superior.',
      type: ErrorResponseDto,
    }),
  );

export const CashierUp = () =>
  applyDecorators(
    SetMetadata(ROLES_KEY, RolesEnum.CASHIER),
    ApiForbiddenResponse({
      description: 'Debes estar autenticado.',
      type: ErrorResponseDto,
    }),
  );

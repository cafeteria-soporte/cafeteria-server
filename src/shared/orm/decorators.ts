import { Expose, Type } from 'class-transformer';

export const DTO_SELECT_KEY = Symbol('dto:select');
export const DTO_RELATION_KEY = Symbol('dto:relation');

export function DtoField(): PropertyDecorator {
  return (target, propertyKey) => {
    const fields: string[] = Reflect.getMetadata(DTO_SELECT_KEY, target) ?? [];
    Reflect.defineMetadata(
      DTO_SELECT_KEY,
      [...fields, propertyKey as string],
      target,
    );
    Expose()(target, propertyKey);
  };
}

export function DtoRelation(
  relatedCtor: () => new () => any,
): PropertyDecorator {
  return (target, propertyKey) => {
    const rels: { key: string; ctor: () => new () => any }[] =
      Reflect.getMetadata(DTO_RELATION_KEY, target) ?? [];
    Reflect.defineMetadata(
      DTO_RELATION_KEY,
      [...rels, { key: propertyKey as string, ctor: relatedCtor }],
      target,
    );
    Expose()(target, propertyKey);
    Type(relatedCtor)(target, propertyKey);
  };
}

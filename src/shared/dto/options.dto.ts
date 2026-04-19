import { EntityManager } from 'typeorm';

export interface FindOptions<T> {
    dto: new () => T,
    throwException?: boolean;
}

export interface MutationOptions {
    manager?: EntityManager;
}

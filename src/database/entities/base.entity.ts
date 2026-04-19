import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export abstract class BaseCreated {
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

export abstract class BaseCreatedUpdated extends BaseCreated {
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}

export abstract class BaseEntitySoftDelete extends BaseCreatedUpdated {
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date | null;
}

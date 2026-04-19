import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn({
        name: 'role_id',
        type: 'int',
    })
    id: number

    @Column({
        name: 'name',
        type: 'varchar',
        length: 50,
        nullable: false
    })
    name: string

    @OneToMany(() => User,(user) => user.role)
    users?: User[]
}

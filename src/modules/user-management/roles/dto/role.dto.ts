import { DtoField, DtoRelation } from "src/shared";

export class RoleDto {
    @DtoField()
    id: number

    @DtoField()
    name: string
}
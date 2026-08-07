import { IsUUID } from "class-validator";

export class InviteCreatorDto {
  @IsUUID()
  creatorId!: string;
}

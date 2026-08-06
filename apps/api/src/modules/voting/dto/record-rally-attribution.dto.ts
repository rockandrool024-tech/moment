import { IsUUID } from "class-validator";

export class RecordRallyAttributionDto {
  @IsUUID()
  creatorId!: string;

  @IsUUID()
  campaignId!: string;
}
